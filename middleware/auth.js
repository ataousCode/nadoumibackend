import adminRepository from '../repositories/admin.repository.js'
import studentRepository from '../repositories/student.repository.js'
import { verifyToken } from '../utils/jwt.js'
import { AuthenticationError } from '../utils/errors.js'
import { extractBearerToken } from '../utils/token.js'
import { ROLES } from '../config/constants.js'

const roleConfig = {
  [ROLES.ADMIN]: {
    getUser: (id) => adminRepository.findByIdWithoutPassword(id),
    reqKey: 'admin',
    cookieName: 'adminToken',
  },
  [ROLES.STUDENT]: {
    getUser: (id) => studentRepository.findById(id),
    reqKey: 'student',
    cookieName: 'studentToken',
  },
}

/**
 * Extract JWT from the request.
 * Priority: Authorization header (Bearer) → httpOnly cookie.
 * This allows both browser (cookie) and API/mobile (header) clients.
 */
function extractToken(req, cookieName) {
  return extractBearerToken(req) || (req.cookies && req.cookies[cookieName]) || null
}

export const authenticate = (role) => async (req, res, next) => {
  try {
    const { getUser, reqKey, cookieName } = roleConfig[role]
    const token = extractToken(req, cookieName)

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = verifyToken(token)

    if (decoded.type !== role) {
      return res.status(401).json({ error: 'Invalid token type' })
    }

    const user = await getUser(decoded.id)

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    req[reqKey] = user
    next()
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(401).json({ error: error.message })
    }
    res.status(401).json({ error: 'Invalid token' })
  }
}

