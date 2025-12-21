import Joi from 'joi'

export const registerStudentSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(50).required()
    .messages({
      'string.empty': 'First name is required',
      'string.min': 'First name must be at least 1 character',
      'string.max': 'First name must not exceed 50 characters',
    }),
  lastName: Joi.string().trim().min(1).max(50).required()
    .messages({
      'string.empty': 'Last name is required',
      'string.min': 'Last name must be at least 1 character',
      'string.max': 'Last name must not exceed 50 characters',
    }),
  email: Joi.string().email().lowercase().trim().required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
    }),
  password: Joi.string().min(8).max(128).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'string.empty': 'Password is required',
    }),
  country: Joi.string().trim().min(2).max(100).required()
    .messages({
      'string.empty': 'Country is required',
      'string.min': 'Country must be at least 2 characters',
      'string.max': 'Country must not exceed 100 characters',
    }),
  passportNumber: Joi.string().trim().min(5).max(20).required()
    .pattern(/^[A-Z0-9]+$/)
    .messages({
      'string.empty': 'Passport number is required',
      'string.min': 'Passport number must be at least 5 characters',
      'string.max': 'Passport number must not exceed 20 characters',
      'string.pattern.base': 'Passport number must contain only uppercase letters and numbers',
    }),
  phone: Joi.string().trim().allow('', null).optional()
    .custom((value, helpers) => {
      // Allow empty string or null
      if (!value || value.trim() === '') {
        return value
      }
      // If provided, must match phone pattern
      if (!/^\+?[1-9]\d{1,14}$/.test(value)) {
        return helpers.error('string.pattern.base', { value })
      }
      return value
    })
    .messages({
      'string.pattern.base': 'Please provide a valid phone number (e.g., +1234567890)',
    }),
  dateOfBirth: Joi.date().max('now').optional()
    .messages({
      'date.max': 'Date of birth cannot be in the future',
    }),
})

export const loginStudentSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
    }),
  password: Joi.string().required()
    .messages({
      'string.empty': 'Password is required',
    }),
})

export const verifyOTPSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
    }),
  otp: Joi.string().length(6).pattern(/^\d+$/).required()
    .messages({
      'string.length': 'OTP must be 6 digits',
      'string.pattern.base': 'OTP must contain only numbers',
      'string.empty': 'OTP is required',
    }),
})

export const resendOTPSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
    }),
})

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
    }),
})

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required()
    .messages({
      'string.empty': 'Reset token is required',
    }),
  password: Joi.string().min(8).max(128).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'string.empty': 'Password is required',
    }),
})

export const updateProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(50).optional(),
  lastName: Joi.string().trim().min(1).max(50).optional(),
  phone: Joi.string().trim().pattern(/^\+?[1-9]\d{1,14}$/).allow('').optional(),
  dateOfBirth: Joi.date().max('now').optional(),
  nationality: Joi.string().trim().max(100).optional(),
  country: Joi.string().trim().min(2).max(100).optional(),
  profile: Joi.object({
    bio: Joi.string().trim().max(1000).optional(),
    education: Joi.array().items(Joi.object({
      institution: Joi.string().trim().optional(),
      degree: Joi.string().trim().optional(),
      field: Joi.string().trim().optional(),
      startDate: Joi.date().optional(),
      endDate: Joi.date().optional(),
      gpa: Joi.number().min(0).max(4).optional(),
    })).optional(),
    languages: Joi.array().items(Joi.string().trim()).optional(),
    achievements: Joi.array().items(Joi.string().trim()).optional(),
  }).optional(),
})

// Change password DTO
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required()
    .messages({
      'string.empty': 'Current password is required',
    }),
  newPassword: Joi.string().min(8).max(128).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.min': 'New password must be at least 8 characters',
      'string.max': 'New password must not exceed 128 characters',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, and one number',
      'string.empty': 'New password is required',
    }),
})

