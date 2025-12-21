import studentService from '../services/student.service.js'
import { asyncHandler } from '../middleware/errorHandler.js'

class StudentController {
  register = asyncHandler(async (req, res) => {
    const result = await studentService.register(req.body)
    res.status(201).json({
      success: true,
      data: result,
    })
  })

  verifyEmail = asyncHandler(async (req, res) => {
    const { email, otp } = req.body
    const result = await studentService.verifyEmail(email, otp)
    res.json({
      success: true,
      data: result,
    })
  })

  resendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body
    const result = await studentService.resendVerificationOTP(email)
    res.json({
      success: true,
      data: result,
    })
  })

  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    const result = await studentService.login(email, password)
    res.json({
      success: true,
      data: result,
    })
  })

  getProfile = asyncHandler(async (req, res) => {
    const student = await studentService.getProfile(req.student.id)
    res.json({
      success: true,
      data: student,
    })
  })

  updateProfile = asyncHandler(async (req, res) => {
    const student = await studentService.updateProfile(req.student.id, req.body)
    res.json({
      success: true,
      data: student,
    })
  })

  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body
    const result = await studentService.changePassword(
      req.student.id,
      currentPassword,
      newPassword
    )
    res.json({
      success: true,
      data: result,
    })
  })

  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body
    const result = await studentService.forgotPassword(email)
    res.json({
      success: true,
      data: result,
    })
  })

  resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body
    const result = await studentService.resetPassword(token, password)
    res.json({
      success: true,
      data: result,
    })
  })

  getAll = asyncHandler(async (req, res) => {
    const students = await studentService.getAll()
    res.json({
      success: true,
      data: students,
    })
  })
}

export default new StudentController()

