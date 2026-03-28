import path from 'node:path'
import documentService from '../services/document.service.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { sendSuccess, sendError } from '../utils/response.js'
import { getUploadPath } from '../utils/paths.js'

class DocumentController {
  upload = asyncHandler(async (req, res) => {
    const uploadedBy = req.admin?.id || req.student?.id || 'unknown'
    const result = await documentService.uploadDocument(req.params.applicationId, req.file, uploadedBy)
    sendSuccess(res, result)
  })

  getDocuments = asyncHandler(async (req, res) => {
    const files = await documentService.getDocuments(req.params.applicationId)
    sendSuccess(res, files)
  })

  serveFile = asyncHandler(async (req, res) => {
    const user = req.admin || req.student
    const filePath = req.params.path
    const fileInfo = await documentService.getSecureFileLink(filePath, user)
    
    if (fileInfo.url) {
      return res.redirect(fileInfo.url)
    }

    const fullPath = path.resolve(getUploadPath(fileInfo.path))
    res.setHeader('Content-Type', documentService.getContentType(fullPath))
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(fullPath)}"`)
    
    res.sendFile(fullPath, (err) => {
      if (err && !res.headersSent) {
        sendError(res, 'Failed to serve document', 500)
      }
    })
  })
}

export default new DocumentController()

