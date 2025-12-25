import express from 'express'
import productController from '../controllers/product.controller.js'
import { authenticate } from '../middleware/auth.js'
import { createProductUpload } from '../utils/upload.js'

const router = express.Router()
const upload = createProductUpload()

router.get('/', productController.getAll)
router.get('/:id', productController.getById)
router.post('/', authenticate, upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'carousel', maxCount: 10 }
]), productController.create)
router.put('/:id', authenticate, upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'carousel', maxCount: 10 }
]), productController.update)
router.delete('/:id', authenticate, productController.delete)
router.patch('/:id/toggle', authenticate, productController.toggleStatus)

export default router
