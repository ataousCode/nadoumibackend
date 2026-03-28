import { randomUUID } from "node:crypto";

/**
 * Middleware to add a unique request-id to every request
 * and pass it to the logger.
 */
export const requestIdMiddleware = (req, res, next) => {
  const requestId = req.headers["x-request-id"] || randomUUID();

  // Add to request object for use in controllers/services
  req.id = requestId;

  // Add to response headers
  res.setHeader("x-request-id", requestId);

  next();
};

/**
 * Middleware to create a request-aware logger
 */
export const requestLoggerMiddleware = (logger) => (req, res, next) => {
  // Attach a child logger with request metadata to the request object
  req.logger = logger.child({
    requestId: req.id,
    method: req.method,
    url: req.url,
    ip: req.ip,
  });

  next();
};
