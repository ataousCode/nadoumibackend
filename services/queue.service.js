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
      const queueConnection = new Redis(REDIS_URL, resilientConfig);
      
      queueConnection.on('error', (err) => logger.error('Queue Redis Error', { error: err.message }));
      queueConnection.on('connect', () => logger.info('Queue Redis Connected'));

      this.notificationQueue = new Queue(NOTIFICATION_QUEUE_NAME, {
        connection: queueConnection
      })
    }
  }

  async addNotificationJob(data) {
    if (!this.notificationQueue) {
       logger.error("Attempted to add job but notificationQueue is null");
       return;
    }

    try {
      const job = await this.notificationQueue.add("send-email", data, {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      });
      logger.info(`Notification job added to queue`, { jobId: job.id, type: data?.type });
      return job;
    } catch (err) {
      logger.error("Failed to add notification job to queue:", {
        error: err.message,
        jobType: data?.type,
      });
      return null;
    }
  }

  initializeWorker() {
    const workerConnection = new Redis(REDIS_URL, {
      ...resilientConfig,
      maxRetriesPerRequest: null,
    });

    workerConnection.on('error', (err) => logger.error('Worker Redis Error', { error: err.message }));
    workerConnection.on('connect', () => logger.info('Worker Redis Connected'));
    workerConnection.on('ready', () => logger.info('Worker Redis Ready'));

    this.worker = new Worker(
      NOTIFICATION_QUEUE_NAME,
      async (job) => {
        logger.info(`Worker processing job ${job.id}`, { type: job.data.type });
        const { notificationId, type, recipient, subject, template, content } = job.data

        try {
          if (type === 'email') {
            await emailService._performSend(recipient, subject, template, content)
          }

          await notificationRepository.update(notificationId, {
            status: 'sent',
            sentAt: new Date()
          })
          logger.info(`Notification job ${job.id} success`);
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

    this.worker.on('failed', (job, err) => {
      logger.error(`Notification job ${job?.id} failed permanently`, { error: err.message })
    })

    logger.info('Notification Worker instance created');
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
