import Joi from "joi";
import { uuid } from "./validators.js";
import { SCHOLARSHIP_STATUS } from "../config/constants.js";

const scholarshipStatuses = Object.values(SCHOLARSHIP_STATUS);

export const createScholarshipSchema = Joi.object({
  title: Joi.string().required(),
  titleInChinese: Joi.string().optional(),
  description: Joi.string().required(),
  programName: Joi.string().optional(),
  category: Joi.string().optional(),
  programCategories: Joi.array().items(Joi.string().valid("Language", "Bachelor", "Master", "PhD")).required(),
  scholarshipCategory: Joi.string().required(),
  universityId: uuid("University ID").required(),
  applicationDeadline: Joi.date().required(),
  originalTuitionFee: Joi.number().optional(),
  tuitionFeeAfterScholarship: Joi.number().optional(),
  registrationFee: Joi.string().optional(),
  stipend: Joi.string().optional(),
  insurance: Joi.string().optional(),
  availableSlots: Joi.number().optional(),
  duration: Joi.number().optional(),
  scholarshipDuration: Joi.number().optional(),
  field: Joi.string().optional(),
  intake: Joi.string().optional(),
  startDate: Joi.date().optional(),
  benefits: Joi.array().items(Joi.string()).optional(),
  scholarshipPolicy: Joi.string().optional(),
  isRecommended: Joi.boolean().optional(),
  recommendationNotes: Joi.string().optional(),
  requirements: Joi.object().optional(),
  applicationDocuments: Joi.array().optional(),
  status: Joi.string()
    .valid(...scholarshipStatuses)
    .optional(),
});

export const updateScholarshipSchema = Joi.object({
  title: Joi.string().optional(),
  titleInChinese: Joi.string().optional(),
  description: Joi.string().optional(),
  programName: Joi.string().optional(),
  category: Joi.string().optional(),
  programCategory: Joi.string().optional(),
  scholarshipCategory: Joi.string().optional(),
  universityId: uuid("University ID").optional(),
  applicationDeadline: Joi.date().optional(),
  status: Joi.string()
    .valid(...scholarshipStatuses)
    .optional(),
  scholarshipId: Joi.string().optional(),
});

export const updateScholarshipStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...scholarshipStatuses)
    .required()
    .messages({
      "any.only": "Invalid status",
      "string.empty": "Status is required",
    }),
});
