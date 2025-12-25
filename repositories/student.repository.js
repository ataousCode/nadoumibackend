import Student from '../models/Student.js'
import { NotFoundError, ConflictError } from '../utils/errors.js'
import mongoose from 'mongoose'

class StudentRepository {
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

  async findByEmail(email) {
    const student = await Student.findOne({ email: email.toLowerCase() })
    return student
  }

  async findById(id) {
    const student = await Student.findById(id)
    if (!student) {
      throw new NotFoundError('Student')
    }
    return student
  }

  async findAll() {
    return await Student.find().sort({ createdAt: -1 })
  }

  async findByEmailOrNull(email) {
    return await Student.findOne({ email: email.toLowerCase() })
  }

  async findByPassportNumber(passportNumber) {
    return await Student.findOne({ passportNumber: passportNumber.toUpperCase() })
  }

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

  async updateEmailVerification(id, isVerified) {
    return await this.update(id, { isEmailVerified: isVerified })
  }

  async updatePassword(id, hashedPassword) {
    const student = await this.findById(id)
    student.password = hashedPassword
    await student.save()
    return student
  }

  async savePasswordResetToken(id, token, expiresAt) {
    const student = await this.findById(id)
    student.passwordResetToken = token
    student.passwordResetExpires = expiresAt
    await student.save()
    return student
  }

  async findByPasswordResetToken(token) {
    return await Student.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires')
  }

  async clearPasswordResetToken(id) {
    const student = await this.findById(id)
    student.passwordResetToken = undefined
    student.passwordResetExpires = undefined
    await student.save()
    return student
  }

  async saveOTP(id, otp, expiresAt) {
    const student = await this.findById(id)
    student.emailVerificationOTP = otp
    student.emailVerificationOTPExpires = expiresAt
    await student.save()
    return student
  }

  async verifyOTP(email, otp) {
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

  async clearOTP(id) {
    const student = await this.findById(id)
    student.emailVerificationOTP = undefined
    student.emailVerificationOTPExpires = undefined
    await student.save()
    return student
  }
}

export default new StudentRepository()
