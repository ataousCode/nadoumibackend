import Admin from '../models/Admin.js'
import Student from '../models/Student.js'
import { verifyToken } from '../utils/jwt.js'
import { AuthenticationError } from '../utils/errors.js'
import { extractBearerToken } from '../utils/token.js'

export const authenticate = async (req, res, next) => {
  try {
    const token = extractBearerToken(req)
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = verifyToken(token)
    
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
    if (error instanceof AuthenticationError) {
      return res.status(401).json({ error: error.message })
    }
    res.status(401).json({ error: 'Invalid token' })
  }
}

export const authenticateStudent = async (req, res, next) => {
  try {
    const token = extractBearerToken(req)
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = verifyToken(token)
    
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
      email: student.email,
      profilePicture: student.profilePicture
    }
    next()
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(401).json({ error: error.message })
    }
    res.status(401).json({ error: 'Invalid token' })
  }
}
