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
import crypto from 'crypto'
import { ROLES, PASSWORD_RESET_EXPIRATION_HOURS, PAGINATION_DEFAULT_PAGE, PAGINATION_DEFAULT_LIMIT } from '../config/constants.js'
import { sanitize } from '../utils/response.js'
import { parsePagination, buildPaginatedResponse } from '../utils/pagination.js'
import logger from '../utils/logger.js'

class StudentService {
  async register(studentData) {
    const { 
      email, 
      password, 
      passportNumber, 
      firstName, 
      lastName, 
      country, 
      city, 
      gender, 
      phone, 
      dateOfBirth,
      // Education fields
      currentLevel,
      university,
      major,
      gpa,
      gradYear,
      // Scholarship goals fields
      studyLevel,
      desiredField,
      preferredCities,
      preferredLanguages
    } = studentData

    const existingByEmail = await studentRepository.findByEmailOrNull(email)
    if (existingByEmail) {
      throw new ConflictError('Email already registered')
    }

    const existingByPassport = await studentRepository.findByPassportNumber(passportNumber)
    if (existingByPassport) {
      throw new ConflictError('Passport number already registered')
    }

    const hashedPassword = await hashPassword(password)

    // Map to Student model structure
    const student = await studentRepository.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      country,
      city,
      gender,
      phone,
      passportNumber: passportNumber.toUpperCase(),
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      isEmailVerified: false,
      profile: {
        education: [{
          institution: university,
          degree: currentLevel,
          field: major,
          gpa: gpa ? parseFloat(gpa) : null,
          gradYear: gradYear
        }],
        preferences: {
          studyLevel,
          desiredField,
          preferredCities,
          preferredLanguages
        }
      }
    })

    // Auto-verify if email service is disabled
    const emailEnabled = process.env.SMTP_USER && process.env.SMTP_PASS
    
    if (!emailEnabled) {
      // No email service - auto verify and return token
      await studentRepository.updateEmailVerification(student.id, true)
      const token = generateToken({ id: student.id, email: student.email, type: ROLES.STUDENT })
      
      return {
        token,
        student: sanitize(student),
        message: 'Registration successful. You are now logged in.',
      }
    }

    // Email service enabled - send OTP
    const otp = otpService.generateOTP()
    const otpExpires = otpService.generateOTPExpiration()
    await studentRepository.saveOTP(student.id, otp, otpExpires)
    
    try {
      await emailService.sendVerificationOTP(email, otp)
      
      return {
        student: sanitize(student),
        message: 'Registration successful. Please check your email for verification code.',
      }
    } catch (error) {
      logger.error('Failed to send verification email', { error: error.message })
      // Auto-verify on email failure
      await studentRepository.updateEmailVerification(student.id, true)
      const token = generateToken({ id: student.id, email: student.email, type: ROLES.STUDENT })
      
      return {
        token,
        student: {
          id: student.id,
          email: student.email,
          firstName: student.firstName,
          lastName: student.lastName,
          profilePicture: student.profilePicture,
          isEmailVerified: true,
        },
        message: 'Registration successful. You are now logged in.',
      }
    }
  }

  async verifyEmail(email, otp) {
    const student = await studentRepository.verifyOTP(email, otp)

    if (!student) {
      throw new AuthenticationError('Invalid or expired OTP')
    }

    await studentRepository.updateEmailVerification(student.id, true)
    await studentRepository.clearOTP(student.id)

    const token = generateToken({ id: student.id, email: student.email, type: ROLES.STUDENT })

    // Send welcome email in background (non-blocking)
    emailService.sendWelcomeEmail(student.email, student.firstName).catch((error) => {
      logger.error('Failed to send welcome email (non-critical)', { error: error.message })
    })

    return {
      token,
      student: sanitize(student),
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

    await studentRepository.saveOTP(student.id, otp, otpExpires)
    
    // Send email without blocking
    try {
      await emailService.sendVerificationOTP(email, otp)
      return {
        message: 'Verification code has been sent to your email',
      }
    } catch (error) {
      logger.error('Failed to send verification email', { error: error.message })
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

    const token = generateToken({ id: student.id, email: student.email, type: ROLES.STUDENT })

    return {
      token,
      student: sanitize(student),
    }
  }

  async getProfile(studentId) {
    const student = await studentRepository.findByIdWithoutPassword(studentId)
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
      student.id,
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
    await studentRepository.updatePassword(student.id, hashedPassword)
    await studentRepository.clearPasswordResetToken(student.id)

    return {
      message: 'Password reset successfully',
    }
  }

  async getAll(filters = {}) {
    const { page = PAGINATION_DEFAULT_PAGE, limit = PAGINATION_DEFAULT_LIMIT } = filters
    const { skip, take } = parsePagination(page, limit)

    const [students, total] = await Promise.all([
      studentRepository.findAll({ skip, take }),
      studentRepository.count(),
    ])

    return buildPaginatedResponse('students', sanitize(students), total, page, limit)
  }

  async updateProfilePicture(studentId, profilePicturePath, oldProfilePicturePath = null) {
    const student = await studentRepository.update(studentId, { profilePicture: profilePicturePath })
    return {
      profilePicture: student.profilePicture,
      oldProfilePicture: oldProfilePicturePath
    }
  }
}

export default new StudentService()
