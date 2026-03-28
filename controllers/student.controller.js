import studentService from '../services/student.service.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { ValidationError } from '../utils/errors.js'
import { sendSuccess, sendCreated } from '../utils/response.js'
import storageService from '../utils/storage.js'
import { setTokenCookie, clearTokenCookie } from '../utils/token.js'

class StudentController {
  register = asyncHandler(async (req, res) => {
    const result = await studentService.register(req.body)

    // Auto-verified path: token present → also set httpOnly cookie
    if (result.token) {
      setTokenCookie(res, result.token, 'studentToken')
    }

    sendCreated(res, result)
  })

  verifyEmail = asyncHandler(async (req, res) => {
    const { email, otp } = req.body
    const result = await studentService.verifyEmail(email, otp)

    // Set httpOnly cookie on email verification success
    if (result.token) {
      setTokenCookie(res, result.token, 'studentToken')
    }

    sendSuccess(res, result)
  })

  resendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body
    const result = await studentService.resendVerificationOTP(email)
    sendSuccess(res, result)
  })

  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    const result = await studentService.login(email, password)

    // Set httpOnly cookie — inaccessible to JavaScript (XSS protection)
    if (result.token) {
      setTokenCookie(res, result.token, 'studentToken')
    }

    sendSuccess(res, result)
  })

  logout = asyncHandler(async (_req, res) => {
    clearTokenCookie(res, 'studentToken')
    sendSuccess(res, { message: 'Logged out successfully' })
  })

  getProfile = asyncHandler(async (req, res) => {
    const student = await studentService.getProfile(req.student.id)
    sendSuccess(res, student)
  })

  updateProfile = asyncHandler(async (req, res) => {
    const student = await studentService.updateProfile(req.student.id, req.body)
    sendSuccess(res, student)
  })

  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body
    const result = await studentService.changePassword(
      req.student.id,
      currentPassword,
      newPassword
    )
    sendSuccess(res, result)
  })

  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body
    const result = await studentService.forgotPassword(email)
    sendSuccess(res, result)
  })

  resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body
    const result = await studentService.resetPassword(token, password)
    sendSuccess(res, result)
  })

  getAll = asyncHandler(async (req, res) => {
    const result = await studentService.getAll(req.query)
    sendSuccess(res, result)
  })

  updateProfilePicture = asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No file provided')
    }

    // Upload new picture to Cloudinary → nadoumi/students/profiles/
    const uploaded = await storageService.upload(req.file.buffer, {
      folder: 'students/profiles',
      filename: req.file.originalname,
    })

    const result = await studentService.updateProfilePicture(
      req.student.id,
      uploaded.url,                     // Store the Cloudinary CDN URL
      req.student?.profilePicture       // Old URL — passed to service for Cloudinary deletion
    )

    sendSuccess(res, { profilePicture: result.profilePicture })
  })
}

export default new StudentController();