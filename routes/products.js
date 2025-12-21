import express from 'express'
import Product from '../models/Product.js'
import { authenticate } from '../middleware/auth.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const router = express.Router()

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use absolute path to ensure files are saved correctly
    const uploadPath = path.join(__dirname, '../../uploads/products')
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    console.log('Multer saving file to:', uploadPath)
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const filename = `${Date.now()}_${file.originalname}`
    console.log('Multer filename:', filename)
    cb(null, filename)
  }
})

const upload = multer({ storage })

// Get all products (public - enabled only)
router.get('/', async (req, res) => {
  try {
    const { enabled } = req.query
    const query = enabled === 'true' ? { enabled: true } : {}
    const products = await Product.find(query).sort({ name: 1 })
    // Normalize _id to id for frontend and ensure thumbnail/carousel are included
    const normalizedProducts = products.map(p => {
      const productObj = p.toObject()
      return {
        ...productObj,
        id: p._id.toString(),
        thumbnail: productObj.thumbnail || null,
        carousel: productObj.carousel || []
      }
    })
    // Debug: Log products without thumbnails
    const productsWithoutThumbnails = normalizedProducts.filter(p => !p.thumbnail)
    if (productsWithoutThumbnails.length > 0) {
      console.log(`Warning: ${productsWithoutThumbnails.length} products without thumbnails:`, 
        productsWithoutThumbnails.map(p => ({ id: p.id, name: p.name })))
    }
    res.json(normalizedProducts)
  } catch (error) {
    console.error('Get products error:', error)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }
    // Normalize _id to id for frontend
    const normalizedProduct = {
      ...product.toObject(),
      id: product._id.toString()
    }
    res.json(normalizedProduct)
  } catch (error) {
    console.error('Get product error:', error)
    res.status(500).json({ error: 'Failed to fetch product' })
  }
})

// Create product (admin only)
router.post('/', authenticate, upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'carousel', maxCount: 10 }
]), async (req, res) => {
  try {
    const data = JSON.parse(req.body.data || '{}')
    const thumbnailFile = req.files?.thumbnail?.[0]
    const carouselFiles = req.files?.carousel || []

    console.log('Product creation - Files received:', {
      thumbnail: thumbnailFile ? { filename: thumbnailFile.filename, path: thumbnailFile.path } : 'none',
      carousel: carouselFiles.length
    })

    const thumbnailUrl = thumbnailFile 
      ? `/uploads/products/${thumbnailFile.filename}`
      : data.thumbnail || null

    const carouselUrls = carouselFiles.map(f => `/uploads/products/${f.filename}`)
    if (data.carousel) {
      carouselUrls.push(...data.carousel)
    }

    console.log('Product creation - Image URLs:', {
      thumbnail: thumbnailUrl,
      carousel: carouselUrls
    })

    // Ensure required fields are present
    if (!data.name) {
      return res.status(400).json({ error: 'Product name is required' })
    }
    if (!data.price || isNaN(parseFloat(data.price))) {
      return res.status(400).json({ error: 'Valid price is required' })
    }
    if (!data.categoryId) {
      return res.status(400).json({ error: 'Category is required' })
    }

    const product = new Product({
      name: data.name,
      keywords: data.keywords || '',
      categoryId: data.categoryId,
      price: parseFloat(data.price),
      discount: data.discount ? parseFloat(data.discount) : 0,
      originalPrice: data.originalPrice ? parseFloat(data.originalPrice) : null,
      inStock: data.inStock !== undefined ? data.inStock : true,
      reservationTime: data.reservationTime || '',
      weight: data.weight || '',
      details: data.details || '',
      thumbnail: thumbnailUrl,
      carousel: carouselUrls,
      enabled: data.enabled !== undefined ? data.enabled : true
    })

    await product.save()
    // Normalize _id to id for frontend
    const normalizedProduct = {
      ...product.toObject(),
      id: product._id.toString()
    }
    res.json(normalizedProduct)
  } catch (error) {
    console.error('Create product error:', error)
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message).join(', ')
      return res.status(400).json({ 
        error: 'Validation failed',
        message: errors,
        details: error.errors
      })
    }
    
    // Handle other errors
    const errorMessage = error.message || 'Failed to create product'
    res.status(500).json({ 
      error: errorMessage,
      message: errorMessage
    })
  }
})

// Update product (admin only)
router.put('/:id', authenticate, upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'carousel', maxCount: 10 }
]), async (req, res) => {
  try {
    const data = JSON.parse(req.body.data || '{}')
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    if (req.files?.thumbnail?.[0]) {
      data.thumbnail = `/uploads/products/${req.files.thumbnail[0].filename}`
    }

    if (req.files?.carousel?.length > 0) {
      const newUrls = req.files.carousel.map(f => `/uploads/products/${f.filename}`)
      data.carousel = [...(data.carousel || []), ...newUrls]
    }

    Object.assign(product, data)
    await product.save()
    // Normalize _id to id for frontend
    const normalizedProduct = {
      ...product.toObject(),
      id: product._id.toString()
    }
    res.json(normalizedProduct)
  } catch (error) {
    console.error('Update product error:', error)
    res.status(500).json({ error: 'Failed to update product' })
  }
})

// Delete product (admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }
    res.json({ id: req.params.id })
  } catch (error) {
    console.error('Delete product error:', error)
    res.status(500).json({ error: 'Failed to delete product' })
  }
})

// Toggle product status (admin only)
router.patch('/:id/toggle', authenticate, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }
    product.enabled = !product.enabled
    await product.save()
    // Normalize _id to id for frontend
    const normalizedProduct = {
      ...product.toObject(),
      id: product._id.toString()
    }
    res.json(normalizedProduct)
  } catch (error) {
    console.error('Toggle product error:', error)
    res.status(500).json({ error: 'Failed to toggle product' })
  }
})

export default router

