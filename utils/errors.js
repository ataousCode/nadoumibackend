import { ERROR_CODES } from "../config/constants.js";

export class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, errors = {}) {
    super(message, 400, ERROR_CODES.VALIDATION_ERROR);
    this.errors = errors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication failed") {
    super(message, 401, ERROR_CODES.AUTHENTICATION_ERROR);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Access denied") {
    super(message, 403, ERROR_CODES.AUTHORIZATION_ERROR);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, ERROR_CODES.NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, 409, ERROR_CODES.CONFLICT);
  }
}
