import express from 'express'
import studentController from '../controllers/student.controller.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validator.js'
import { strictLimiter, standardLimiter } from '../middleware/rateLimiter.js'
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
import { ROLES } from '../config/constants.js'

const router = express.Router()
const profilePictureUpload = createProfilePictureUpload('student')
const studentAuth = authenticate(ROLES.STUDENT)
const adminAuth   = authenticate(ROLES.ADMIN)

router.post('/register',           standardLimiter, validate(registerStudentSchema),   studentController.register)
router.post('/verify-email',       standardLimiter, validate(verifyOTPSchema),          studentController.verifyEmail)
router.post('/resend-otp',         standardLimiter, validate(resendOTPSchema),           studentController.resendOTP)
router.post('/login',              strictLimiter,   validate(loginStudentSchema),        studentController.login)
router.post('/forgot-password',    strictLimiter,   validate(forgotPasswordSchema),      studentController.forgotPassword)
router.post('/reset-password',     standardLimiter, validate(resetPasswordSchema),       studentController.resetPassword)
router.delete('/logout',           studentAuth,                                          studentController.logout)
router.get('/me',                  studentAuth,                                          studentController.getProfile)
router.put('/me',                  studentAuth,     validate(updateProfileSchema),        studentController.updateProfile)
router.post('/me/password',        studentAuth,     validate(changePasswordSchema),       studentController.changePassword)
router.post('/me/profile-picture', studentAuth,     profilePictureUpload.single('profilePicture'), studentController.updateProfilePicture)
router.get('/',                    adminAuth,                                             studentController.getAll)

export default router

