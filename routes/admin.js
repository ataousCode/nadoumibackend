import express from 'express'
import adminController from '../controllers/admin.controller.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validator.js'
import { strictLimiter } from '../middleware/rateLimiter.js'
import {
  loginAdminSchema,
  updateAdminProfileSchema,
  changeAdminPasswordSchema,
} from '../dto/admin.dto.js'
import { createProfilePictureUpload } from '../utils/upload.js'
import { ROLES } from '../config/constants.js'

const router = express.Router()
const profilePictureUpload = createProfilePictureUpload('admin')
const adminAuth = authenticate(ROLES.ADMIN)

router.post('/login',              strictLimiter, validate(loginAdminSchema),                      adminController.login)
router.get('/verify',                                                                               adminController.verifyToken)
router.delete('/logout',           adminAuth,                                                       adminController.logout)
router.get('/me',                  adminAuth,                                                       adminController.getProfile)
router.put('/me',                  adminAuth,     validate(updateAdminProfileSchema),               adminController.updateProfile)
router.post('/me/profile-picture', adminAuth,     profilePictureUpload.single('profilePicture'),   adminController.updateProfilePicture)
router.post('/me/password',        adminAuth,     validate(changeAdminPasswordSchema),              adminController.changePassword)

export default router

