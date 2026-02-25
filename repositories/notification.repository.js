import prisma from '../config/prisma.js'
import { handlePrismaError } from '../utils/prisma.js'

class NotificationRepository {
  async create(data) {
    try {
      return await prisma.notification.create({
        data
      })
    } catch (error) {
      handlePrismaError(error, 'Notification')
    }
  }

  async update(id, data) {
    try {
      return await prisma.notification.update({
        where: { id },
        data
      })
    } catch (error) {
      handlePrismaError(error, 'Notification')
    }
  }

  async findById(id) {
    return await prisma.notification.findUnique({
      where: { id }
    })
  }

  async findByRecipient(recipient) {
    return await prisma.notification.findMany({
      where: { recipient },
      orderBy: { createdAt: 'desc' }
    })
  }
}

export default new NotificationRepository()
