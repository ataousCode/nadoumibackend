import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import studentController from '../controllers/student.controller.js'
import { authenticateStudent, authenticate } from '../middleware/auth.js'
import {
  validate,
  validateQuery,
  validateParams,
} from '../middleware/validator.js'
import {
  registerStudentSchema,
  loginStudentSchema,
  verifyOTPSchema,
  resendOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../dto/student.dto.js'
import Student from '../models/Student.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const profilePictureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/profile-pictures/students')
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const studentId = req.student?.id || req.student?._id
    if (!studentId) {
      return cb(new Error('Student authentication required'))
    }
    const filename = `student_${studentId}_${Date.now()}${ext}`
    cb(null, filename)
  }
})

const profilePictureUpload = multer({
  storage: profilePictureStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    if (extname && mimetype) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  }
})

const router = express.Router()

router.post(
  '/register',
  validate(registerStudentSchema),
  studentController.register
)

router.post(
  '/verify-email',
  validate(verifyOTPSchema),
  studentController.verifyEmail
)

router.post(
  '/resend-otp',
  validate(resendOTPSchema),
  studentController.resendOTP
)

router.post(
  '/login',
  validate(loginStudentSchema),
  studentController.login
)

router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  studentController.forgotPassword
)

router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  studentController.resetPassword
)

router.get('/me', authenticateStudent, studentController.getProfile)

router.put(
  '/me',
  authenticateStudent,
  validate(updateProfileSchema),
  studentController.updateProfile
)

router.post(
  '/me/password',
  authenticateStudent,
  validate(changePasswordSchema),
  studentController.changePassword
)

router.get('/', authenticate, studentController.getAll)

router.post('/me/profile-picture', authenticateStudent, profilePictureUpload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    if (!req.student || !req.student.id) {
      console.error('Profile picture upload: req.student is missing or invalid', req.student)
      return res.status(401).json({ error: 'Student authentication required' })
    }

    const student = await Student.findById(req.student.id)
    if (!student) {
      console.error('Profile picture upload: Student not found with ID', req.student.id)
      return res.status(404).json({ error: 'Student not found' })
    }

    // Delete old profile picture if exists
    if (student.profilePicture) {
      const oldPath = path.join(__dirname, '../../uploads', student.profilePicture.replace('/uploads/', ''))
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath)
      }
    }

    const filePath = `/uploads/profile-pictures/students/${req.file.filename}`
    student.profilePicture = filePath
    await student.save()

    res.json({
      success: true,
      profilePicture: filePath
    })
  } catch (error) {
    console.error('Upload profile picture error:', error)
    res.status(500).json({ error: 'Failed to upload profile picture' })
  }
})

export default router
