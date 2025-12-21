import express from 'express'
import Category from '../models/Category.js'
import { authenticate } from '../middleware/auth.js'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const router = express.Router()

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use absolute path to ensure files are saved correctly
    const uploadPath = path.join(__dirname, '../../uploads/categories')
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    console.log('Multer saving category icon to:', uploadPath)
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const filename = `${Date.now()}_${file.originalname}`
    console.log('Multer category icon filename:', filename)
    cb(null, filename)
  }
})

const upload = multer({ storage })

// Get all categories (public - enabled only)
router.get('/', async (req, res) => {
  try {
    const { enabled } = req.query
    const query = enabled === 'true' ? { enabled: true } : {}
    const categories = await Category.find(query).sort({ name: 1 })
    res.json(categories)
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

// Get single category
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) {
      return res.status(404).json({ error: 'Category not found' })
    }
    res.json(category)
  } catch (error) {
    console.error('Get category error:', error)
    res.status(500).json({ error: 'Failed to fetch category' })
  }
})

// Create category (admin only)
router.post('/', authenticate, upload.single('icon'), async (req, res) => {
  try {
    const data = JSON.parse(req.body.data || '{}')
    const iconFile = req.file

    const iconUrl = iconFile 
      ? `/uploads/categories/${iconFile.filename}`
      : data.icon || null

    const category = new Category({
      ...data,
      icon: iconUrl,
      enabled: data.enabled ?? true
    })

    await category.save()
    res.json(category)
  } catch (error) {
    console.error('Create category error:', error)
    res.status(500).json({ error: 'Failed to create category' })
  }
})

// Update category (admin only)
router.put('/:id', authenticate, upload.single('icon'), async (req, res) => {
  try {
    const data = JSON.parse(req.body.data || '{}')
    const category = await Category.findById(req.params.id)
    if (!category) {
      return res.status(404).json({ error: 'Category not found' })
    }

    if (req.file) {
      data.icon = `/uploads/categories/${req.file.filename}`
    }

    Object.assign(category, data)
    await category.save()
    res.json(category)
  } catch (error) {
    console.error('Update category error:', error)
    res.status(500).json({ error: 'Failed to update category' })
  }
})

// Delete category (admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id)
    if (!category) {
      return res.status(404).json({ error: 'Category not found' })
    }
    res.json({ id: req.params.id })
  } catch (error) {
    console.error('Delete category error:', error)
    res.status(500).json({ error: 'Failed to delete category' })
  }
})

// Toggle category status (admin only)
router.patch('/:id/toggle', authenticate, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) {
      return res.status(404).json({ error: 'Category not found' })
    }
    category.enabled = !category.enabled
    await category.save()
    res.json(category)
  } catch (error) {
    console.error('Toggle category error:', error)
    res.status(500).json({ error: 'Failed to toggle category' })
  }
})

export default router

