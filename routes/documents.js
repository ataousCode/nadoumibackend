import express from 'express'
import documentController from '../controllers/document.controller.js'
import { authenticate } from '../middleware/auth.js'
import { createStudentDocumentUpload } from '../utils/upload.js'
import { ROLES } from '../config/constants.js'

const router = express.Router()
const upload = createStudentDocumentUpload()
const adminAuth = authenticate(ROLES.ADMIN)

router.get('/file/:path(*)',    documentController.serveFile)
router.post('/:applicationId', upload.single('file'), documentController.upload)
router.get('/:applicationId',  adminAuth,             documentController.getDocuments)

export default router
