import express from 'express'
import scholarshipController from '../controllers/scholarship.controller.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validator.js'
import {
  createScholarshipSchema,
  updateScholarshipSchema,
  updateScholarshipStatusSchema,
} from '../dto/scholarship.dto.js'
import { ROLES } from '../config/constants.js'

const router = express.Router()
const adminAuth = authenticate(ROLES.ADMIN)

router.get('/',             scholarshipController.getAll)
router.get('/featured',     scholarshipController.getFeatured)
router.get('/:id',          scholarshipController.getById)
router.post('/',            adminAuth, validate(createScholarshipSchema),       scholarshipController.create)
router.put('/:id',          adminAuth, validate(updateScholarshipSchema),        scholarshipController.update)
router.delete('/:id',       adminAuth,                                           scholarshipController.delete)
router.patch('/:id/status', adminAuth, validate(updateScholarshipStatusSchema),  scholarshipController.updateStatus)

export default router
