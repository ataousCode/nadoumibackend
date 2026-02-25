import express from 'express'
import applicationController from '../controllers/application.controller.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validator.js'
import { strictLimiter, standardLimiter } from '../middleware/rateLimiter.js'
import {
  createApplicationSchema,
  publicCreateApplicationSchema,
  updateApplicationSchema,
  updateApplicationStatusSchema,
  uploadAdminDocumentSchema,
} from '../dto/application.dto.js'
import { createApplicationDocumentUpload } from '../utils/upload.js'
import { ROLES } from '../config/constants.js'

const router = express.Router()
const adminDocUpload = createApplicationDocumentUpload()
const adminAuth   = authenticate(ROLES.ADMIN)
const studentAuth = authenticate(ROLES.STUDENT)

router.get('/',                    adminAuth,                                                                      applicationController.getAll)
router.get('/status/:status',      adminAuth,                                                                      applicationController.getByStatus)
router.get('/scholarship/:scholarshipId', adminAuth,                                                               applicationController.getByScholarship)
router.get('/search/:term',        adminAuth,                                                                      applicationController.search)
router.get('/student/me',          studentAuth,                                                                    applicationController.getStudentApplications)
router.get('/student/me/:id',      studentAuth,                                                                    applicationController.getStudentApplicationById)
router.post('/student/me',         studentAuth,  validate(createApplicationSchema),                                applicationController.createApplication)
router.put('/student/me/:id',      studentAuth,  validate(updateApplicationSchema),                                applicationController.updateApplication)
router.get('/:id',                 adminAuth,                                                                      applicationController.getById)
router.put('/:id/status',          adminAuth,    validate(updateApplicationStatusSchema),                          applicationController.updateStatus)
router.put('/:id/admin-documents', adminAuth,    adminDocUpload.single('file'), validate(uploadAdminDocumentSchema), applicationController.uploadAdminDocument)
router.delete('/:id',              adminAuth,                                                                      applicationController.delete)

// Public inquiry form (StudentAdmission page) — no auth, but validated + rate-limited
router.post('/', standardLimiter, validate(publicCreateApplicationSchema), applicationController.create)

export default router

