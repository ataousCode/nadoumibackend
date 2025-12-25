import productService from '../services/product.service.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { sendSuccess } from '../utils/response.js'

class ProductController {
  getAll = asyncHandler(async (req, res) => {
    const products = await productService.getAll(req.query)
    sendSuccess(res, products)
  })

  getById = asyncHandler(async (req, res) => {
    const product = await productService.getById(req.params.id)
    sendSuccess(res, product)
  })

  create = asyncHandler(async (req, res) => {
    const data = JSON.parse(req.body.data || '{}')
    const product = await productService.create(data, req.files)
    sendSuccess(res, product)
  })

  update = asyncHandler(async (req, res) => {
    const data = JSON.parse(req.body.data || '{}')
    const product = await productService.update(req.params.id, data, req.files)
    sendSuccess(res, product)
  })

  delete = asyncHandler(async (req, res) => {
    const result = await productService.delete(req.params.id)
    sendSuccess(res, result)
  })

  toggleStatus = asyncHandler(async (req, res) => {
    const product = await productService.toggleStatus(req.params.id)
    sendSuccess(res, product)
  })
}

export default new ProductController()

