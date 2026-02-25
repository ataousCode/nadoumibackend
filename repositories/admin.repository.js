import prisma from '../config/prisma.js'
import bcrypt from 'bcryptjs'
import { NotFoundError } from '../utils/errors.js'
import { handlePrismaError } from '../utils/prisma.js'

class AdminRepository {
  async findByEmail(email) {
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() }
    })
    if (!admin) {
      throw new NotFoundError('Admin')
    }
    return admin
  }

  async findByEmailOrNull(email) {
    return await prisma.admin.findUnique({
      where: { email: email.toLowerCase() }
    })
  }

  async findById(id) {
    const admin = await prisma.admin.findUnique({
      where: { id }
    })
    if (!admin) {
      throw new NotFoundError('Admin')
    }
    return admin
  }

  async findByIdWithoutPassword(id) {
    const admin = await prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        profilePicture: true,
        createdAt: true
      }
    })
    if (!admin) {
      throw new NotFoundError('Admin')
    }
    return admin
  }

  async update(id, updateData) {
    const admin = await this.findById(id)
    
    if (updateData.email && updateData.email !== admin.email) {
      const existing = await this.findByEmailOrNull(updateData.email)
      if (existing && existing.id !== id) {
        throw new ConflictError('Email already in use')
      }
      updateData.email = updateData.email.toLowerCase()
    }

    if (updateData.password) {
      const salt = await bcrypt.genSalt(10)
      updateData.password = await bcrypt.hash(updateData.password, salt)
    }
    
    try {
      return await prisma.admin.update({
        where: { id },
        data: updateData
      })
    } catch (error) {
      handlePrismaError(error, 'Admin')
    }
  }

  async updatePassword(id, newPassword) {
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)
    
    return await prisma.admin.update({
      where: { id },
      data: { password: hashedPassword }
    })
  }

  async updateProfilePicture(id, profilePicturePath) {
    return await prisma.admin.update({
      where: { id },
      data: { profilePicture: profilePicturePath }
    })
  }
}

export default new AdminRepository()
