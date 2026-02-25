import Joi from "joi";
import { uuid } from "./validators.js";
import { SCHOLARSHIP_STATUS } from "../config/constants.js";

const scholarshipStatuses = Object.values(SCHOLARSHIP_STATUS);

export const createScholarshipSchema = Joi.object({
  title: Joi.string().required(),
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
