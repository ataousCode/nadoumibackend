import { Queue, Worker } from 'bullmq'
import redisConnection from '../config/redis.js'
import emailService from './email.service.js'
import notificationRepository from '../repositories/notification.repository.js'
import logger from '../utils/logger.js'

const NOTIFICATION_QUEUE_NAME = 'notifications'

class QueueService {
  constructor() {
    this.notificationQueue = new Queue(NOTIFICATION_QUEUE_NAME, {
      connection: redisConnection
    })
    this.worker = null
  }

  async addNotificationJob(data) {
    return await this.notificationQueue.add('send-email', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 }
    })
  }

  initializeWorker() {
    this.worker = new Worker(
      NOTIFICATION_QUEUE_NAME,
      async (job) => {
        const { notificationId, type, recipient, subject, template, content } = job.data

        try {
          if (type === 'email') {
            await emailService._performSend(recipient, subject, template, content)
          }

          await notificationRepository.update(notificationId, {
            status: 'sent',
            sentAt: new Date()
          })
        } catch (error) {
          logger.error(`Job ${job.id} failed`, { error: error.message })

          await notificationRepository.update(notificationId, {
            status: 'failed',
            error: error.message
          })

          throw error
        }
      },
      { connection: redisConnection }
    )

    this.worker.on('completed', (job) => {
      logger.info(`Notification job completed`, { jobId: job.id })
    })

    this.worker.on('failed', (job, err) => {
      logger.error(`Notification job failed after all attempts`, { jobId: job.id, error: err.message })
    })

    logger.info('Notification Worker initialized')
  }

  async shutdown() {
    if (this.worker) {
      await this.worker.close()
    }
    await this.notificationQueue.close()
    logger.info('Notification Queue and Worker shut down')
  }
}

export default new QueueService()
