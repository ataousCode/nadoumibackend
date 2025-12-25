/**
 * Token Utilities
 * Helper functions for JWT token extraction and handling
 */

/**
 * Extract Bearer token from request headers
 * @param {object} req - Express request object
 * @returns {string|null} Token or null if not found
 */
export const extractBearerToken = (req) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return null
  
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  
  return parts[1]
}

/**
 * Extract token from Authorization header string
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null if not found
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) return null
  return authHeader.replace('Bearer ', '')
}

/**
 * Create Bearer token string
 * @param {string} token - JWT token
 * @returns {string} Bearer token string
 */
export const createBearerToken = (token) => {
  return `Bearer ${token}`
}

