import path from 'path'
import fs from 'fs'
import { getUploadPath } from '../utils/paths.js'
import { ValidationError } from '../utils/errors.js'

class DocumentService {
  async uploadDocument(applicationId, file) {
    if (!file) {
      throw new ValidationError('No file provided')
    }

    const fileUrl = `/uploads/applications/${applicationId}/${file.filename}`
    return {
      path: fileUrl,
      name: file.originalname,
      size: file.size,
      type: file.mimetype
    }
  }

  async getDocuments(applicationId) {
    const uploadPath = getUploadPath(`applications/${applicationId}`)
    
    if (!fs.existsSync(uploadPath)) {
      return []
    }

    const files = []
    const readDir = (dir, basePath = '') => {
      const items = fs.readdirSync(dir, { withFileTypes: true })
      items.forEach(item => {
        const fullPath = path.join(dir, item.name)
        const relativePath = path.join(basePath, item.name)
        if (item.isDirectory()) {
          readDir(fullPath, relativePath)
        } else {
          const stats = fs.statSync(fullPath)
          files.push({
            path: `/uploads/applications/${applicationId}/${relativePath}`,
            url: `/uploads/applications/${applicationId}/${relativePath}`,
            name: item.name,
            size: stats.size
          })
        }
      })
    }

    readDir(uploadPath)
    return files
  }

  async serveDocument(filePath) {
    if (!filePath) {
      throw new ValidationError('File path is required')
    }
    
    const normalizedPath = decodeURIComponent(filePath).replace(/^\/+/, '')
    const fullPath = getUploadPath(normalizedPath)
    const uploadsDir = getUploadPath('')
    const resolvedPath = path.resolve(fullPath)
    const resolvedUploadsDir = path.resolve(uploadsDir)
    
    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      throw new ValidationError('Access denied')
    }
    
    if (!fs.existsSync(resolvedPath)) {
      throw new ValidationError('File not found')
    }
    
    return {
      path: resolvedPath,
      contentType: this.getContentType(resolvedPath),
      filename: path.basename(resolvedPath)
    }
  }

  getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase()
    const contentTypeMap = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.mkv': 'video/x-matroska'
    }
    return contentTypeMap[ext] || 'application/octet-stream'
  }
}

export default new DocumentService()
