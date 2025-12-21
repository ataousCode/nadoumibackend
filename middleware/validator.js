import { ValidationError } from '../utils/errors.js'

export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      const errors = {}
      error.details.forEach((detail) => {
        const path = detail.path.join('.')
        errors[path] = detail.message
      })
      throw new ValidationError('Validation failed', errors)
    }

    req.body = value
    next()
  }
}

export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      const errors = {}
      error.details.forEach((detail) => {
        const path = detail.path.join('.')
        errors[path] = detail.message
      })
      throw new ValidationError('Query validation failed', errors)
    }

    req.query = value
    next()
  }
}

export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      const errors = {}
      error.details.forEach((detail) => {
        const path = detail.path.join('.')
        errors[path] = detail.message
      })
      throw new ValidationError('Parameter validation failed', errors)
    }

    req.params = value
    next()
  }
}

