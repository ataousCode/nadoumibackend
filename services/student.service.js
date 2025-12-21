import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import studentRepository from '../repositories/student.repository.js'
import otpService from './otp.service.js'
import emailService from './email.service.js'
import { 
  NotFoundError, 
  AuthenticationError, 
  ConflictError,
  AppError 
} from '../utils/errors.js'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

/**
 * Student Service
 * Business logic for student operations
 */
class StudentService {
  /**
   * Register a new student
   */
  async register(studentData) {
    const { email, password, passportNumber, ...rest } = studentData

    // Check if email already exists
    const existingByEmail = await studentRepository.findByEmailOrNull(email)
    if (existingByEmail) {
      throw new ConflictError('Email already registered')
    }

    // Check if passport number already exists
    const existingByPassport = await studentRepository.findByPassportNumber(passportNumber)
    if (existingByPassport) {
      throw new ConflictError('Passport number already registered')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create student (unverified)
    const student = await studentRepository.create({
      ...rest,
      email: email.toLowerCase(),
      password: hashedPassword,
      passportNumber: passportNumber.toUpperCase(),
      isEmailVerified: false,
    })

    // Generate and send OTP
    const otp = otpService.generateOTP()
    const otpExpires = otpService.generateOTPExpiration(10) // 10 minutes

    await studentRepository.saveOTP(student._id, otp, otpExpires)
    await emailService.sendVerificationOTP(email, otp)

    // Return student without password
    const studentObj = student.toObject()
    delete studentObj.password
    delete studentObj.emailVerificationOTP
    delete studentObj.emailVerificationOTPExpires

    return {
      student: studentObj,
      message: 'Registration successful. Please check your email for verification code.',
    }
  }

  /**
   * Verify email with OTP
   */
  async verifyEmail(email, otp) {
    const student = await studentRepository.verifyOTP(email, otp)

    if (!student) {
      throw new AuthenticationError('Invalid or expired OTP')
    }

    // Mark email as verified and clear OTP
    await studentRepository.updateEmailVerification(student._id, true)
    await studentRepository.clearOTP(student._id)

    // Generate JWT token
    const token = this.generateToken(student._id, student.email)

    // Send welcome email
    await emailService.sendWelcomeEmail(student.email, student.firstName)

    return {
      token,
      student: {
        id: student._id,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        profilePicture: student.profilePicture,
        isEmailVerified: true,
      },
    }
  }

  /**
   * Resend verification OTP
   */
  async resendVerificationOTP(email) {
    const student = await studentRepository.findByEmailOrNull(email)
    if (!student) {
      throw new NotFoundError('Student')
    }

    if (student.isEmailVerified) {
      throw new ConflictError('Email is already verified')
    }

    // Generate new OTP
    const otp = otpService.generateOTP()
    const otpExpires = otpService.generateOTPExpiration(10)

    await studentRepository.saveOTP(student._id, otp, otpExpires)
    await emailService.sendVerificationOTP(email, otp)

    return {
      message: 'Verification code has been sent to your email',
    }
  }

  /**
   * Login student
   */
  async login(email, password) {
    const student = await studentRepository.findByEmailOrNull(email)
    if (!student) {
      throw new AuthenticationError('Invalid email or password')
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, student.password)
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid email or password')
    }

    // Check if email is verified
    if (!student.isEmailVerified) {
      throw new AuthenticationError('Please verify your email before logging in')
    }

    // Generate JWT token
    const token = this.generateToken(student._id, student.email)

    return {
      token,
      student: {
        id: student._id,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        profilePicture: student.profilePicture,
        isEmailVerified: student.isEmailVerified,
      },
    }
  }

  /**
   * Get student profile
   */
  async getProfile(studentId) {
    const student = await studentRepository.findById(studentId)
    return student
  }

  /**
   * Update student profile
   */
  async updateProfile(studentId, updateData) {
    const student = await studentRepository.update(studentId, updateData)
    return student
  }

  /**
   * Change password
   */
  async changePassword(studentId, currentPassword, newPassword) {
    const student = await studentRepository.findById(studentId)

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, student.password)
    if (!isValidPassword) {
      throw new AuthenticationError('Current password is incorrect')
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    await studentRepository.updatePassword(studentId, hashedPassword)

    return {
      message: 'Password updated successfully',
    }
  }

  /**
   * Forgot password - send reset email
   */
  async forgotPassword(email) {
    const student = await studentRepository.findByEmailOrNull(email)
    if (!student) {
      // Don't reveal if email exists or not for security
      return {
        message: 'If the email exists, a password reset link has been sent',
      }
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await studentRepository.savePasswordResetToken(
      student._id,
      resetToken,
      resetExpires
    )
    await emailService.sendPasswordResetEmail(email, resetToken)

    return {
      message: 'If the email exists, a password reset link has been sent',
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
    const student = await studentRepository.findByPasswordResetToken(token)
    if (!student) {
      throw new AuthenticationError('Invalid or expired reset token')
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    await studentRepository.updatePassword(student._id, hashedPassword)
    await studentRepository.clearPasswordResetToken(student._id)

    return {
      message: 'Password reset successfully',
    }
  }

  /**
   * Get all students (admin only)
   */
  async getAll() {
    const students = await studentRepository.findAll()
    return students.map(student => {
      const studentObj = student.toObject()
      delete studentObj.password
      delete studentObj.emailVerificationOTP
      delete studentObj.emailVerificationOTPExpires
      delete studentObj.passwordResetToken
      delete studentObj.passwordResetExpires
      return studentObj
    })
  }

  /**
   * Generate JWT token
   */
  generateToken(id, email) {
    return jwt.sign(
      { id, email, type: 'student' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )
  }
}

export default new StudentService()

