/**
 * Response Utilities
 * Standardized response formatting for all API endpoints
 */

/**
 * Send successful response
 * @param {object} res - Express response object
 * @param {*} data - Data to send
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data
  })
}

/**
 * Send created response (201)
 * @param {object} res - Express response object
 * @param {*} data - Data to send
 */
export const sendCreated = (res, data) => {
  return sendSuccess(res, data, 201)
}

/**
 * Send error response
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {object} errors - Validation errors object (optional)
 */
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

/**
 * Get error code from status code
 * @param {number} statusCode - HTTP status code
 * @returns {string} Error code
 */
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

