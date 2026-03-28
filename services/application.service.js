import logger from "../utils/logger.js";
import applicationRepository from "../repositories/application.repository.js";
import scholarshipRepository from "../repositories/scholarship.repository.js";
import emailService from "./email.service.js";
import notificationService from "./notification.service.js";
import BaseService from "./base.service.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";
import { generateApplicationId } from "../utils/idGenerator.js";
import {
  APPLICATION_STATUS,
  SCHOLARSHIP_STATUS,
  PAGINATION_DEFAULT_PAGE,
  PAGINATION_DEFAULT_LIMIT,
} from "../config/constants.js";
import {
  parsePagination,
  buildPaginatedResponse,
} from "../utils/pagination.js";

class ApplicationService extends BaseService {
  constructor() {
    super(applicationRepository, "Application");
  }

  generateApplicationId() {
    return generateApplicationId();
  }

  async getAll(filters = {}) {
    const {
      scholarshipId,
      status,
      search,
      page: rawPage = PAGINATION_DEFAULT_PAGE,
      limit: rawLimit = PAGINATION_DEFAULT_LIMIT,
    } = filters;

    const page = parseInt(rawPage) || PAGINATION_DEFAULT_PAGE;
    const limit = parseInt(rawLimit) || PAGINATION_DEFAULT_LIMIT;
    const { skip, take } = parsePagination(page, limit);

    // If search term is provided, use the specialized search method
    if (search && search.trim()) {
      const results = await applicationRepository.search(search.trim());
      // For simplicity in search, we'll return all results as there's no native paginated search in repo yet
      // but we wrap it in the same structure
      return buildPaginatedResponse(
        "applications",
        results,
        results.length,
        1,
        results.length,
      );
    }

    const where = {};
    if (scholarshipId) where.scholarshipId = scholarshipId;
    
    // Ensure status is valid before querying
    if (status && status !== 'all' && Object.values(APPLICATION_STATUS).includes(status)) {
      where.status = status;
    }

    const [applications, total] = await Promise.all([
      applicationRepository.findAllWithRelations(where, { skip, take }),
      applicationRepository.count(where),
    ]);

    return buildPaginatedResponse(
      "applications",
      applications,
      total,
      page,
      limit,
    );
  }

  async getByStatus(status) {
    return applicationRepository.findByStatus(status);
  }

  async getByScholarship(scholarshipId) {
    return applicationRepository.findByScholarshipId(scholarshipId);
  }

  async getStudentApplications(studentId) {
    return applicationRepository.findByStudentId(studentId);
  }

  async getStudentApplicationById(studentId, applicationId) {
    return applicationRepository.findByStudentAndId(studentId, applicationId);
  }

  async createApplication(studentId, applicationData) {
    const { scholarshipId, preferences, documents } = applicationData;

    if (!scholarshipId) throw new ValidationError("Scholarship ID is required");

    const scholarship = await scholarshipRepository.findByAnyId(scholarshipId);

    if (scholarship.status !== SCHOLARSHIP_STATUS.PUBLISHED) {
      throw new ValidationError(
        "Scholarship is not available for applications",
      );
    }
    if (new Date(scholarship.applicationDeadline) < new Date()) {
      throw new ValidationError("Application deadline has passed");
    }

    const existing = await applicationRepository.findExistingApplication(
      studentId,
      scholarshipId,
    );
    if (existing)
      throw new ValidationError(
        "You have already applied for this scholarship",
      );

    logger.debug("Creating new application", { studentId, scholarshipId });
    const applicationId = this.generateApplicationId();

    const application = await applicationRepository.create({
      applicationId,
      id: applicationId,
      studentId,
      scholarshipId,
      preferences: preferences || {},
      documents: documents || {},
      status: APPLICATION_STATUS.PENDING,
      submittedAt: new Date(),
      statusHistory: [
        {
          status: APPLICATION_STATUS.PENDING,
          timestamp: new Date(),
          note: "Application submitted",
        },
      ],
    });

    const populated = await applicationRepository.findByAnyId(application.id);

    emailService
      .sendNewApplicationNotificationToAdmin({
        applicationId: populated.applicationId || populated.id,
        student: populated.student,
        scholarship: populated.scholarship,
        submittedAt: populated.submittedAt,
      })
      .catch((error) =>
        logger.error("Failed to send admin notification (non-blocking)", {
          error: error.message,
        }),
      );

    notificationService.notifyNewApplication(populated);

    return populated;
  }

  async updateApplication(studentId, applicationId, updateData) {
    const application = await applicationRepository.findByStudentAndIdOrNull(
      studentId,
      applicationId,
    );

    if (!application) throw new NotFoundError("Application");
    if (application.status !== "pending") {
      throw new ValidationError(
        "Cannot update application after review has started",
      );
    }

    const { preferences, documents } = updateData;
    const updatePayload = {};

    if (preferences)
      updatePayload.preferences = {
        ...application.preferences,
        ...preferences,
      };
    if (documents)
      updatePayload.documents = { ...application.documents, ...documents };

    await applicationRepository.update(applicationId, updatePayload);
    return applicationRepository.findByAnyId(applicationId);
  }

  async create(applicationData) {
    const id = this.generateApplicationId();
    const application = await applicationRepository.create({
      ...applicationData,
      id,
      applicationId: id,
      status: "pending",
      submittedAt: new Date(),
      statusHistory: [
        {
          status: "pending",
          timestamp: new Date(),
          note: "Application submitted",
        },
      ],
    });
    return { id: application.id };
  }

