import Admin from '../models/Admin.js'
import { NotFoundError, ConflictError } from '../utils/errors.js'

class AdminRepository {
  async findByEmail(email) {
    const admin = await Admin.findOne({ email: email.toLowerCase() })
    if (!admin) {
      throw new NotFoundError('Admin')
    }
    return admin
  }

  async findByEmailOrNull(email) {
    return await Admin.findOne({ email: email.toLowerCase() })
  }

  async findById(id) {
    const admin = await Admin.findById(id)
    if (!admin) {
      throw new NotFoundError('Admin')
    }
    return admin
  }

  async findByIdWithoutPassword(id) {
    const admin = await Admin.findById(id).select('-password')
    if (!admin) {
      throw new NotFoundError('Admin')
    }
    return admin
  }

  async update(id, updateData) {
    const admin = await this.findById(id)
    
    if (updateData.email && updateData.email !== admin.email) {
      const existing = await this.findByEmailOrNull(updateData.email)
      if (existing && existing._id.toString() !== id.toString()) {
        throw new ConflictError('Email already in use')
      }
      updateData.email = updateData.email.toLowerCase()
    }
    
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        admin[key] = updateData[key]
      }
    })
    
    await admin.save()
    return admin
  }

  async updatePassword(id, newPassword) {
    const admin = await this.findById(id)
    admin.password = newPassword
    await admin.save()
    return admin
  }

  async updateProfilePicture(id, profilePicturePath) {
    const admin = await this.findById(id)
    admin.profilePicture = profilePicturePath
    await admin.save()
    return admin
  }
}

export default new AdminRepository()
