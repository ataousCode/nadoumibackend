import scholarshipRepository from '../repositories/scholarship.repository.js'
import universityRepository from '../repositories/university.repository.js'
import { ValidationError } from '../utils/errors.js'
import { PAGINATION_DEFAULT_PAGE, PAGINATION_DEFAULT_LIMIT, SCHOLARSHIP_STATUS } from '../config/constants.js'
import { parsePagination, buildPaginatedResponse } from '../utils/pagination.js'

class ScholarshipService {
  async getAll(filters = {}) {
    const {
      category, country, search,
      page = PAGINATION_DEFAULT_PAGE, limit = PAGINATION_DEFAULT_LIMIT,
      status, programCategory, scholarshipCategory, isAdmin
    } = filters

    const query = {}
    const queryStatus = status || (isAdmin ? undefined : SCHOLARSHIP_STATUS.PUBLISHED)

    if (queryStatus)          query.status = queryStatus
    if (category)             query.category = category
    if (programCategory)      query.programCategory = programCategory
    if (scholarshipCategory)  query.scholarshipCategory = scholarshipCategory
    if (country)              query.university = { country }
    if (search) {
      query.OR = [
        { title:           { contains: search, mode: 'insensitive' } },
        { titleInChinese:  { contains: search, mode: 'insensitive' } },
        { description:     { contains: search, mode: 'insensitive' } },
        { programName:     { contains: search, mode: 'insensitive' } },
        { university: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const { skip, take } = parsePagination(page, limit)

    const [scholarships, total] = await Promise.all([
      scholarshipRepository.findAll({ where: query, skip, take }),
      scholarshipRepository.count(query),
    ])

    return buildPaginatedResponse('scholarships', scholarships, total, page, limit)
  }

  async getFeatured() {
    return scholarshipRepository.findFeatured()
  }

  async getById(id) {
    return scholarshipRepository.findByAnyId(id)
  }

  async create(scholarshipData, adminId) {
    const scholarship = await scholarshipRepository.create({
      ...scholarshipData,
      createdById: adminId,
    })
    return scholarshipRepository.findByAnyId(scholarship.id)
  }

  async update(id, updateData) {
    const scholarship = await scholarshipRepository.update(id, updateData)
    return scholarshipRepository.findByAnyId(scholarship.id)
  }

  async delete(id) {
    await scholarshipRepository.delete(id)
    return { id }
  }

  async updateStatus(id, status) {
    if (!Object.values(SCHOLARSHIP_STATUS).includes(status)) {
      throw new ValidationError('Invalid status')
    }
    return scholarshipRepository.updateStatus(id, status)
  }
}

export default new ScholarshipService()
