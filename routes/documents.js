import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { authenticate } from '../middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const applicationId = req.params.applicationId || 'temp'
    const uploadPath = `uploads/applications/${applicationId}`
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const sanitized = file.originalname.replace(/[^A-Za-z0-9._-]/g, '_')
    cb(null, `${Date.now()}_${sanitized}`)
  }
})

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit (for videos)
})

// Upload document
router.post('/:applicationId', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    const fileUrl = `/uploads/applications/${req.params.applicationId}/${req.file.filename}`
    res.json({
      path: fileUrl,
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype
    })
  } catch (error) {
    console.error('Upload document error:', error)
    res.status(500).json({ error: 'Failed to upload document' })
  }
})

// Get document URLs (admin only)
// This route must come after /file/:path(*) to avoid conflicts
router.get('/:applicationId', authenticate, async (req, res) => {
  try {
    const applicationId = req.params.applicationId
    const uploadPath = `uploads/applications/${applicationId}`
    
    if (!fs.existsSync(uploadPath)) {
      return res.json([])
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
    res.json(files)
  } catch (error) {
    console.error('Get documents error:', error)
    res.status(500).json({ error: 'Failed to fetch documents' })
  }
})

// Serve document file directly (for viewing/downloading)
// This route must be placed before the /:applicationId route to avoid conflicts
router.get('/file/:path(*)', async (req, res) => {
  try {
    // Extract the file path from the request
    const filePath = req.params.path // Everything after /file/
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' })
    }
    
    // Normalize the path - remove leading slashes and decode
    const normalizedPath = decodeURIComponent(filePath).replace(/^\/+/, '')
    
    // Build full path to the file
    const fullPath = path.join(__dirname, '../../uploads', normalizedPath)
    
    // Security check: ensure the path is within uploads directory
    const uploadsDir = path.join(__dirname, '../../uploads')
    const resolvedPath = path.resolve(fullPath)
    const resolvedUploadsDir = path.resolve(uploadsDir)
    
    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      console.error('Security check failed:', { resolvedPath, resolvedUploadsDir })
      return res.status(403).json({ error: 'Access denied' })
    }
    
    if (!fs.existsSync(resolvedPath)) {
      console.error('File not found:', resolvedPath)
      return res.status(404).json({ error: 'File not found', path: resolvedPath })
    }
    
    // Set appropriate headers for file serving
    const ext = path.extname(resolvedPath).toLowerCase()
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
    const contentType = contentTypeMap[ext] || 'application/octet-stream'
    
    // Set headers
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(resolvedPath)}"`)
    
    // Send the file using absolute path
    res.sendFile(resolvedPath, (err) => {
      if (err) {
        console.error('Error sending file:', err)
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to serve document', details: err.message })
        }
      }
    })
  } catch (error) {
    console.error('Serve document error:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to serve document', details: error.message })
    }
  }
})

export default router

