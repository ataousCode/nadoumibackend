import universityService from "../services/university.service.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import { validateUniversity, validateUniversityUpdate } from "../validators/university.validator.js";
import logger from "../utils/logger.js";

class UniversityController {
  getAll = asyncHandler(async (req, res) => {
    const result = await universityService.getAll({
      ...req.query,
      isAdmin: !!req.admin,
    });
    sendSuccess(res, result);
  });

  getById = asyncHandler(async (req, res) => {
    const university = await universityService.getById(req.params.id);
    sendSuccess(res, university);
  });

  create = asyncHandler(async (req, res) => {
    const validatedData = validateUniversity(req.body);
    const university = await universityService.create(validatedData, req.admin.id);
    sendCreated(res, university);
  });

  update = asyncHandler(async (req, res) => {
    logger.info("UPDATE UNIVERSITY START", {
      id: req.params.id,
      adminId: req.admin?.id,
      body: req.body,
    });
    
    const validatedData = validateUniversityUpdate(req.body);
    logger.info("UPDATE UNIVERSITY VALIDATED DATA", { validatedData });
    
    const university = await universityService.update(
      req.params.id,
      validatedData,
      req.admin.id,
    );
    sendSuccess(res, university);
  });

  delete = asyncHandler(async (req, res) => {
    const result = await universityService.delete(req.params.id, req.admin.id);
    sendSuccess(res, result);
  });

  updateStatus = asyncHandler(async (req, res) => {
    const university = await universityService.updateStatus(
      req.params.id,
      req.body.status,
      req.admin.id,
    );
    sendSuccess(res, university);
  });
}

export default new UniversityController();
