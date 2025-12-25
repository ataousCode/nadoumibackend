import express from 'express'
import adminController from '../controllers/admin.controller.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validator.js'
import {
  loginAdminSchema,
  updateAdminProfileSchema,
  changeAdminPasswordSchema,
} from '../dto/admin.dto.js'
import { createProfilePictureUpload } from '../utils/upload.js'

const router = express.Router()
const profilePictureUpload = createProfilePictureUpload('admin')

router.post('/login', validate(loginAdminSchema), adminController.login)
router.get('/verify', adminController.verifyToken)
router.get('/me', authenticate, adminController.getProfile)
router.put('/me', authenticate, validate(updateAdminProfileSchema), adminController.updateProfile)
router.post('/me/profile-picture', authenticate, profilePictureUpload.single('profilePicture'), adminController.updateProfilePicture)
router.post('/me/password', authenticate, validate(changeAdminPasswordSchema), adminController.changePassword)

export default router
