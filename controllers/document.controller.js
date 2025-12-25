import documentService from '../services/document.service.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { sendSuccess, sendError } from '../utils/response.js'

class DocumentController {
  upload = asyncHandler(async (req, res) => {
    const result = await documentService.uploadDocument(req.params.applicationId, req.file)
    sendSuccess(res, result)
  })

  getDocuments = asyncHandler(async (req, res) => {
    const files = await documentService.getDocuments(req.params.applicationId)
    sendSuccess(res, files)
  })

  serveFile = asyncHandler(async (req, res) => {
    const filePath = req.params.path
    const fileInfo = await documentService.serveDocument(filePath)
    
    res.setHeader('Content-Type', fileInfo.contentType)
    res.setHeader('Content-Disposition', `inline; filename="${fileInfo.filename}"`)
    
    res.sendFile(fileInfo.path, (err) => {
      if (err && !res.headersSent) {
        sendError(res, 'Failed to serve document', 500)
      }
    })
  })
}

export default new DocumentController()

