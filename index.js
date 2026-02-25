import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { getUploadsDir } from './utils/paths.js'
import { FRONTEND_URL } from './config/constants.js'
import prisma from './config/prisma.js'
import emailConfig from './config/email.js'
import { errorHandler } from './middleware/errorHandler.js'
import adminRoutes from './routes/admin.js'
import applicationsRoutes from './routes/applications.js'
import documentsRoutes from './routes/documents.js'
import studentsRoutes from './routes/students.js'
import scholarshipsRoutes from './routes/scholarships.js'
import universitiesRoutes from './routes/universities.js'
import queueService from './services/queue.service.js'
import logger from './utils/logger.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

const normalizeOrigin = (url) => {
  if (!url) return url
  return url.replace(/\/$/, '')
}

const frontendUrl = normalizeOrigin(FRONTEND_URL)

const ALLOWED_ORIGINS = new Set([
  normalizeOrigin(frontendUrl),
  'https://nadoumi.com',
  'https://www.nadoumi.com',
].filter(Boolean))

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true)
    if (ALLOWED_ORIGINS.has(normalizeOrigin(origin))) {
      return callback(null, true)
    }
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(cookieParser())

app.use('/uploads', express.static(getUploadsDir(), {
  setHeaders: (res, filePath) => {
    res.set('Access-Control-Allow-Origin', frontendUrl)
    res.set('Access-Control-Allow-Credentials', 'true')
  }
}))

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'postgresql'
  })
})


app.use('/api/admin', adminRoutes)
app.use('/api/applications', applicationsRoutes)
app.use('/api/documents', documentsRoutes)
app.use('/api/students', studentsRoutes)
app.use('/api/scholarships', scholarshipsRoutes)
app.use('/api/universities', universitiesRoutes)

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
    },
  })
})

app.use(errorHandler)

async function startServer() {
  try {
    await prisma.$connect()
    logger.info('Connected to PostgreSQL via Prisma')

    emailConfig.initialize()

    if (process.env.NODE_ENV === 'development') {
      try {
        await emailConfig.verify()
        logger.info('Email service verified')
      } catch {
        logger.warn('Email service verification failed. Make sure MailDev is running.')
      }
    }

    queueService.initializeWorker()

    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        frontendUrl,
      })
    })
  } catch (error) {
    logger.error('Failed to start server', { error: error.message })
    process.exit(1)
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  await queueService.shutdown()
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully')
  await queueService.shutdown()
  await prisma.$disconnect()
  process.exit(0)
})

startServer()
