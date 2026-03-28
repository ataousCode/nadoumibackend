import Joi from "joi";
import { email, password, phone, otp, name } from "./validators.js";

export const registerStudentSchema = Joi.object({
  firstName: name("First name").required(),
  lastName: name("Last name").required(),
  email: email().required(),
  password: password().required(),
  country: Joi.string().trim().min(2).max(100).required(),
  city: Joi.string().trim().min(2).max(100).required(),
  gender: Joi.string().valid('Male', 'Female', 'Other').required(),
  passportNumber: Joi.string()
    .trim()
    .min(5)
    .max(20)
    .required()
    .pattern(/^[A-Z0-9]+$/),
  phone: phone().required(),
  dateOfBirth: Joi.date().max("now").required(),
  
  // Education Info
  currentLevel: Joi.string().required(),
  university: Joi.string().required(),
  major: Joi.string().required(),
  gpa: Joi.string().allow('', null).optional(),
  gradYear: Joi.string().required(),

  // Scholarship Goals
  studyLevel: Joi.string().required(),
  desiredField: Joi.string().required(),
  preferredCities: Joi.array().items(Joi.string()).min(1).required(),
  preferredLanguages: Joi.array().items(Joi.string()).optional(),
});

export const loginStudentSchema = Joi.object({
  email: email().required(),
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
  }),
});

export const verifyOTPSchema = Joi.object({
  email: email().required(),
  otp: otp().required(),
});

export const resendOTPSchema = Joi.object({
  email: email().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: email().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    "string.empty": "Reset token is required",
  }),
  password: password().required(),
});

export const updateProfileSchema = Joi.object({
  firstName: name("First name").optional(),
  lastName: name("Last name").optional(),
  phone: phone().optional(),
  dateOfBirth: Joi.date().max("now").optional(),
  nationality: Joi.string().trim().max(100).optional(),
  country: Joi.string().trim().min(2).max(100).optional(),
  profile: Joi.object({
    bio: Joi.string().trim().max(1000).optional(),
    education: Joi.array()
      .items(
        Joi.object({
          institution: Joi.string().trim().optional(),
          degree: Joi.string().trim().optional(),
          field: Joi.string().trim().optional(),
          startDate: Joi.date().optional(),
          endDate: Joi.date().optional(),
          gpa: Joi.number().min(0).max(4).optional(),
        })
      )
      .optional(),
    languages: Joi.array().items(Joi.string().trim()).optional(),
    achievements: Joi.array().items(Joi.string().trim()).optional(),
  }).optional(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "string.empty": "Current password is required",
  }),
  newPassword: password().required(),
});
