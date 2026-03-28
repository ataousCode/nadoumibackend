import adminRepository from '../repositories/admin.repository.js'
import applicationRepository from '../repositories/application.repository.js'
import universityRepository from '../repositories/university.repository.js'
import scholarshipRepository from '../repositories/scholarship.repository.js'
import { generateToken, verifyToken } from '../utils/jwt.js'
import { comparePassword } from '../utils/password.js'
import { AuthenticationError, ValidationError } from '../utils/errors.js'
import { PASSWORD_MIN_LENGTH, ROLES } from '../config/constants.js'
import { sanitize } from '../utils/response.js'

class AdminService {
  async login(email, password, ip = null) {
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

    // Update session info
    const updatedAdmin = await adminRepository.update(admin.id, {
      lastLoginAt: new Date(),
      lastLoginIp: ip
    })

    const token = generateToken({ id: admin.id, email: admin.email, type: ROLES.ADMIN })

    return {
      token,
      admin: sanitize(updatedAdmin)
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
      phone: admin.phone,
      country: admin.country,
      role: admin.role,
      lastLoginAt: admin.lastLoginAt,
      lastLoginIp: admin.lastLoginIp,
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
      phone: admin.phone,
      country: admin.country,
      role: admin.role,
      lastLoginAt: admin.lastLoginAt,
      lastLoginIp: admin.lastLoginIp,
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

  async getDashboardStats() {
    const totalApplications = await applicationRepository.count()
    const pendingReviews = await applicationRepository.count({
      status: { in: ['pending', 'received', 'under_review'] }
    })
    const activeUniversities = await universityRepository.count({
      status: 'active'
    })
    const totalScholarships = await scholarshipRepository.count()

    // Get last 6 months application trends
    const now = new Date()
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(now.getMonth() - 5)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const applications = await applicationRepository.findAll({
      where: {
        submittedAt: { gte: sixMonthsAgo }
      },
      select: { submittedAt: true },
      orderBy: { submittedAt: 'desc' }
    })

    // Group by month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const trendsMap = {}
    
    // Initialize last 6 months
    for (let i = 0; i < 6; i++) {
      const d = new Date()
      d.setMonth(now.getMonth() - i)
      const monthName = months[d.getMonth()]
      trendsMap[monthName] = 0
    }

    applications.forEach(app => {
      const monthName = months[new Date(app.submittedAt).getMonth()]
      if (trendsMap[monthName] !== undefined) {
        trendsMap[monthName]++
      }
    })

    const trends = Object.entries(trendsMap)
      .map(([month, count]) => ({ month, count }))
      .reverse()

    // University Performance (Top 5)
    const universityPerformanceData = await applicationRepository.findAll({
      include: {
        scholarship: {
          include: { 
            universities: true
          }
        }
      }
    })

    const uniCounts = {}
    universityPerformanceData.forEach(item => {
      const name = item.scholarship?.universities?.[0]?.name
      if (name) {
        uniCounts[name] = (uniCounts[name] || 0) + 1
      }
    })

    const topUniversities = Object.entries(uniCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      

    // Recent Submissions
    const recentSubmissionsRaw = await applicationRepository.findAll({
      take: 5,
      orderBy: { submittedAt: 'desc' },
      include: {
        student: true,
        scholarship: {
          include: { 
            universities: true
          }
        }
      }
    })

    const recentSubmissions = recentSubmissionsRaw.map(app => ({
      id: app.id,
      studentName: app.student ? `${app.student.firstName} ${app.student.lastName}` : 'Unknown Student',
      university: app.scholarship?.universities?.[0]?.name || 'Unknown University',
      scholarship: app.scholarship?.title || 'Unknown Scholarship',
      date: app.submittedAt,
      status: app.status
    }))

    return {
      summary: {
        totalApplications,
        pendingReviews,
        activeUniversities,
        totalScholarships
      },
      trends,
      topUniversities,
      recentSubmissions
    }
  }
}

export default new AdminService()
