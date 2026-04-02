import scholarshipService from "../services/scholarship.service.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import { validateScholarship, validateScholarshipUpdate } from "../validators/scholarship.validator.js";
import logger from "../utils/logger.js";

class ScholarshipController {
  getAll = asyncHandler(async (req, res) => {
    const result = await scholarshipService.getAll({
      ...req.query,
      isAdmin: !!req.admin,
    });
    sendSuccess(res, result);
  });

  getFeatured = asyncHandler(async (req, res) => {
    const scholarships = await scholarshipService.getFeatured();
    sendSuccess(res, scholarships);
  });

  getById = asyncHandler(async (req, res) => {
    const scholarship = await scholarshipService.getById(req.params.id);
    sendSuccess(res, scholarship);
  });

  create = asyncHandler(async (req, res) => {
    logger.info("Create Scholarship Request Body:", req.body);
    const validatedData = validateScholarship(req.body);
    const scholarship = await scholarshipService.create(validatedData, req.admin.id);
    sendCreated(res, scholarship);
  });

  update = asyncHandler(async (req, res) => {
    logger.info("UPDATE SCHOLARSHIP START", {
      id: req.params.id,
      adminId: req.admin?.id,
      body: req.body,
    });
    
    const validatedData = validateScholarshipUpdate(req.body);
    logger.info("UPDATE SCHOLARSHIP VALIDATED DATA", { validatedData });
    
    const scholarship = await scholarshipService.update(
      req.params.id,
      validatedData,
      req.admin.id,
    );
    sendSuccess(res, scholarship);
  });

  delete = asyncHandler(async (req, res) => {
    const result = await scholarshipService.delete(req.params.id, req.admin.id);
    sendSuccess(res, result);
  });

  updateStatus = asyncHandler(async (req, res) => {
    const scholarship = await scholarshipService.updateStatus(
      req.params.id,
      req.body.status,
      req.admin.id,
    );
    sendSuccess(res, scholarship);
  });
}

export default new ScholarshipController();
