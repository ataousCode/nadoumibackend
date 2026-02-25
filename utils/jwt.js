import jwt from 'jsonwebtoken'
import { JWT_SECRET, JWT_EXPIRES_IN_VALUE } from '../config/constants.js'
import { AuthenticationError } from './errors.js'

export const generateToken = (payload, expiresIn = JWT_EXPIRES_IN_VALUE) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn })
}

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Token expired')
    }
    throw new AuthenticationError('Invalid token')
  }
}
