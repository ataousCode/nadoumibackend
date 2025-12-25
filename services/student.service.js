import studentRepository from '../repositories/student.repository.js'
import otpService from './otp.service.js'
import emailService from './email.service.js'
import { 
  NotFoundError, 
  AuthenticationError, 
  ConflictError,
  AppError 
} from '../utils/errors.js'
import { hashPassword, comparePassword } from '../utils/password.js'
import { generateToken } from '../utils/jwt.js'
import { PASSWORD_RESET_EXPIRATION_HOURS } from '../config/constants.js'
import crypto from 'crypto'

class StudentService {
  async register(studentData) {
    const { email, password, passportNumber, ...rest } = studentData

    const existingByEmail = await studentRepository.findByEmailOrNull(email)
    if (existingByEmail) {
      throw new ConflictError('Email already registered')
    }

    const existingByPassport = await studentRepository.findByPassportNumber(passportNumber)
    if (existingByPassport) {
      throw new ConflictError('Passport number already registered')
    }

    const hashedPassword = await hashPassword(password)

    const student = await studentRepository.create({
      ...rest,
      email: email.toLowerCase(),
      password: hashedPassword,
      passportNumber: passportNumber.toUpperCase(),
      isEmailVerified: false,
    })

    const otp = otpService.generateOTP()
    const otpExpires = otpService.generateOTPExpiration()

    await studentRepository.saveOTP(student._id, otp, otpExpires)
    
    // Send email without blocking - if it fails, user can still register
    let emailSent = false
    try {
      await emailService.sendVerificationOTP(email, otp)
      emailSent = true
    } catch (error) {
      console.error('Failed to send verification email (non-critical):', error.message)
      // Don't throw - allow registration to complete
    }

    const studentObj = student.toObject()
    delete studentObj.password
    delete studentObj.emailVerificationOTP
    delete studentObj.emailVerificationOTPExpires

    return {
      student: studentObj,
      message: emailSent 
        ? 'Registration successful. Please check your email for verification code.'
        : 'Registration successful. Email service temporarily unavailable. Please use "Resend Code" to get your verification code.',
      emailSent,
    }
  }

  async verifyEmail(email, otp) {
    const student = await studentRepository.verifyOTP(email, otp)

    if (!student) {
      throw new AuthenticationError('Invalid or expired OTP')
    }

    await studentRepository.updateEmailVerification(student._id, true)
    await studentRepository.clearOTP(student._id)

    const token = generateToken({ id: student._id, email: student.email, type: 'student' })

    // Send welcome email in background (non-blocking)
    emailService.sendWelcomeEmail(student.email, student.firstName).catch(error => {
      console.error('Failed to send welcome email (non-critical):', error.message)
    })

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

  async resendVerificationOTP(email) {
    const student = await studentRepository.findByEmailOrNull(email)
    if (!student) {
      throw new NotFoundError('Student')
    }

    if (student.isEmailVerified) {
      throw new ConflictError('Email is already verified')
    }

    const otp = otpService.generateOTP()
    const otpExpires = otpService.generateOTPExpiration()

    await studentRepository.saveOTP(student._id, otp, otpExpires)
    
    // Send email without blocking
    try {
      await emailService.sendVerificationOTP(email, otp)
      return {
        message: 'Verification code has been sent to your email',
      }
    } catch (error) {
      console.error('Failed to send verification email:', error.message)
      throw new AppError('Email service is currently unavailable. Please try again later.', 503)
    }
  }

  async login(email, password) {
    const student = await studentRepository.findByEmailOrNull(email)
    if (!student) {
      throw new AuthenticationError('Invalid email or password')
    }

    const isValidPassword = await comparePassword(password, student.password)
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid email or password')
    }

    if (!student.isEmailVerified) {
      throw new AuthenticationError('Please verify your email before logging in')
    }

    const token = generateToken({ id: student._id, email: student.email, type: 'student' })

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

  async getProfile(studentId) {
    const student = await studentRepository.findById(studentId)
    return student
  }

  async updateProfile(studentId, updateData) {
    const student = await studentRepository.update(studentId, updateData)
    return student
  }

  async changePassword(studentId, currentPassword, newPassword) {
    const student = await studentRepository.findById(studentId)

    const isValidPassword = await comparePassword(currentPassword, student.password)
    if (!isValidPassword) {
      throw new AuthenticationError('Current password is incorrect')
    }

    const hashedPassword = await hashPassword(newPassword)
    await studentRepository.updatePassword(studentId, hashedPassword)

    return {
      message: 'Password updated successfully',
    }
  }

  async forgotPassword(email) {
    const student = await studentRepository.findByEmailOrNull(email)
    if (!student) {
      return {
        message: 'If the email exists, a password reset link has been sent',
      }
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpires = new Date(Date.now() + PASSWORD_RESET_EXPIRATION_HOURS * 60 * 60 * 1000)

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

  async resetPassword(token, newPassword) {
    const student = await studentRepository.findByPasswordResetToken(token)
    if (!student) {
      throw new AuthenticationError('Invalid or expired reset token')
    }

    const hashedPassword = await hashPassword(newPassword)
    await studentRepository.updatePassword(student._id, hashedPassword)
    await studentRepository.clearPasswordResetToken(student._id)

    return {
      message: 'Password reset successfully',
    }
  }

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

  async updateProfilePicture(studentId, profilePicturePath, oldProfilePicturePath = null) {
    const student = await studentRepository.findById(studentId)
    student.profilePicture = profilePicturePath
    await student.save()
    return {
      profilePicture: student.profilePicture,
      oldProfilePicture: oldProfilePicturePath
    }
  }
}

export default new StudentService()
