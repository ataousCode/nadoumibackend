import express from 'express'
import universityController from '../controllers/university.controller.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validator.js'
import { ROLES } from '../config/constants.js'

const router = express.Router()
const adminAuth = authenticate(ROLES.ADMIN)

router.get('/',             universityController.getAll)
router.get('/:id',          universityController.getById)
router.post('/',            adminAuth, universityController.create)
router.put('/:id',          adminAuth, universityController.update)
router.delete('/:id',       adminAuth, universityController.delete)
router.patch('/:id/status', adminAuth, universityController.updateStatus)

export default router
