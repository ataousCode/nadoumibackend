import express from 'express'
import University from '../models/University.js'
import { authenticate } from '../middleware/auth.js'
import mongoose from 'mongoose'

const router = express.Router()

function generateUniversityId() {
  const now = new Date()
  const year = now.getFullYear()
  const timestamp = now.getTime()
  const sequence = String(timestamp).slice(-6)
  return `UNI${year}${sequence}`
}

router.get('/', async (req, res) => {
  try {
    const { city, province, type, search, page = 1, limit = 12, status } = req.query
    const isAdmin = req.admin
    const queryStatus = status || (isAdmin ? undefined : 'active')
    
    const query = {}
    if (queryStatus) {
      query.status = queryStatus
    }
    
    if (city) query.city = city
    if (province) query.province = province
    if (type) query.type = type
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { nameInChinese: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { province: { $regex: search, $options: 'i' } }
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    const [universities, total] = await Promise.all([
      University.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('programs')
        .populate('scholarships'),
      University.countDocuments(query)
    ])

    res.json({
      universities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get universities error:', error)
    res.status(500).json({ error: 'Failed to fetch universities' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const query = []
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      query.push({ _id: req.params.id })
    }
    query.push({ universityId: req.params.id })
    
    const university = await University.findOne({ $or: query })
      .populate('programs')
      .populate('scholarships')
    
    if (!university) {
      return res.status(404).json({ error: 'University not found' })
    }
    
    res.json(university)
  } catch (error) {
    console.error('Get university error:', error)
    res.status(500).json({ error: 'Failed to fetch university' })
  }
})

router.post('/', authenticate, async (req, res) => {
  try {
    const universityData = {
      ...req.body,
      universityId: req.body.universityId || generateUniversityId()
    }
    
    const university = new University(universityData)
    await university.save()
    
    res.status(201).json(university)
  } catch (error) {
    console.error('Create university error:', error)
    if (error.code === 11000) {
      return res.status(400).json({ error: 'University ID already exists' })
    }
    res.status(500).json({ error: 'Failed to create university' })
  }
})

router.put('/:id', authenticate, async (req, res) => {
  try {
    const query = []
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      query.push({ _id: req.params.id })
    }
    query.push({ universityId: req.params.id })
    
    const university = await University.findOne({ $or: query })
    if (!university) {
      return res.status(404).json({ error: 'University not found' })
    }

    Object.assign(university, req.body)
    await university.save()
    
    const populated = await University.findById(university._id)
      .populate('programs')
      .populate('scholarships')
    
    res.json(populated)
  } catch (error) {
    console.error('Update university error:', error)
    res.status(500).json({ error: 'Failed to update university' })
  }
})

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const query = []
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      query.push({ _id: req.params.id })
    }
    query.push({ universityId: req.params.id })
    
    const university = await University.findOneAndDelete({ $or: query })
    if (!university) {
      return res.status(404).json({ error: 'University not found' })
    }
    
    res.json({ id: req.params.id })
  } catch (error) {
    console.error('Delete university error:', error)
    res.status(500).json({ error: 'Failed to delete university' })
  }
})

router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body
    if (!['active', 'inactive', 'draft'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const query = []
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      query.push({ _id: req.params.id })
    }
    query.push({ universityId: req.params.id })
    
    const university = await University.findOne({ $or: query })
    if (!university) {
      return res.status(404).json({ error: 'University not found' })
    }

    university.status = status
    await university.save()
    
    res.json(university)
  } catch (error) {
    console.error('Update university status error:', error)
    res.status(500).json({ error: 'Failed to update status' })
  }
})

export default router

