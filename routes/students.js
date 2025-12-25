import express from 'express'
import studentController from '../controllers/student.controller.js'
import { authenticateStudent, authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validator.js'
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
import { createProfilePictureUpload } from '../utils/upload.js'

const router = express.Router()
const profilePictureUpload = createProfilePictureUpload('student')

router.post('/register', validate(registerStudentSchema), studentController.register)
router.post('/verify-email', validate(verifyOTPSchema), studentController.verifyEmail)
router.post('/resend-otp', validate(resendOTPSchema), studentController.resendOTP)
router.post('/login', validate(loginStudentSchema), studentController.login)
router.post('/forgot-password', validate(forgotPasswordSchema), studentController.forgotPassword)
router.post('/reset-password', validate(resetPasswordSchema), studentController.resetPassword)
router.get('/me', authenticateStudent, studentController.getProfile)
router.put('/me', authenticateStudent, validate(updateProfileSchema), studentController.updateProfile)
router.post('/me/password', authenticateStudent, validate(changePasswordSchema), studentController.changePassword)
router.post('/me/profile-picture', authenticateStudent, profilePictureUpload.single('profilePicture'), studentController.updateProfilePicture)
router.get('/', authenticate, studentController.getAll)

export default router
