import applicationService from "../services/application.service.js";
import storageService from "../utils/storage.js";
import auditService from "../services/audit.service.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { ValidationError } from "../utils/errors.js";
import { sendSuccess, sendCreated } from "../utils/response.js";

class ApplicationController {
  getAll = asyncHandler(async (req, res) => {
    const applications = await applicationService.getAll(req.query);
    sendSuccess(res, applications);
  });

  getByStatus = asyncHandler(async (req, res) => {
    const applications = await applicationService.getByStatus(
      req.params.status,
    );
    sendSuccess(res, applications);
  });

  getByScholarship = asyncHandler(async (req, res) => {
    const applications = await applicationService.getByScholarship(
      req.params.scholarshipId,
    );
    sendSuccess(res, applications);
  });

  getById = asyncHandler(async (req, res) => {
    const application = await applicationService.getById(req.params.id);
    sendSuccess(res, application);
  });

  getStudentApplications = asyncHandler(async (req, res) => {
    const applications = await applicationService.getStudentApplications(
      req.student.id,
    );
    sendSuccess(res, applications);
  });

  getStudentApplicationById = asyncHandler(async (req, res) => {
    const application = await applicationService.getStudentApplicationById(
      req.student.id,
      req.params.id,
    );
    sendSuccess(res, application);
  });

  createApplication = asyncHandler(async (req, res) => {
    const application = await applicationService.createApplication(
      req.student.id,
      req.body,
    );
    sendCreated(res, application);
  });

  updateApplication = asyncHandler(async (req, res) => {
    const application = await applicationService.updateApplication(
      req.student.id,
      req.params.id,
      req.body,
    );
    sendSuccess(res, application);
  });

  create = asyncHandler(async (req, res) => {
    const result = await applicationService.create(req.body);
    sendSuccess(res, result);
  });

  updateStatus = asyncHandler(async (req, res) => {
    const application = await applicationService.updateStatus(
      req.params.id,
      req.body,
      req.admin.id,
    );
    sendSuccess(res, application);
  });

  delete = asyncHandler(async (req, res) => {
    const result = await applicationService.delete(req.params.id, req.admin.id);
    sendSuccess(res, result);
  });

  search = asyncHandler(async (req, res) => {
    const applications = await applicationService.search(req.params.term);
    sendSuccess(res, applications);
  });

  uploadAdminDocument = asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError("No file provided");
    }

    const { id } = req.params;
    const { documentType } = req.body;

    // Upload to Aliyun OSS
    const uploadResult = await storageService.upload(req.file.buffer, {
      folder: `applications/${id}/admin-docs`,
      filename: req.file.originalname,
      optimize: false, // Don't optimize non-image docs
    });

    const application = await applicationService.uploadAdminDocument(
      id,
      documentType,
      uploadResult.url,
      req.admin.id,
    );

    sendSuccess(res, application);
  });
}

export default new ApplicationController();
