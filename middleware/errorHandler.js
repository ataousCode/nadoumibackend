import { AppError, ValidationError } from "../utils/errors.js";
import logger from "../utils/logger.js";

export const errorHandler = (err, _req, res, _next) => {
  let error = { ...err };
  error.message = err.message;

  logger.error(err.message || "Unhandled error", {
    code: err.code,
    stack: err.stack,
  });
  

  if (
    err instanceof ValidationError ||
    err.name === "ZodError" ||
    (err.errors && err.statusCode === 400)
  ) {
    let message = err.message || "Validation failed";
    let messageErrors = err.errors || {};

    if (err.name === "ZodError") {
      message = "Validation failed";
      const issues = err.issues || err.errors || [];
      messageErrors = issues.reduce((acc, curr) => {
        const path = curr.path.join(".");
        acc[path] = curr.message;
        return acc;
      }, {});
    }

    error = new AppError(message, 400);
    error.errors = messageErrors;
    return res.status(400).json({
      success: false,
      error: {
        message,
        code: "VALIDATION_ERROR",
        errors: error.errors,
      },
    });
  }

  if (err.name === "CastError") {
    const message = "Resource not found";
    error = new AppError(message, 404);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `${field} already exists`;
    error = new AppError(message, 409);
  }

  if (err.name === "ValidationError" && err.errors && !err.statusCode) {
    const errors = {};
    Object.keys(err.errors).forEach((key) => {
      errors[key] = err.errors[key].message;
    });
    const message = "Validation failed";
    error = new AppError(message, 400);
    error.errors = errors;
  }

  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token";
    error = new AppError(message, 401);
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expired";
    error = new AppError(message, 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || "Server Error",
      code: error.code || "INTERNAL_ERROR",
      ...(error.errors && { errors: error.errors }),
      // Always show stack and more info in dev for better debugging of these persistent errors
      token: process.env.NODE_ENV !== "production" ? err.stack : undefined,
      details: process.env.NODE_ENV !== "production" ? err.message : undefined,
    },
  });
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
