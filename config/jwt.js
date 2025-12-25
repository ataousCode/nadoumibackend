import { JWT_EXPIRES_IN as DEFAULT_EXPIRES_IN } from './constants.js'

export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN
