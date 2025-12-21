import Student from '../models/Student.js'
import { NotFoundError, ConflictError } from '../utils/errors.js'
import mongoose from 'mongoose'

/**
 * Student Repository
 * Handles all database operations for Student model
 * Follows Repository pattern for separation of concerns
 */
class StudentRepository {
  /**
   * Create a new student
   */
  async create(studentData) {
    try {
      const student = new Student(studentData)
      await student.save()
      return student
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0]
        throw new ConflictError(`${field} already exists`)
      }
      throw error
    }
  }

  /**
   * Find student by email
   */
  async findByEmail(email) {
    const student = await Student.findOne({ email: email.toLowerCase() })
    return student
  }

  /**
   * Find student by ID
   */
  async findById(id) {
    const student = await Student.findById(id)
    if (!student) {
      throw new NotFoundError('Student')
    }
    return student
  }

  /**
   * Find all students
   */
  async findAll() {
    return await Student.find().sort({ createdAt: -1 })
  }

  /**
   * Find student by email (without throwing error if not found)
   */
  async findByEmailOrNull(email) {
    return await Student.findOne({ email: email.toLowerCase() })
  }

  /**
   * Find student by passport number
   */
  async findByPassportNumber(passportNumber) {
    return await Student.findOne({ passportNumber: passportNumber.toUpperCase() })
  }

  /**
   * Update student
   */
  async update(id, updateData) {
    const student = await this.findById(id)
    
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        student[key] = updateData[key]
      }
    })

    await student.save()
    return student
  }

  /**
   * Update student email verification status
   */
  async updateEmailVerification(id, isVerified) {
    return await this.update(id, { isEmailVerified: isVerified })
  }

  /**
   * Update student password
   */
  async updatePassword(id, hashedPassword) {
    const student = await this.findById(id)
    student.password = hashedPassword
    await student.save()
    return student
  }

  /**
   * Save password reset token
   */
  async savePasswordResetToken(id, token, expiresAt) {
    const student = await this.findById(id)
    student.passwordResetToken = token
    student.passwordResetExpires = expiresAt
    await student.save()
    return student
  }

  /**
   * Find student by password reset token
   */
  async findByPasswordResetToken(token) {
    // Need to select password reset fields explicitly since they're marked as select: false
    return await Student.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires')
  }

  /**
   * Clear password reset token
   */
  async clearPasswordResetToken(id) {
    const student = await this.findById(id)
    student.passwordResetToken = undefined
    student.passwordResetExpires = undefined
    await student.save()
    return student
  }

  /**
   * Save OTP
   */
  async saveOTP(id, otp, expiresAt) {
    const student = await this.findById(id)
    student.emailVerificationOTP = otp
    student.emailVerificationOTPExpires = expiresAt
    await student.save()
    return student
  }

  /**
   * Find student by email and verify OTP
   */
  async verifyOTP(email, otp) {
    // Need to select OTP fields explicitly since they're marked as select: false
    const student = await Student.findOne({ email: email.toLowerCase() })
      .select('+emailVerificationOTP +emailVerificationOTPExpires')
    
    if (!student) {
      throw new NotFoundError('Student')
    }

    if (
      !student.emailVerificationOTP ||
      student.emailVerificationOTP !== otp ||
      !student.emailVerificationOTPExpires ||
      student.emailVerificationOTPExpires < Date.now()
    ) {
      return null
    }

    return student
  }

  /**
   * Clear OTP after successful verification
   */
  async clearOTP(id) {
    const student = await this.findById(id)
    student.emailVerificationOTP = undefined
    student.emailVerificationOTPExpires = undefined
    await student.save()
    return student
  }
}

export default new StudentRepository()

