import adminRepository from '../repositories/admin.repository.js'
import { generateToken, verifyToken } from '../utils/jwt.js'
import { comparePassword } from '../utils/password.js'
import { AuthenticationError, ValidationError } from '../utils/errors.js'
import { PASSWORD_MIN_LENGTH, ROLES } from '../config/constants.js'
import { sanitize } from '../utils/response.js'

class AdminService {
  async login(email, password) {
    if (!email || !password) {
      throw new ValidationError('Email and password are required')
    }

    const admin = await adminRepository.findByEmailOrNull(email)
    if (!admin) {
      throw new AuthenticationError('Invalid email or password')
    }

    const isValid = await comparePassword(password, admin.password)
    if (!isValid) {
      throw new AuthenticationError('Invalid email or password')
    }

    const token = generateToken({ id: admin.id, email: admin.email, type: ROLES.ADMIN })

    return {
      token,
      admin: sanitize(admin)
    }
  }

  async verifyToken(token) {
    if (!token) {
      throw new AuthenticationError('No token provided')
    }

    const decoded = verifyToken(token)
    const admin = await adminRepository.findByIdWithoutPassword(decoded.id)
    
    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      profilePicture: admin.profilePicture
    }
  }

  async getProfile(adminId) {
    const admin = await adminRepository.findByIdWithoutPassword(adminId)
    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      profilePicture: admin.profilePicture,
      createdAt: admin.createdAt
    }
  }

  async updateProfile(adminId, updateData) {
    const admin = await adminRepository.update(adminId, updateData)
    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      profilePicture: admin.profilePicture
    }
  }

  async changePassword(adminId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
      throw new ValidationError('Current password and new password are required')
    }

    const admin = await adminRepository.findById(adminId)
    
    const isValid = await comparePassword(currentPassword, admin.password)
    if (!isValid) {
      throw new AuthenticationError('Current password is incorrect')
    }

    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      throw new ValidationError(`New password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    }

    await adminRepository.updatePassword(adminId, newPassword)

    return {
      message: 'Password updated successfully'
    }
  }

  async updateProfilePicture(adminId, profilePicturePath, oldProfilePicturePath = null) {
    const admin = await adminRepository.updateProfilePicture(adminId, profilePicturePath)
    return {
      profilePicture: admin.profilePicture,
      oldProfilePicture: oldProfilePicturePath
    }
  }
}

export default new AdminService()
