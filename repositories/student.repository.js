import prisma from '../config/prisma.js'
import { NotFoundError } from '../utils/errors.js'
import { handlePrismaError } from '../utils/prisma.js'
import { Prisma } from '@prisma/client'

class StudentRepository {
  async create(studentData) {
    try {
      return await prisma.student.create({
        data: studentData
      })
    } catch (error) {
      handlePrismaError(error, 'Student')
    }
  }

  async findByEmail(email) {
    return await prisma.student.findUnique({
      where: { email: email.toLowerCase() }
    })
  }

  async findById(id) {
    const student = await prisma.student.findUnique({
      where: { id }
    })
    if (!student) {
      throw new NotFoundError('Student')
    }
    return student
  }

  async findAll({ skip, take } = {}) {
    return await prisma.student.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    })
  }

  async count() {
    return await prisma.student.count()
  }

  async findByEmailOrNull(email) {
    return await prisma.student.findUnique({
      where: { email: email.toLowerCase() }
    })
  }

  async findByPassportNumber(passportNumber) {
    return await prisma.student.findUnique({
      where: { passportNumber: passportNumber.toUpperCase() }
    })
  }

  async update(id, updateData) {
    return await prisma.student.update({
      where: { id },
      data: updateData
    })
  }

  async updateEmailVerification(id, isVerified) {
    return await this.update(id, { isEmailVerified: isVerified })
  }

  async updatePassword(id, hashedPassword) {
    return await prisma.student.update({
      where: { id },
      data: { password: hashedPassword }
    })
  }

  async savePasswordResetToken(id, token, expiresAt) {
    return await prisma.student.update({
      where: { id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expiresAt
      }
    })
  }

  async findByPasswordResetToken(token) {
    return await prisma.student.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() }
      }
    })
  }

  async clearPasswordResetToken(id) {
    return await prisma.student.update({
      where: { id },
      data: {
        passwordResetToken: null,
        passwordResetExpires: null
      }
    })
  }

  async saveOTP(id, otp, expiresAt) {
    return await prisma.student.update({
      where: { id },
      data: {
        emailVerificationOTP: otp,
        emailVerificationOTPExpires: expiresAt
      }
    })
  }

  async verifyOTP(email, otp) {
    const student = await prisma.student.findFirst({
      where: {
        email: email.toLowerCase(),
        emailVerificationOTP: otp,
        emailVerificationOTPExpires: { gt: new Date() }
      }
    })
    return student
  }

  async clearOTP(id) {
    return await prisma.student.update({
      where: { id },
      data: {
        emailVerificationOTP: null,
        emailVerificationOTPExpires: null
      }
    })
  }
}

export default new StudentRepository()
