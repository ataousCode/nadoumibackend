import Joi from 'joi'
import { mongoId } from './validators.js'

export const createApplicationSchema = Joi.object({
  scholarshipId: mongoId('Scholarship ID').required(),
  preferences: Joi.object().optional(),
  documents: Joi.object().optional(),
})

export const updateApplicationSchema = Joi.object({
  preferences: Joi.object().optional(),
  documents: Joi.object().optional(),
})

export const updateApplicationStatusSchema = Joi.object({
  status: Joi.string().valid(
    'pending',
    'under_review',
    'interview',
    'interview_passed',
    'interview_failed',
    'accepted',
    'rejected',
    'revoked'
  ).required()
    .messages({
      'any.only': 'Invalid status',
      'string.empty': 'Status is required',
    }),
  note: Joi.string().optional(),
  metadata: Joi.object({
    interviewDate: Joi.date().optional(),
    interviewTime: Joi.string().optional(),
    videoCallPlatform: Joi.string().optional(),
    videoCallLink: Joi.string().optional(),
    interviewNotes: Joi.string().optional(),
    rejectionReason: Joi.string().optional(),
    rejectionFeedback: Joi.string().optional(),
    revocationReason: Joi.string().optional(),
    revocationDetails: Joi.string().optional(),
    interviewFailureReason: Joi.string().optional(),
  }).optional(),
})

export const uploadAdminDocumentSchema = Joi.object({
  documentType: Joi.string().valid('admission', 'jw202').required()
    .messages({
      'any.only': 'Document type must be "admission" or "jw202"',
      'string.empty': 'Document type is required',
    }),
})
