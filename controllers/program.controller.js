import programService from "../services/program.service.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sendSuccess } from "../utils/response.js";

class ProgramController {
  getAll = asyncHandler(async (req, res) => {
    const result = await programService.getPrograms(req.query);
    sendSuccess(res, result);
  });

  getById = asyncHandler(async (req, res) => {
    const result = await programService.getById(req.params.id);
    sendSuccess(res, result);
  });

  getCategories = asyncHandler(async (req, res) => {
    const result = await programService.getCategories();
    sendSuccess(res, result);
  });

  getFeatured = asyncHandler(async (req, res) => {
    const result = await programService.getFeaturedPrograms();
    sendSuccess(res, result);
  });
}

export default new ProgramController();
