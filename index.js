import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
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

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nadoumi'

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Serve static files from uploads directory
const uploadsPath = path.join(__dirname, '../uploads')
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    // Set CORS headers for static files
    res.set('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:5173')
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

