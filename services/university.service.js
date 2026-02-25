import universityRepository from '../repositories/university.repository.js'
import { ValidationError } from '../utils/errors.js'
import { generateUniversityId } from '../utils/idGenerator.js'
import { PAGINATION_DEFAULT_PAGE, PAGINATION_DEFAULT_LIMIT, UNIVERSITY_STATUS } from '../config/constants.js'
import { parsePagination, buildPaginatedResponse } from '../utils/pagination.js'

class UniversityService {
  generateUniversityId() {
    return generateUniversityId()
  }

  async getAll(filters = {}) {
    const {
      city, province, type, search,
      page = PAGINATION_DEFAULT_PAGE, limit = PAGINATION_DEFAULT_LIMIT,
      status, isAdmin
    } = filters

    const query = {}
    const queryStatus = status || (isAdmin ? undefined : UNIVERSITY_STATUS.ACTIVE)

    if (queryStatus) query.status = queryStatus
    if (city)        query.city = city
    if (province)    query.province = province
    if (type)        query.type = type
    if (search) {
      query.OR = [
        { name:           { contains: search, mode: 'insensitive' } },
        { nameInChinese:  { contains: search, mode: 'insensitive' } },
        { city:           { contains: search, mode: 'insensitive' } },
        { province:       { contains: search, mode: 'insensitive' } },
      ]
    }

    const { skip, take } = parsePagination(page, limit)

    const [universities, total] = await Promise.all([
      universityRepository.findAll({ where: query, skip, take }),
      universityRepository.count(query),
    ])

    return buildPaginatedResponse('universities', universities, total, page, limit)
  }

  async getById(id) {
    return universityRepository.findByAnyId(id)
  }

  async create(universityData) {
    const data = {
      ...universityData,
      universityId: universityData.universityId || this.generateUniversityId(),
    }
    return universityRepository.create(data)
  }

  async update(id, updateData) {
    return universityRepository.update(id, updateData)
  }

  async delete(id) {
    await universityRepository.delete(id)
    return { id }
  }

  async updateStatus(id, status) {
    if (!Object.values(UNIVERSITY_STATUS).includes(status)) {
      throw new ValidationError('Invalid status')
    }
    return universityRepository.updateStatus(id, status)
  }
}

export default new UniversityService()
