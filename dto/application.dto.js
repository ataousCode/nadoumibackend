import Joi from "joi";
import { uuid } from "./validators.js";
import { APPLICATION_STATUS, DOCUMENT_TYPES } from "../config/constants.js";


export const createApplicationSchema = Joi.object({
  scholarshipId: uuid("Scholarship ID").required(),
  preferences: Joi.object().optional(),
  documents: Joi.object().optional(),
});
 
export const publicCreateApplicationSchema = Joi.object({
  id: Joi.string().optional(),
  submittedAt: Joi.alternatives().try(Joi.date(), Joi.number()).optional(),
  status: Joi.string().optional(),
  applicant: Joi.object({
    firstName: Joi.string().trim().min(1).required(),
    lastName:  Joi.string().trim().min(1).required(),
    email:     Joi.string().email().lowercase().required(),
    phone:     Joi.string().allow('').optional(),
  }).required(),
  desiredProgram: Joi.string().allow('').optional(),
  fields:    Joi.object().optional(),
  documents: Joi.object().optional(),
});

export const updateApplicationSchema = Joi.object({
  preferences: Joi.object().optional(),
  documents: Joi.object().optional(),
});

export const updateApplicationStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(APPLICATION_STATUS))
    .required()
    .messages({
      "any.only": "Invalid status",
      "string.empty": "Status is required",
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
});

export const uploadAdminDocumentSchema = Joi.object({
  documentType: Joi.string().valid(...Object.values(DOCUMENT_TYPES)).required().messages({
    "any.only": `Document type must be one of: ${Object.values(DOCUMENT_TYPES).join(', ')}`,
    "string.empty": "Document type is required",
  }),
});
