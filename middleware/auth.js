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
    getUser: (id) => studentRepository.findByIdWithoutPassword(id),
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
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    
    // 1. Identify the token (Bearer header has top priority, then specific role cookies)
    let token = extractBearerToken(req);
    
    // If no Bearer, try cookies for the allowed roles
    if (!token && req.cookies) {
      for (const role of rolesArray) {
        if (req.cookies[roleConfig[role].cookieName]) {
          token = req.cookies[roleConfig[role].cookieName];
          break;
        }
      }
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // 2. Decode and verify the token ONCE
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // 3. Check if the role in the token is allowed for this route
    if (!rolesArray.includes(decoded.type)) {
      return res.status(403).json({ error: 'You do not have permission for this action' });
    }

    // 4. Fetch the user based on the type in the token
    const { getUser, reqKey } = roleConfig[decoded.type];
    const user = await getUser(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User not found or disabled' });
    }

    // Attach to request
    req[reqKey] = user;
    req.user = user;
    req.userRole = decoded.type;
    
    next();
  } catch (error) {
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
