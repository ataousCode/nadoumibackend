import { ERROR_CODES } from "../config/constants.js";

export const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

export const sendCreated = (res, data) => {
  return sendSuccess(res, data, 201)
}

export const sendError = (res, message, statusCode = 400, code = null, errors = null) => {
  const response = {
    success: false,
    error: {
      message,
      code: code || getErrorCode(statusCode),
    },
  };

  if (errors) {
    response.error.errors = errors;
  }

  return res.status(statusCode).json(response);
};

export const sendValidationError = (res, errors) => {
  return sendError(
    res,
    "Validation failed",
    422,
    ERROR_CODES.VALIDATION_ERROR,
    errors,
  );
};

function getErrorCode(statusCode) {
  const codes = {
    400: ERROR_CODES.VALIDATION_ERROR, // Often used for Joi validation initially
    401: ERROR_CODES.AUTHENTICATION_ERROR,
    413: ERROR_CODES.FILE_UPLOAD_ERROR,
    403: ERROR_CODES.AUTHORIZATION_ERROR,
    404: ERROR_CODES.NOT_FOUND,
    409: ERROR_CODES.CONFLICT,
    422: ERROR_CODES.VALIDATION_ERROR,
    429: ERROR_CODES.RATE_LIMIT_EXCEEDED,
    500: ERROR_CODES.INTERNAL_SERVER_ERROR,
  };
  return codes[statusCode] || "UNKNOWN_ERROR";
}


export const sanitize = (obj, sensitiveFields = ['password', 'emailVerificationOTP', 'emailVerificationOTPExpires', 'passwordResetToken', 'passwordResetExpires']) => {
  if (!obj) return null
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitize(item, sensitiveFields))
  }
  
  const sanitized = { ...obj }
  sensitiveFields.forEach(field => {
    delete sanitized[field]
  })
  return sanitized
}
