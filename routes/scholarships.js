import express from 'express'
import scholarshipController from '../controllers/scholarship.controller.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validator.js'
import {
  createScholarshipSchema,
  updateScholarshipSchema,
  updateScholarshipStatusSchema,
} from '../dto/scholarship.dto.js'

const router = express.Router()

router.get('/', scholarshipController.getAll)
router.get('/featured', scholarshipController.getFeatured)
router.get('/:id', scholarshipController.getById)
router.post('/', authenticate, validate(createScholarshipSchema), scholarshipController.create)
router.put('/:id', authenticate, validate(updateScholarshipSchema), scholarshipController.update)
router.delete('/:id', authenticate, scholarshipController.delete)
router.patch('/:id/status', authenticate, validate(updateScholarshipStatusSchema), scholarshipController.updateStatus)

export default router
