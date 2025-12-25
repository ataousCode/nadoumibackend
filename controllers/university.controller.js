import universityService from '../services/university.service.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { sendSuccess, sendCreated } from '../utils/response.js'

class UniversityController {
  getAll = asyncHandler(async (req, res) => {
    const result = await universityService.getAll({
      ...req.query,
      isAdmin: !!req.admin
    })
    sendSuccess(res, result)
  })

  getById = asyncHandler(async (req, res) => {
    const university = await universityService.getById(req.params.id)
    sendSuccess(res, university)
  })

  create = asyncHandler(async (req, res) => {
    const university = await universityService.create(req.body)
    sendCreated(res, university)
  })

  update = asyncHandler(async (req, res) => {
    const university = await universityService.update(req.params.id, req.body)
    sendSuccess(res, university)
  })

  delete = asyncHandler(async (req, res) => {
    const result = await universityService.delete(req.params.id)
    sendSuccess(res, result)
  })

  updateStatus = asyncHandler(async (req, res) => {
    const university = await universityService.updateStatus(req.params.id, req.body.status)
    sendSuccess(res, university)
  })
}

export default new UniversityController()

