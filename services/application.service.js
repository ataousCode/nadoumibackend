import logger from '../utils/logger.js'
import applicationRepository from '../repositories/application.repository.js'
import scholarshipRepository from '../repositories/scholarship.repository.js'
import emailService from './email.service.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'
import { generateApplicationId } from '../utils/idGenerator.js'
import { APPLICATION_STATUS, SCHOLARSHIP_STATUS, PAGINATION_DEFAULT_PAGE, PAGINATION_DEFAULT_LIMIT } from '../config/constants.js'
import { parsePagination, buildPaginatedResponse } from '../utils/pagination.js'

// Internal helper — try to send an email without blocking the main flow
async function tryEmail(fn, label) {
  try {
    await fn()
  } catch (error) {
    logger.error(label, { error: error.message })
  }
}

class ApplicationService {
  generateApplicationId() {
    return generateApplicationId()
  }

  async getAll(filters = {}) {
    const { scholarshipId, status, page = PAGINATION_DEFAULT_PAGE, limit = PAGINATION_DEFAULT_LIMIT } = filters
    const where = {}
    if (scholarshipId) where.scholarshipId = scholarshipId
    if (status)        where.status = status

    const { skip, take } = parsePagination(page, limit)

    const [applications, total] = await Promise.all([
      applicationRepository.findAllWithRelations(where, { skip, take }),
      applicationRepository.count(where),
    ])

    return buildPaginatedResponse('applications', applications, total, page, limit)
  }

  async getByStatus(status) {
    return applicationRepository.findByStatus(status)
  }

  async getByScholarship(scholarshipId) {
    return applicationRepository.findByScholarshipId(scholarshipId)
  }

  async getById(id) {
    return applicationRepository.findByAnyId(id)
  }

  async getStudentApplications(studentId) {
    return applicationRepository.findByStudentId(studentId)
  }

  async getStudentApplicationById(studentId, applicationId) {
    return applicationRepository.findByStudentAndId(studentId, applicationId)
  }

  async createApplication(studentId, applicationData) {
    const { scholarshipId, preferences, documents } = applicationData

    if (!scholarshipId) throw new ValidationError('Scholarship ID is required')

    const scholarship = await scholarshipRepository.findByAnyId(scholarshipId)

    if (scholarship.status !== SCHOLARSHIP_STATUS.PUBLISHED) {
      throw new ValidationError('Scholarship is not available for applications')
    }
    if (new Date(scholarship.applicationDeadline) < new Date()) {
      throw new ValidationError('Application deadline has passed')
    }

    const existing = await applicationRepository.findExistingApplication(studentId, scholarshipId)
    if (existing) throw new ValidationError('You have already applied for this scholarship')

    const applicationId = this.generateApplicationId()

    const application = await applicationRepository.create({
      applicationId,
      id: applicationId,
      studentId,
      scholarshipId,
      preferences: preferences || {},
      documents: documents || {},
      status: APPLICATION_STATUS.PENDING,
      submittedAt: new Date(),
      statusHistory: [{
        status: APPLICATION_STATUS.PENDING,
        timestamp: new Date(),
        note: 'Application submitted',
      }],
    })

    const populated = await applicationRepository.findByAnyId(application.id)

    await tryEmail(
      () => emailService.sendNewApplicationNotificationToAdmin({
        applicationId: populated.applicationId || populated.id,
        student: populated.student,
        scholarship: populated.scholarship,
        submittedAt: populated.submittedAt,
      }),
      'Failed to send admin notification (non-blocking)'
    )

    return populated
  }

  async updateApplication(studentId, applicationId, updateData) {
    const application = await applicationRepository.findByStudentAndIdOrNull(studentId, applicationId)

    if (!application) throw new NotFoundError('Application')
    if (application.status !== 'pending') {
      throw new ValidationError('Cannot update application after review has started')
    }

    const { preferences, documents } = updateData
    const updatePayload = {}

    if (preferences) updatePayload.preferences = { ...application.preferences, ...preferences }
    if (documents)   updatePayload.documents   = { ...application.documents, ...documents }

    await applicationRepository.update(applicationId, updatePayload)
    return applicationRepository.findByAnyId(applicationId)
  }

  async create(applicationData) {
    const id = this.generateApplicationId()
    const application = await applicationRepository.create({
      ...applicationData,
      id,
      applicationId: id,
      status: 'pending',
      submittedAt: new Date(),
      statusHistory: [{ status: 'pending', timestamp: new Date(), note: 'Application submitted' }],
    })
    return { id: application.id }
  }

