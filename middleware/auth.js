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

export const authenticate = (roles) => async (req, res, next) => {
  try {
    const rolesArray = Array.isArray(roles) ? roles : [roles]
    let token = null
    let decoded = null
    let activeRole = null

    // Try finding a valid token for any of the allowed roles
    for (const role of rolesArray) {
      const { cookieName } = roleConfig[role]
      const t = extractToken(req, cookieName)
      
      if (t) {
        try {
          const d = verifyToken(t)
          if (d.type === role) {
            token = t
            decoded = d
            activeRole = role
            break
          }
        } catch (e) {
          // Token invalid for this role, try next
        }
      }
    }

    if (!token || !decoded || !activeRole) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { getUser, reqKey } = roleConfig[activeRole]
    const user = await getUser(decoded.id)

    if (!user) {
      return res.status(401).json({ error: 'User not found or disabled' })
    }

    req[reqKey] = user;
    req.user = user; // Unified access
    req.userRole = activeRole; // Helpful for multi-role routes
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(401).json({ error: error.message });
    }
    res.status(401).json({ error: "Authentication failed" });
  }
};

/**
 * Identify admin if token is present, but don't require it.
 * This sets req.admin if valid, otherwise just continues.
 */
export const identifyAdmin = async (req, res, next) => {
  try {
    const { cookieName, getUser, reqKey } = roleConfig[ROLES.ADMIN];
    const token = extractToken(req, cookieName);

    if (token) {
      const decoded = verifyToken(token);
      if (decoded.type === ROLES.ADMIN) {
        const admin = await getUser(decoded.id);
        if (admin) {
          req[reqKey] = admin;
          req.user = admin;
          req.userRole = ROLES.ADMIN;
        }
      }
    }
  } catch (error) {
    // Silently ignore identification errors for public routes
  }
  next();
};

/**
 * Authorize middleware based on user roles and/or specific permissions.
 */
export const authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        },
      });
    }
    next();
  };
