import scholarshipRepository from '../repositories/scholarship.repository.js'
import Scholarship from '../models/Scholarship.js'
import University from '../models/University.js'
import { ValidationError } from '../utils/errors.js'
import { PAGINATION_DEFAULT_PAGE, PAGINATION_DEFAULT_LIMIT } from '../config/constants.js'

class ScholarshipService {
  async getAll(filters = {}) {
    const { category, country, search, page = PAGINATION_DEFAULT_PAGE, limit = PAGINATION_DEFAULT_LIMIT, status, programCategory, scholarshipCategory, isAdmin } = filters
    
    const query = {}
    const queryStatus = status || (isAdmin ? undefined : 'published')
    
    if (queryStatus) {
      query.status = queryStatus
    }
    
    if (category) query.category = category
    if (programCategory) query.programCategory = programCategory
    if (scholarshipCategory) query.scholarshipCategory = scholarshipCategory
    if (country) query['university.country'] = country
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { titleInChinese: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { programName: { $regex: search, $options: 'i' } },
        { 'university.name': { $regex: search, $options: 'i' } }
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    const [scholarships, total] = await Promise.all([
      scholarshipRepository.findAll(query)
        .skip(skip)
        .limit(parseInt(limit)),
      scholarshipRepository.count(query)
    ])

    return {
      scholarships,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  }

  async getFeatured() {
    return await Scholarship.find({ 
      status: 'published',
      applicationDeadline: { $gte: new Date() }
    })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('createdBy', 'email name')
  }

  async getById(id) {
    const scholarship = await scholarshipRepository.findByAnyId(id)
    await scholarship.populate('createdBy', 'email name')
    await scholarship.populate('universityRef')
    return scholarship
  }

  async create(scholarshipData, adminId) {
    const scholarship = await scholarshipRepository.create({
      ...scholarshipData,
      createdBy: adminId
    })

    if (scholarship.universityRef) {
      await University.findByIdAndUpdate(
        scholarship.universityRef,
        { $addToSet: { scholarships: scholarship._id } },
        { new: true }
      )
    }

    const populated = await Scholarship.findById(scholarship._id)
      .populate('createdBy', 'email name')
      .populate('universityRef')
    
    return populated
  }

  async update(id, updateData) {
    const scholarship = await scholarshipRepository.findByAnyId(id)
    
    const oldUniversityRef = scholarship.universityRef?.toString()
    const newUniversityRef = updateData.universityRef?.toString()

    if (!scholarship.scholarshipId && updateData.scholarshipId) {
      scholarship.scholarshipId = updateData.scholarshipId
    }
    
    Object.assign(scholarship, updateData)
    await scholarship.save()

    if (oldUniversityRef !== newUniversityRef) {
      if (oldUniversityRef) {
        await University.findByIdAndUpdate(
          oldUniversityRef,
          { $pull: { scholarships: scholarship._id } }
        )
      }
      if (newUniversityRef) {
        await University.findByIdAndUpdate(
          newUniversityRef,
          { $addToSet: { scholarships: scholarship._id } }
        )
      }
    } else if (newUniversityRef) {
      await University.findByIdAndUpdate(
        newUniversityRef,
        { $addToSet: { scholarships: scholarship._id } }
      )
    }
    
    const populated = await Scholarship.findById(scholarship._id)
      .populate('createdBy', 'email name')
      .populate('universityRef')
    
    return populated
  }

  async delete(id) {
    await scholarshipRepository.delete(id)
    return { id }
  }

  async updateStatus(id, status) {
    const validStatuses = ['draft', 'published', 'closed', 'active', 'inactive']
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid status')
    }

    const scholarship = await scholarshipRepository.updateStatus(id, status)
    return scholarship
  }
}

export default new ScholarshipService()
