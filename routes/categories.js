import express from 'express'
import categoryController from '../controllers/category.controller.js'
import { authenticate } from '../middleware/auth.js'
import { createCategoryIconUpload } from '../utils/upload.js'

const router = express.Router()
const upload = createCategoryIconUpload()

router.get('/', categoryController.getAll)
router.get('/:id', categoryController.getById)
router.post('/', authenticate, upload.single('icon'), categoryController.create)
router.put('/:id', authenticate, upload.single('icon'), categoryController.update)
router.delete('/:id', authenticate, categoryController.delete)
router.patch('/:id/toggle', authenticate, categoryController.toggleStatus)

export default router
