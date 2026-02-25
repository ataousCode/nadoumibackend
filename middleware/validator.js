import { ValidationError } from '../utils/errors.js'

const validateSource = (schema, source, failMessage) => (req, _res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
  })

  if (error) {
    const errors = {}
    error.details.forEach((detail) => {
      errors[detail.path.join('.')] = detail.message
    })
    throw new ValidationError(failMessage, errors)
  }

  req[source] = value
  next()
}

export const validate        = (schema) => validateSource(schema, 'body',   'Validation failed')
export const validateQuery   = (schema) => validateSource(schema, 'query',  'Query validation failed')
export const validateParams  = (schema) => validateSource(schema, 'params', 'Parameter validation failed')
