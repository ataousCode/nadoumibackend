import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { getUploadPath } from './paths.js'
import { MAX_PROFILE_PICTURE_SIZE, MAX_DOCUMENT_SIZE, MAX_VIDEO_SIZE, IMAGE_TYPES } from '../config/constants.js'

const createStorage = (destinationPath) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = getUploadPath(destinationPath)
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true })
      }
      cb(null, uploadPath)
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname)
      const filename = `${Date.now()}_${file.originalname.replace(/[^A-Za-z0-9._-]/g, '_')}`
      cb(null, filename)
    }
  })
}

const imageFilter = (req, file, cb) => {
  const extname = IMAGE_TYPES.test(path.extname(file.originalname).toLowerCase())
  const mimetype = IMAGE_TYPES.test(file.mimetype)
  if (extname && mimetype) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed'))
  }
}

export const createProfilePictureUpload = (userType) => {
  return multer({
    storage: createStorage(`profile-pictures/${userType}s`),
    limits: { fileSize: MAX_PROFILE_PICTURE_SIZE },
    fileFilter: imageFilter
  })
}

// No category or product uploads required as these modules were removed


export const createApplicationDocumentUpload = () => {
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const applicationId = req.params.id || 'temp'
        const uploadPath = getUploadPath(`applications/${applicationId}/admin-docs`)
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true })
        }
        cb(null, uploadPath)
      },
      filename: (req, file, cb) => {
        const sanitized = file.originalname.replace(/[^A-Za-z0-9._-]/g, '_')
        const docType = req.body.documentType || 'document'
        cb(null, `${docType}_${Date.now()}_${sanitized}`)
      }
    }),
    limits: { fileSize: MAX_DOCUMENT_SIZE }
  })
}

export const createStudentDocumentUpload = () => {
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const applicationId = req.params.applicationId || 'temp'
        const uploadPath = getUploadPath(`applications/${applicationId}`)
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true })
        }
        cb(null, uploadPath)
      },
      filename: (req, file, cb) => {
        const sanitized = file.originalname.replace(/[^A-Za-z0-9._-]/g, '_')
        cb(null, `${Date.now()}_${sanitized}`)
      }
    }),
    limits: { fileSize: MAX_VIDEO_SIZE }
  })
}
