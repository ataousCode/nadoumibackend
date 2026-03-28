const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

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

export const setTokenCookie = (res, token, name) => {
  res.cookie(name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE_MS,
  })
}

export const clearTokenCookie = (res, name) => {
  res.clearCookie(name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  })
}
