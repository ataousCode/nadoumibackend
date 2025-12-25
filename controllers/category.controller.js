import categoryService from '../services/category.service.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { sendSuccess } from '../utils/response.js'

class CategoryController {
  getAll = asyncHandler(async (req, res) => {
    const categories = await categoryService.getAll(req.query)
    sendSuccess(res, categories)
  })

  getById = asyncHandler(async (req, res) => {
    const category = await categoryService.getById(req.params.id)
    sendSuccess(res, category)
  })

  create = asyncHandler(async (req, res) => {
    const data = JSON.parse(req.body.data || '{}')
    const iconUrl = req.file 
      ? `/uploads/categories/${req.file.filename}`
      : data.icon || null

    const category = await categoryService.create(data, iconUrl)
    sendSuccess(res, category)
  })

  update = asyncHandler(async (req, res) => {
    const data = JSON.parse(req.body.data || '{}')
    const iconUrl = req.file ? `/uploads/categories/${req.file.filename}` : null

    const category = await categoryService.update(req.params.id, data, iconUrl)
    sendSuccess(res, category)
  })

  delete = asyncHandler(async (req, res) => {
    const result = await categoryService.delete(req.params.id)
    sendSuccess(res, result)
  })

  toggleStatus = asyncHandler(async (req, res) => {
    const category = await categoryService.toggleStatus(req.params.id)
    sendSuccess(res, category)
  })
}

export default new CategoryController()

