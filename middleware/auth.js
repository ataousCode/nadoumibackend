import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'
import Student from '../models/Student.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Admin authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    
    // Check if it's an admin token
    if (decoded.type !== 'admin') {
      return res.status(401).json({ error: 'Invalid token type' })
    }

    const admin = await Admin.findById(decoded.id).select('-password')
    
    if (!admin) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    req.admin = admin
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// Student authentication middleware
export const authenticateStudent = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    
    // Check if it's a student token
    if (decoded.type !== 'student') {
      return res.status(401).json({ error: 'Invalid token type' })
    }

    const student = await Student.findById(decoded.id).select('-password')
    
    if (!student) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    req.student = { 
      _id: student._id,
      id: student._id, 
      email: student.email 
    }
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

