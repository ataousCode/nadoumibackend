import prisma from '../config/prisma.js'
import { NotFoundError } from '../utils/errors.js'
import { isUuid, handlePrismaError } from '../utils/prisma.js'

class ScholarshipRepository {
  async findByAnyId(id) {
    const uuidId = isUuid(id) ? id : undefined
    
    const scholarship = await prisma.scholarship.findFirst({
      where: {
        OR: [
          uuidId ? { id } : undefined,
          { scholarshipId: id }
        ].filter(Boolean)
      },
      include: {
        university: true,
        createdBy: true
      }
    })

    if (!scholarship) {
      throw new NotFoundError('Scholarship')
    }
    return scholarship
  }

  async findByAnyIdOrNull(id) {
    const uuidId = isUuid(id) ? id : undefined
    
    return await prisma.scholarship.findFirst({
      where: {
        OR: [
          uuidId ? { id } : undefined,
          { scholarshipId: id }
        ].filter(Boolean)
      }
    })
  }

  async findAll(params = {}) {
    const { where = {}, skip, take } = params
    return await prisma.scholarship.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        university: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })
  }

  async findFeatured(limit = 6) {
    return await prisma.scholarship.findMany({
      where: {
        status: 'published',
        applicationDeadline: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        university: true,
        createdBy: { select: { id: true, email: true, name: true } },
      },
    })
  }

  async count(query = {}) {
    return await prisma.scholarship.count({
      where: query
    })
  }

  async create(scholarshipData) {
    try {
      return await prisma.scholarship.create({
        data: scholarshipData
      })
    } catch (error) {
      handlePrismaError(error, 'Scholarship')
    }
  }

  async update(id, updateData) {
    const scholarship = await this.findByAnyId(id)
    return await prisma.scholarship.update({
      where: { id: scholarship.id },
      data: updateData
    })
  }

  async delete(id) {
    const scholarship = await this.findByAnyId(id)
    return await prisma.scholarship.delete({
      where: { id: scholarship.id }
    })
  }

  async updateStatus(id, status) {
    const scholarship = await this.findByAnyId(id)
    return await prisma.scholarship.update({
      where: { id: scholarship.id },
      data: { status }
    })
  }
}

export default new ScholarshipRepository()
