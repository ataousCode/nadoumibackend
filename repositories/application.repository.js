import prisma from '../config/prisma.js'
import { NotFoundError } from '../utils/errors.js'
import { isUuid, handlePrismaError } from '../utils/prisma.js'
import { APPLICATION_STATUS } from '../config/constants.js'

class ApplicationRepository {
  async findByAnyId(id) {
    const uuidId = isUuid(id) ? id : undefined
    
    const application = await prisma.application.findFirst({
      where: {
        OR: [
          uuidId ? { id } : undefined,
          { applicationId: id }
        ].filter(Boolean)
      },
      include: {
        student: true,
        scholarship: {
          include: {
            university: true
          }
        }
      }
    })

    if (!application) {
      throw new NotFoundError('Application')
    }
    return application
  }

  async findByAnyIdOrNull(id) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{11,12}$/i.test(id)

    return await prisma.application.findFirst({
      where: {
        OR: [
          isUuid ? { id } : undefined,
          { applicationId: id }
        ].filter(Boolean)
      },
      include: {
        student: true,
        scholarship: {
          include: {
            university: true
          }
        }
      }
    })
  }

  async findByLegacyId(legacyId) {
    return await prisma.application.findFirst({
      where: { legacyId: legacyId.toString() }
    })
  }

  async findByStudentId(studentId) {
    return await prisma.application.findMany({
      where: { studentId },
      orderBy: { submittedAt: 'desc' },
      include: {
        scholarship: {
          include: {
            university: true
          }
        }
      }
    })
  }

  async findAll(filters = {}) {
    return await prisma.application.findMany({
      where: filters,
      orderBy: { submittedAt: 'desc' }
    })
  }

  async findAllWithRelations(where = {}, { skip, take } = {}) {
    return await prisma.application.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      skip,
      take,
      include: {
        student: {
          select: {
            id: true, firstName: true, lastName: true, email: true,
            phone: true, nationality: true, dateOfBirth: true,
            country: true, passportNumber: true,
          },
        },
        scholarship: {
          select: { id: true, title: true, university: true },
        },
      },
    })
  }

  async count(where = {}) {
    return await prisma.application.count({ where })
  }

  async findByStatus(status) {
    return await prisma.application.findMany({
      where: { status },
      orderBy: { submittedAt: 'desc' },
    })
  }

  async findByScholarshipId(scholarshipId) {
    return await prisma.application.findMany({
      where: { scholarshipId },
      orderBy: { submittedAt: 'desc' },
      include: {
        student: {
          select: {
            id: true, firstName: true, lastName: true,
            email: true, phone: true, nationality: true,
          },
        },
        scholarship: true,
      },
    })
  }

  async findByStudentAndId(studentId, applicationId) {
    const application = await prisma.application.findFirst({
      where: { id: applicationId, studentId },
      include: { scholarship: true, student: true },
    })
    if (!application) throw new NotFoundError('Application')
    return application
  }

  async findByStudentAndIdOrNull(studentId, applicationId) {
    return await prisma.application.findFirst({
      where: { id: applicationId, studentId },
    })
  }

  async findExistingApplication(studentId, scholarshipId) {
    return await prisma.application.findFirst({
      where: { studentId, scholarshipId },
    })
  }

  async search(term) {
    return await prisma.application.findMany({
      where: {
        OR: [
          { applicationId: { contains: term, mode: 'insensitive' } },
          { id:            { contains: term, mode: 'insensitive' } },
          {
            student: {
              OR: [
                { firstName: { contains: term, mode: 'insensitive' } },
                { lastName:  { contains: term, mode: 'insensitive' } },
                { email:     { contains: term, mode: 'insensitive' } },
              ],
            },
          },
        ],
      },
      include: {
        student:     { select: { id: true, firstName: true, lastName: true, email: true } },
        scholarship: { select: { title: true } },
      },
      orderBy: { submittedAt: 'desc' },
    })
  }

  async create(applicationData) {
    try {
      return await prisma.application.create({
        data: applicationData
      })
    } catch (error) {
      handlePrismaError(error, 'Application')
    }
  }

  async update(id, updateData) {
    const application = await this.findByAnyId(id)
    return await prisma.application.update({
      where: { id: application.id },
      data: updateData
    })
  }

  async delete(id) {
    const application = await this.findByAnyId(id)
    await prisma.application.delete({
      where: { id: application.id }
    })
    return application
  }
}

export default new ApplicationRepository()
