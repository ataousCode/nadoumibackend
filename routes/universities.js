import express from 'express'
import universityController from '../controllers/university.controller.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validator.js'

const router = express.Router()

router.get('/', universityController.getAll)
router.get('/:id', universityController.getById)
router.post('/', authenticate, universityController.create)
router.put('/:id', authenticate, universityController.update)
router.delete('/:id', authenticate, universityController.delete)
router.patch('/:id/status', authenticate, universityController.updateStatus)

export default router
