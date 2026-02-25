export const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data
  })
}

export const sendCreated = (res, data) => {
  return sendSuccess(res, data, 201)
}

export const sendError = (res, message, statusCode = 400, errors = null) => {
  const response = {
    success: false,
    error: {
      message,
      code: getErrorCode(statusCode)
    }
  }
  
  if (errors) {
    response.error.errors = errors
  }
  
  return res.status(statusCode).json(response)
}

function getErrorCode(statusCode) {
  const codes = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_ERROR',
    503: 'SERVICE_UNAVAILABLE'
  }
  return codes[statusCode] || 'UNKNOWN_ERROR'
}

/**
 * Removes sensitive fields from an object (e.g., password, salt, OTPs)
 */
export const sanitize = (obj, sensitiveFields = ['password', 'emailVerificationOTP', 'emailVerificationOTPExpires', 'passwordResetToken', 'passwordResetExpires']) => {
  if (!obj) return null
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitize(item, sensitiveFields))
  }
  
  const sanitized = { ...obj }
  sensitiveFields.forEach(field => {
    delete sanitized[field]
  })
  return sanitized
}
