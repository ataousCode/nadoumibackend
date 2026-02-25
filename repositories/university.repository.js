import prisma from '../config/prisma.js'
import { NotFoundError } from '../utils/errors.js'
import { isUuid, handlePrismaError } from '../utils/prisma.js'

class UniversityRepository {
  async findByAnyId(id) {
    const uuidId = isUuid(id) ? id : undefined
    
    const university = await prisma.university.findFirst({
      where: {
        OR: [
          uuidId ? { id } : undefined,
          { universityId: id }
        ].filter(Boolean)
      }
    })

    if (!university) {
      throw new NotFoundError('University')
    }
    return university
  }

  async findAll(params = {}) {
    const { where = {}, skip, take } = params
    return await prisma.university.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        scholarships: true
      }
    })
  }

  async count(query = {}) {
    return await prisma.university.count({
      where: query
    })
  }

  async create(universityData) {
    try {
      return await prisma.university.create({
        data: universityData
      })
    } catch (error) {
      handlePrismaError(error, 'University')
    }
  }

  async update(id, updateData) {
    const university = await this.findByAnyId(id)
    return await prisma.university.update({
      where: { id: university.id },
      data: updateData
    })
  }

  async delete(id) {
    const university = await this.findByAnyId(id)
    return await prisma.university.delete({
      where: { id: university.id }
    })
  }

  async updateStatus(id, status) {
    const university = await this.findByAnyId(id)
    return await prisma.university.update({
      where: { id: university.id },
      data: { status }
    })
  }
}

export default new UniversityRepository()
