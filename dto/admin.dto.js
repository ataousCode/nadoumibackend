import Joi from "joi";
import { email, password, name } from "./validators.js";

export const loginAdminSchema = Joi.object({
  email: email().required(),
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
  }),
});

export const updateAdminProfileSchema = Joi.object({
  name: name("Name", 1, 100).optional(),
  email: email().optional(),
  phone: Joi.string().allow('', null).optional(),
  country: Joi.string().allow('', null).optional(),
});

export const changeAdminPasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "string.empty": "Current password is required",
  }),
  newPassword: password().required(),
});