  async updateStatus(applicationId, statusData, adminEmail) {
    let { status, note, metadata } = statusData

    if (status) {
      status = status.toLowerCase()
      if (['interview_scheduled', 'interviewscheduled'].includes(status)) status = 'interview'
      if (status === 'interviewpassed') status = 'interview_passed'
      if (status === 'interview_failed' || status === 'interviewfailed') {
        status = 'rejected'
        if (metadata) {
          metadata.rejectionReason  = metadata.rejectionReason || 'interview_failed'
          metadata.rejectionFeedback = metadata.interviewFailureReason || metadata.rejectionFeedback || 'Interview did not meet requirements'
        }
      }
    }

    const application = await applicationRepository.findByAnyId(applicationId)

    const historyEntry = { status, timestamp: new Date(), note: note || '', adminEmail, metadata: metadata || {} }
    const applicationUpdateData = {
      status,
      statusHistory: [...application.statusHistory, historyEntry],
    }

    if (status === APPLICATION_STATUS.INTERVIEW && metadata) {
      applicationUpdateData.interviewDetails = {
        date: metadata.interviewDate || null,
        time: metadata.interviewTime || null,
        videoCallPlatform: metadata.videoCallPlatform || null,
        videoCallLink: metadata.videoCallLink || null,
        notes: metadata.interviewNotes || null,
        scheduledAt: new Date(),
      }
    }
    if (status === APPLICATION_STATUS.REJECTED && metadata?.rejectionReason) {
      applicationUpdateData.rejectionDetails = {
        reason: metadata.rejectionReason,
        feedback: metadata.rejectionFeedback || null,
        rejectedAt: new Date(),
      }
    }
    if (status === APPLICATION_STATUS.REVOKED && metadata) {
      applicationUpdateData.revocationDetails = {
        reason: metadata.revocationReason || null,
        details: metadata.revocationDetails || null,
        revokedAt: new Date(),
      }
    }
    if (status === APPLICATION_STATUS.ACCEPTED)        applicationUpdateData.acceptedAt = new Date()
    if (status === APPLICATION_STATUS.INTERVIEW_PASSED) applicationUpdateData.interviewPassedAt = new Date()

    await applicationRepository.update(applicationId, applicationUpdateData)
    const populated = await applicationRepository.findByAnyId(applicationId)

    if (populated.student) {
      const { email, firstName = 'Student' } = populated.student
      const appId = populated.applicationId
      const scholarshipTitle = populated.scholarship?.title || 'Scholarship'

      await tryEmail(async () => {
        if (status === 'interview') {
          await emailService.sendInterviewNotification(email, firstName, {
            applicationId: appId, scholarshipTitle,
            interviewDate: metadata?.interviewDate,
            interviewTime: metadata?.interviewTime,
            videoCallPlatform: metadata?.videoCallPlatform,
            videoCallLink: metadata?.videoCallLink,
            notes: metadata?.interviewNotes,
            adminNote: note,
          })
        } else if (status === 'interview_passed') {
          await emailService.sendInterviewPassedNotification(email, firstName, {
            applicationId: appId, scholarshipTitle, adminNote: note,
          })
        } else if (status === 'rejected' && metadata?.rejectionReason === 'interview_failed') {
          await emailService.sendInterviewFailedNotification(email, firstName, {
            applicationId: appId, scholarshipTitle,
            failureReason: metadata?.interviewFailureReason || metadata?.rejectionFeedback || 'Interview did not meet requirements',
            adminNote: note,
          })
        } else if (status === 'revoked') {
          await emailService.sendRevokedNotification(email, firstName, {
            applicationId: appId, scholarshipTitle,
            revocationReason: metadata?.revocationReason || 'Missing documents or information',
            revocationDetails: metadata?.revocationDetails || '',
            adminNote: note,
          })
        }
      }, 'Failed to send status notification email')
    }

    return populated
  }

  async delete(applicationId) {
    await applicationRepository.delete(applicationId)
    return { id: applicationId }
  }

  async search(term) {
    return applicationRepository.search(term)
  }

  async uploadAdminDocument(applicationId, documentType, filename, adminEmail) {
    if (!['admission', 'jw202'].includes(documentType)) {
      throw new ValidationError('Invalid document type. Must be "admission" or "jw202"')
    }

    const application = await applicationRepository.findByAnyId(applicationId)

    if (application.status !== APPLICATION_STATUS.ACCEPTED) {
      throw new ValidationError('Documents can only be uploaded for accepted applications')
    }

    const filePath = `/uploads/applications/${application.applicationId || applicationId}/admin-docs/${filename}`

    const docField = documentType === 'admission' ? 'admissionDocument' : 'jw202Document'
    await applicationRepository.update(applicationId, {
      [docField]: { path: filePath, uploadedAt: new Date(), uploadedBy: adminEmail },
    })

    const populated = await applicationRepository.findByAnyId(applicationId)

    await tryEmail(
      () => populated.student && emailService.sendDocumentUploadedNotification(
        populated.student.email,
        populated.student.firstName || 'Student',
        {
          applicationId: populated.applicationId,
          scholarshipTitle: populated.scholarship?.title || 'Scholarship',
          documentType: documentType === 'admission' ? 'Admission Letter' : 'JW202 Form',
          documentPath: filePath,
        }
      ),
      'Failed to send document upload notification email'
    )

    return populated
  }
}

export default new ApplicationService()