  async updateStatus(applicationId, statusData, adminId) {
    const { status, adminNote, metadata } = statusData;

    const application = await applicationRepository.findByAnyId(applicationId);

    const historyEntry = {
      status,
      timestamp: new Date(),
      note: adminNote || "",
      adminId,
      metadata: metadata || {},
    };
    const applicationUpdateData = {
      status,
      statusHistory: [...application.statusHistory, historyEntry],
    };

    logger.debug("Updating application status", {
      applicationId,
      oldStatus: application.status,
      newStatus: status,
    });

    if (status === APPLICATION_STATUS.INTERVIEW && metadata) {
      applicationUpdateData.interviewDetails = {
        date: metadata.interviewDate || null,
        time: metadata.interviewTime || null,
        videoCallPlatform: metadata.videoCallPlatform || null,
        videoCallLink: metadata.videoCallLink || null,
        notes: metadata.interviewNotes || null,
        scheduledAt: new Date(),
      };
    }
    if (status === APPLICATION_STATUS.REJECTED && metadata?.rejectionReason) {
      applicationUpdateData.rejectionDetails = {
        reason: metadata.rejectionReason,
        feedback: metadata.rejectionFeedback || null,
        rejectedAt: new Date(),
      };
    }
    if (status === APPLICATION_STATUS.REVOKED && metadata) {
      applicationUpdateData.revocationDetails = {
        reason: metadata.revocationReason || null,
        details: metadata.revocationDetails || null,
        revokedAt: new Date(),
      };
    }
    if (status === APPLICATION_STATUS.ACCEPTED)
      applicationUpdateData.acceptedAt = new Date();
    if (status === APPLICATION_STATUS.INTERVIEW_PASSED)
      applicationUpdateData.interviewPassedAt = new Date();

    await applicationRepository.update(applicationId, applicationUpdateData);
    const populated = await applicationRepository.findByAnyId(applicationId);

    if (populated.student) {
      const { email, firstName = "Student" } = populated.student;
      const appId = populated.applicationId;
      const scholarshipTitle = populated.scholarship?.title || "Scholarship";

      const notificationPromise = (async () => {
        if (status === "interview") {
          await emailService.sendInterviewNotification(email, firstName, {
            applicationId: appId,
            scholarshipTitle,
            interviewDate: metadata?.interviewDate,
            interviewTime: metadata?.interviewTime,
            videoCallPlatform: metadata?.videoCallPlatform,
            videoCallLink: metadata?.videoCallLink,
            notes: metadata?.interviewNotes,
            adminNote: adminNote,
          });
        } else if (status === "interview_passed") {
          await emailService.sendInterviewPassedNotification(email, firstName, {
            applicationId: appId,
            scholarshipTitle,
            adminNote: adminNote,
          });
        } else if (
          status === "rejected" &&
          metadata?.rejectionReason === "interview_failed"
        ) {
          await emailService.sendInterviewFailedNotification(email, firstName, {
            applicationId: appId,
            scholarshipTitle,
            failureReason:
              metadata?.interviewFailureReason ||
              metadata?.rejectionFeedback ||
              "Interview did not meet requirements",
            adminNote: adminNote,
          });
        } else if (status === APPLICATION_STATUS.ACCEPTED) {
          await emailService.sendAdmissionNotification(email, firstName, {
            applicationId: appId,
            scholarshipTitle,
            adminNote: adminNote,
          });
        } else if (status === APPLICATION_STATUS.UNDER_REVIEW) {
          await emailService.sendApplicationReviewNotification(email, firstName, {
            applicationId: appId,
            scholarshipTitle,
            adminNote: adminNote,
          });
        } else if (status === "revoked") {
          await emailService.sendRevokedNotification(email, firstName, {
            applicationId: appId,
            scholarshipTitle,
            revocationReason:
              metadata?.revocationReason || "Missing documents or information",
            revocationDetails: metadata?.revocationDetails || "",
            adminNote: adminNote,
          });
        }
      })();
      notificationPromise.catch((error) =>
        logger.error("Failed to send status notification email", {
          error: error.message,
        }),
      );
    }

    await this.logAudit(adminId, "UPDATE_APPLICATION_STATUS", applicationId, {
      status,
      adminNote,
    });

    return populated;
  }

  async delete(applicationId, adminId) {
    return super.delete(applicationId, adminId);
  }

  async search(term) {
    return applicationRepository.search(term);
  }

  async uploadAdminDocument(applicationId, documentType, filePath, adminId) {
    if (!["admission", "jw202"].includes(documentType)) {
      throw new ValidationError(
        'Invalid document type. Must be "admission" or "jw202"',
      );
    }

    const application = await applicationRepository.findByAnyId(applicationId);

    if (application.status !== APPLICATION_STATUS.ACCEPTED) {
      throw new ValidationError(
        "Documents can only be uploaded for accepted applications",
      );
    }

    logger.debug("Uploading admin document", {
      applicationId,
      documentType,
      url: filePath,
    });

    const docField =
      documentType === "admission" ? "admissionDocument" : "jw202Document";

    await applicationRepository.update(applicationId, {
      [docField]: {
        path: filePath,
        uploadedAt: new Date(),
        uploadedBy: adminId, // Using adminId for record consistency
      },
    });

    const populated = await applicationRepository.findByAnyId(applicationId);

    await this.logAudit(adminId, "UPLOAD_ADMIN_DOCUMENT", applicationId, {
      documentType,
      filePath,
    });

    if (populated.student) {
      emailService
        .sendDocumentUploadedNotification(
          populated.student.email,
          populated.student.firstName || "Student",
          {
            applicationId: populated.applicationId,
            scholarshipTitle: populated.scholarship?.title || "Scholarship",
            documentType:
              documentType === "admission" ? "Admission Letter" : "JW202 Form",
            documentPath: filePath,
          },
        )
        .catch((error) =>
          logger.error("Failed to send document upload notification email", {
            error: error.message,
          }),
        );
    }

    return populated;
  }
}

export default new ApplicationService();
