const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days, mirrors JWT_EXPIRES_IN

export const extractBearerToken = (req) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return null

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null

  return parts[1]
}

export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) return null
  return authHeader.replace('Bearer ', '')
}

export const createBearerToken = (token) => {
  return `Bearer ${token}`
}

/**
 * Set an httpOnly JWT cookie.
 * @param {import('express').Response} res
 * @param {string} token  - signed JWT
 * @param {string} name   - cookie name, e.g. 'adminToken' | 'studentToken'
 */
export const setTokenCookie = (res, token, name) => {
  res.cookie(name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE_MS,
  })
}

/**
 * Clear an httpOnly JWT cookie (logout).
 * @param {import('express').Response} res
 * @param {string} name - cookie name to clear
 */
export const clearTokenCookie = (res, name) => {
  res.clearCookie(name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  })
}
