import express from 'express'
import applicationController from '../controllers/application.controller.js'
import { authenticate, authenticateStudent } from '../middleware/auth.js'
import { validate } from '../middleware/validator.js'
import {
  createApplicationSchema,
  updateApplicationSchema,
  updateApplicationStatusSchema,
  uploadAdminDocumentSchema,
} from '../dto/application.dto.js'
import { createApplicationDocumentUpload } from '../utils/upload.js'

const router = express.Router()
const adminDocUpload = createApplicationDocumentUpload()

router.get('/', authenticate, applicationController.getAll)
router.get('/status/:status', authenticate, applicationController.getByStatus)
router.get('/scholarship/:scholarshipId', authenticate, applicationController.getByScholarship)
router.get('/:id', authenticate, applicationController.getById)
router.put('/:id/status', authenticate, validate(updateApplicationStatusSchema), applicationController.updateStatus)
router.delete('/:id', authenticate, applicationController.delete)
router.get('/search/:term', authenticate, applicationController.search)
router.put('/:id/admin-documents', authenticate, adminDocUpload.single('file'), validate(uploadAdminDocumentSchema), applicationController.uploadAdminDocument)
router.get('/student/me', authenticateStudent, applicationController.getStudentApplications)
router.get('/student/me/:id', authenticateStudent, applicationController.getStudentApplicationById)
router.post('/student/me', authenticateStudent, validate(createApplicationSchema), applicationController.createApplication)
router.put('/student/me/:id', authenticateStudent, validate(updateApplicationSchema), applicationController.updateApplication)
router.post('/', applicationController.create)

export default router
