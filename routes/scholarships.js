import express from 'express'
import Scholarship from '../models/Scholarship.js'
import University from '../models/University.js'
import { authenticate, authenticateStudent } from '../middleware/auth.js'
import mongoose from 'mongoose'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { category, country, search, page = 1, limit = 12, status } = req.query
    const isAdmin = req.admin
    const queryStatus = status || (isAdmin ? undefined : 'published')
    
    const query = {}
    if (queryStatus) {
      query.status = queryStatus
    }
    
    if (category) query.category = category
    if (req.query.programCategory) query.programCategory = req.query.programCategory
    if (req.query.scholarshipCategory) query.scholarshipCategory = req.query.scholarshipCategory
    if (country) query['university.country'] = country
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { titleInChinese: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { programName: { $regex: search, $options: 'i' } },
        { 'university.name': { $regex: search, $options: 'i' } }
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    const [scholarships, total] = await Promise.all([
      Scholarship.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'email name'),
      Scholarship.countDocuments(query)
    ])

    res.json({
      scholarships,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get scholarships error:', error)
    res.status(500).json({ error: 'Failed to fetch scholarships' })
  }
})

router.get('/featured', async (req, res) => {
  try {
    const scholarships = await Scholarship.find({ 
      status: 'published',
      applicationDeadline: { $gte: new Date() }
    })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('createdBy', 'email name')
    
    res.json(scholarships)
  } catch (error) {
    console.error('Get featured scholarships error:', error)
    res.status(500).json({ error: 'Failed to fetch featured scholarships' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const query = []
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      query.push({ _id: req.params.id })
    }
    query.push({ scholarshipId: req.params.id })
    
    const scholarship = await Scholarship.findOne({ $or: query })
      .populate('createdBy', 'email name')
      .populate('universityRef')
    
    if (!scholarship) {
      return res.status(404).json({ error: 'Scholarship not found' })
    }
    
    res.json(scholarship)
  } catch (error) {
    console.error('Get scholarship error:', error)
    res.status(500).json({ error: 'Failed to fetch scholarship' })
  }
})

router.post('/', authenticate, async (req, res) => {
  try {
    const scholarship = new Scholarship({
      ...req.body,
      createdBy: req.admin._id
    })

    await scholarship.save()

    // Maintain One-to-Many relationship: Add scholarship to university's scholarships array
    if (scholarship.universityRef) {
      await University.findByIdAndUpdate(
        scholarship.universityRef,
        { $addToSet: { scholarships: scholarship._id } },
        { new: true }
      )
    }

    const populated = await Scholarship.findById(scholarship._id)
      .populate('createdBy', 'email name')
      .populate('universityRef')
    
    res.status(201).json(populated)
  } catch (error) {
    console.error('Create scholarship error:', error)
    res.status(500).json({ error: 'Failed to create scholarship' })
  }
})

router.put('/:id', authenticate, async (req, res) => {
  try {
    const query = []
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      query.push({ _id: req.params.id })
    }
    query.push({ scholarshipId: req.params.id })
    
    const scholarship = await Scholarship.findOne({ $or: query })
    if (!scholarship) {
      return res.status(404).json({ error: 'Scholarship not found' })
    }

    const oldUniversityRef = scholarship.universityRef?.toString()
    const newUniversityRef = req.body.universityRef?.toString()

    if (!scholarship.scholarshipId && req.body.scholarshipId) {
      scholarship.scholarshipId = req.body.scholarshipId
    }
    
    Object.assign(scholarship, req.body)
    await scholarship.save()

    // Maintain One-to-Many relationship: Update university's scholarships array
    if (oldUniversityRef !== newUniversityRef) {
      // Remove from old university
      if (oldUniversityRef) {
        await University.findByIdAndUpdate(
          oldUniversityRef,
          { $pull: { scholarships: scholarship._id } }
        )
      }
      // Add to new university
      if (newUniversityRef) {
        await University.findByIdAndUpdate(
          newUniversityRef,
          { $addToSet: { scholarships: scholarship._id } }
        )
      }
    } else if (newUniversityRef) {
      // Ensure it's in the array even if universityRef didn't change
      await University.findByIdAndUpdate(
        newUniversityRef,
        { $addToSet: { scholarships: scholarship._id } }
      )
    }
    
    const populated = await Scholarship.findById(scholarship._id)
      .populate('createdBy', 'email name')
      .populate('universityRef')
    
    res.json(populated)
  } catch (error) {
    console.error('Update scholarship error:', error)
    res.status(500).json({ error: 'Failed to update scholarship' })
  }
})

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const query = []
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      query.push({ _id: req.params.id })
    }
    query.push({ scholarshipId: req.params.id })
    
    const scholarship = await Scholarship.findOneAndDelete({ $or: query })
    if (!scholarship) {
      return res.status(404).json({ error: 'Scholarship not found' })
    }
    res.json({ id: req.params.id })
  } catch (error) {
    console.error('Delete scholarship error:', error)
    res.status(500).json({ error: 'Failed to delete scholarship' })
  }
})

router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['draft', 'published', 'closed', 'active', 'inactive']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const query = []
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      query.push({ _id: req.params.id })
    }
    query.push({ scholarshipId: req.params.id })
    
    const scholarship = await Scholarship.findOne({ $or: query })
    if (!scholarship) {
      return res.status(404).json({ error: 'Scholarship not found' })
    }

    scholarship.status = status
    await scholarship.save()
    res.json(scholarship)
  } catch (error) {
    console.error('Update scholarship status error:', error)
    res.status(500).json({ error: 'Failed to update status' })
  }
})

export default router

