import scholarshipService from '../services/scholarship.service.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { sendSuccess, sendCreated } from '../utils/response.js'

class ScholarshipController {
  getAll = asyncHandler(async (req, res) => {
    const result = await scholarshipService.getAll({
      ...req.query,
      isAdmin: !!req.admin
    })
    sendSuccess(res, result)
  })

  getFeatured = asyncHandler(async (req, res) => {
    const scholarships = await scholarshipService.getFeatured()
    sendSuccess(res, scholarships)
  })

  getById = asyncHandler(async (req, res) => {
    const scholarship = await scholarshipService.getById(req.params.id)
    sendSuccess(res, scholarship)
  })

  create = asyncHandler(async (req, res) => {
    const scholarship = await scholarshipService.create(req.body, req.admin._id)
    sendCreated(res, scholarship)
  })

  update = asyncHandler(async (req, res) => {
    const scholarship = await scholarshipService.update(req.params.id, req.body)
    sendSuccess(res, scholarship)
  })

  delete = asyncHandler(async (req, res) => {
    const result = await scholarshipService.delete(req.params.id)
    sendSuccess(res, result)
  })

  updateStatus = asyncHandler(async (req, res) => {
    const scholarship = await scholarshipService.updateStatus(req.params.id, req.body.status)
    sendSuccess(res, scholarship)
  })
}

export default new ScholarshipController()

