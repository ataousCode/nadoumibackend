import express from 'express'
import documentController from '../controllers/document.controller.js'
import { authenticate } from '../middleware/auth.js'
import { createStudentDocumentUpload } from '../utils/upload.js'

const router = express.Router()
const upload = createStudentDocumentUpload()

router.get('/file/:path(*)', documentController.serveFile)
router.post('/:applicationId', upload.single('file'), documentController.upload)
router.get('/:applicationId', authenticate, documentController.getDocuments)

export default router
