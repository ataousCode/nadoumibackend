import universityRepository from '../repositories/university.repository.js'
import { ValidationError } from '../utils/errors.js'
import { generateUniversityId } from '../utils/idGenerator.js'
import { PAGINATION_DEFAULT_PAGE, PAGINATION_DEFAULT_LIMIT } from '../config/constants.js'

class UniversityService {
  generateUniversityId() {
    return generateUniversityId()
  }

  async getAll(filters = {}) {
    const { city, province, type, search, page = PAGINATION_DEFAULT_PAGE, limit = PAGINATION_DEFAULT_LIMIT, status, isAdmin } = filters
    
    const query = {}
    const queryStatus = status || (isAdmin ? undefined : 'active')
    
    if (queryStatus) {
      query.status = queryStatus
    }
    
    if (city) query.city = city
    if (province) query.province = province
    if (type) query.type = type
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { nameInChinese: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { province: { $regex: search, $options: 'i' } }
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    const [universities, total] = await Promise.all([
      universityRepository.findAll(query)
        .skip(skip)
        .limit(parseInt(limit)),
      universityRepository.count(query)
    ])

    return {
      universities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  }

  async getById(id) {
    const university = await universityRepository.findByAnyId(id)
    await university.populate('programs')
    await university.populate('scholarships')
    return university
  }

  async create(universityData) {
    const data = {
      ...universityData,
      universityId: universityData.universityId || this.generateUniversityId()
    }
    
    try {
      return await universityRepository.create(data)
    } catch (error) {
      if (error.code === 11000) {
        throw new ValidationError('University ID already exists')
      }
      throw error
    }
  }

  async update(id, updateData) {
    const university = await universityRepository.update(id, updateData)
    const populated = await universityRepository.findAll({ _id: university._id })
    return populated[0]
  }

  async delete(id) {
    await universityRepository.delete(id)
    return { id }
  }

  async updateStatus(id, status) {
    if (!['active', 'inactive', 'draft'].includes(status)) {
      throw new ValidationError('Invalid status')
    }

    return await universityRepository.updateStatus(id, status)
  }
}

export default new UniversityService()
