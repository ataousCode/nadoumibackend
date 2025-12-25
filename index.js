import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { getUploadsDir } from './utils/paths.js'
import { FRONTEND_URL } from './config/constants.js'
import database from './config/database.js'
import emailConfig from './config/email.js'
import { errorHandler } from './middleware/errorHandler.js'
import adminRoutes from './routes/admin.js'
import productsRoutes from './routes/products.js'
import categoriesRoutes from './routes/categories.js'
import applicationsRoutes from './routes/applications.js'
import documentsRoutes from './routes/documents.js'
import studentsRoutes from './routes/students.js'
import scholarshipsRoutes from './routes/scholarships.js'
import universitiesRoutes from './routes/universities.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nadoumi'

const normalizeOrigin = (url) => {
  if (!url) return url
  return url.replace(/\/$/, '')
}

const frontendUrl = normalizeOrigin(FRONTEND_URL)

app.use(cors({
  origin: function (origin, callback) {
    const normalizedAllowed = normalizeOrigin(frontendUrl)
    const normalizedRequest = normalizeOrigin(origin)
    
    if (!origin || normalizedRequest === normalizedAllowed) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

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
  })
})

// Email service diagnostic endpoint
app.get('/api/test-email', async (req, res) => {
  try {
    // Test 1: Check environment variables
    const envCheck = {
      SMTP_USER: process.env.SMTP_USER ? '✅ Set' : '❌ Missing',
      SMTP_PASS: process.env.SMTP_PASS ? '✅ Set (length: ' + process.env.SMTP_PASS.length + ')' : '❌ Missing',
      SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com (default)',
      SMTP_PORT: process.env.SMTP_PORT || '587 (default)',
      SMTP_SECURE: process.env.SMTP_SECURE || 'false (default)',
      EMAIL_FROM: process.env.EMAIL_FROM || process.env.SMTP_USER || 'Not set',
    }

    // Test 2: Check if transporter exists
    if (!emailConfig.transporter) {
      emailConfig.initialize()
    }

    if (!emailConfig.transporter) {
      return res.status(500).json({
        status: 'error',
        message: 'Email transporter could not be initialized',
        env: envCheck
      })
    }

    // Test 3: Verify SMTP connection
    await emailConfig.verify()

    // Test 4: Send test email
    const testEmail = req.query.email || process.env.SMTP_USER
    if (!testEmail) {
      return res.status(400).json({
        status: 'error',
        message: 'No email address provided. Use ?email=your@email.com',
        env: envCheck
      })
    }

    await emailConfig.sendEmail({
      to: testEmail,
      subject: 'Test Email from Nadoumi Backend',
      html: '<h1>✅ Email Service Works!</h1><p>If you received this, your SMTP configuration is correct.</p><p>Test performed at: ' + new Date().toISOString() + '</p>',
    })

    res.json({
      status: '✅ success',
      message: `Test email sent successfully to ${testEmail}`,
      smtp_verified: true,
      env: envCheck,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      status: '❌ error',
      message: error.message,
      error_type: error.constructor.name,
      error_code: error.code,
      error_stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      env: {
        SMTP_USER: process.env.SMTP_USER ? '✅ Set (' + process.env.SMTP_USER + ')' : '❌ Missing',
        SMTP_PASS: process.env.SMTP_PASS ? '✅ Set (length: ' + process.env.SMTP_PASS.length + ' chars)' : '❌ Missing',
        SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com (default)',
        SMTP_PORT: process.env.SMTP_PORT || '587 (default)',
        SMTP_SECURE: process.env.SMTP_SECURE || 'false (default)',
      }
    })
  }
})

app.use('/api/admin', adminRoutes)
app.use('/api/products', productsRoutes)
app.use('/api/categories', categoriesRoutes)
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
    await database.connect(MONGODB_URI)
    emailConfig.initialize()
    
    if (process.env.NODE_ENV === 'development') {
      try {
        await emailConfig.verify()
        console.log('✅ Email service verified')
      } catch (error) {
        console.warn('Email service verification failed. Make sure MailDev is running.')
      }
    }

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`Frontend URL: ${frontendUrl}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  await database.disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...')
  await database.disconnect()
  process.exit(0)
})

startServer()
