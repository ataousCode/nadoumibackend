import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'
import { authenticate } from '../middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const profilePictureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/profile-pictures/admins')
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const filename = `admin_${req.admin._id}_${Date.now()}${ext}`
    cb(null, filename)
  }
})

const profilePictureUpload = multer({
  storage: profilePictureStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    if (extname && mimetype) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  }
})

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() })
    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const isValid = await admin.comparePassword(password)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, type: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        profilePicture: admin.profilePicture
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    const admin = await Admin.findById(decoded.id).select('-password')
    
    if (!admin) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    res.json({
      user: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        profilePicture: admin.profilePicture
      }
    })
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
})

router.get('/me', authenticate, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-password')
    res.json({
      success: true,
      data: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        profilePicture: admin.profilePicture,
        createdAt: admin.createdAt
      }
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ error: 'Failed to get profile' })
  }
})

router.put('/me', authenticate, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id)
    const { name, email } = req.body

    if (name) admin.name = name
    if (email && email !== admin.email) {
      const existing = await Admin.findOne({ email: email.toLowerCase() })
      if (existing && existing._id.toString() !== admin._id.toString()) {
        return res.status(400).json({ error: 'Email already in use' })
      }
      admin.email = email.toLowerCase()
    }

    await admin.save()

    res.json({
      success: true,
      data: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        profilePicture: admin.profilePicture
      }
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

router.post('/me/profile-picture', authenticate, profilePictureUpload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    const admin = await Admin.findById(req.admin._id)
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' })
    }

    // Delete old profile picture if exists
    if (admin.profilePicture) {
      const oldPath = path.join(__dirname, '../../uploads', admin.profilePicture.replace('/uploads/', ''))
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath)
      }
    }

    const filePath = `/uploads/profile-pictures/admins/${req.file.filename}`
    admin.profilePicture = filePath
    await admin.save()

    res.json({
      success: true,
      profilePicture: filePath
    })
  } catch (error) {
    console.error('Upload profile picture error:', error)
    res.status(500).json({ error: 'Failed to upload profile picture' })
  }
})

router.post('/me/password', authenticate, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id)
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' })
    }

    const isValid = await admin.comparePassword(currentPassword)
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' })
    }

    admin.password = newPassword
    await admin.save()

    res.json({
      success: true,
      data: {
        message: 'Password updated successfully'
      }
    })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ error: 'Failed to change password' })
  }
})

export default router

