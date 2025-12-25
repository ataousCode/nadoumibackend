import Joi from 'joi'
import { PASSWORD_MIN_LENGTH } from '../config/constants.js'

export const email = () => Joi.string().email().lowercase().trim()
  .messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email is required',
  })

export const password = () => Joi.string().min(PASSWORD_MIN_LENGTH).max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .messages({
    'string.min': `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    'string.max': 'Password must not exceed 128 characters',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    'string.empty': 'Password is required',
  })

export const phone = () => Joi.string().trim()
  .pattern(/^\+?[1-9]\d{1,14}$/)
  .allow('', null)
  .messages({
    'string.pattern.base': 'Please provide a valid phone number (e.g., +1234567890)',
  })

export const otp = () => Joi.string().length(6).pattern(/^\d+$/)
  .messages({
    'string.length': 'OTP must be 6 digits',
    'string.pattern.base': 'OTP must contain only numbers',
    'string.empty': 'OTP is required',
  })

export const name = (field = 'Name', min = 1, max = 50) => Joi.string().trim().min(min).max(max)
  .messages({
    'string.empty': `${field} is required`,
    'string.min': `${field} must be at least ${min} character${min > 1 ? 's' : ''}`,
    'string.max': `${field} must not exceed ${max} characters`,
  })

export const mongoId = (field = 'ID') => Joi.string().hex().length(24)
  .messages({
    'string.hex': `${field} must be a valid hexadecimal string`,
    'string.length': `${field} must be 24 characters long`,
    'string.empty': `${field} is required`,
  })

