import Redis from 'ioredis'
import { Queue, Worker } from 'bullmq'
import redisConnection, { resilientConfig } from '../config/redis.js'
import emailService from './email.service.js'
import notificationRepository from '../repositories/notification.repository.js'
import logger from '../utils/logger.js'

const NOTIFICATION_QUEUE_NAME = 'notifications'
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

class QueueService {
  constructor() {
    this.notificationQueue = null;
    this.worker = null;

    if (process.env.NODE_ENV !== 'test') {
      // Use a dedicated, resilient connection for the Queue
      const queueConnection = new Redis(REDIS_URL, resilientConfig);
      this.notificationQueue = new Queue(NOTIFICATION_QUEUE_NAME, {
        connection: queueConnection
      })
    }
  }

  async addNotificationJob(data) {
    if (!this.notificationQueue) return;

    try {
      return await this.notificationQueue.add("send-email", data, {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      });
    } catch (err) {
      // Don't throw - we don't want a failed notification job to block a login or register
      logger.error("Failed to add notification job to queue:", {
        error: err.message,
        jobType: data?.type,
      });
      return null;
    }
  }

  initializeWorker() {
    // Dedicated connection for the Worker (allows blocking operations)
    const workerConnection = new Redis(REDIS_URL, {
      ...resilientConfig,
      maxRetriesPerRequest: null, // Required by BullMQ for workers
    });

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
      { connection: workerConnection }
    )

    this.worker.on('ready', () => {
      logger.info('Notification Worker: Connected to Redis and ready to process jobs');
    });

    this.worker.on('error', (err) => {
      logger.error('Notification Worker: Redis error', { error: err.message });
    });

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
