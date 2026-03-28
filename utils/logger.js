import winston from "winston";

const { combine, timestamp, json, printf, colorize, align } = winston.format;

const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  align(),
  printf(
    (info) =>
      `[${info.timestamp}] ${info.level}: ${info.message} ${Object.keys(info).length > 3 ? JSON.stringify(info.meta || info, null, 2) : ""}`,
  ),
);

const loggingTransports = [
  new winston.transports.Console({
    format: process.env.NODE_ENV === "production" ? json() : consoleFormat,
  }),
];

// In production, we could add file transports or stream to a logging service
if (process.env.NODE_ENV === "production") {
  loggingTransports.push(
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  );
}

const logger = winston.createLogger({
  level:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "production" ? "info" : "debug"),
  format: combine(timestamp(), json()),
  defaultMeta: { service: "nadoumi-backend" },
  transports: loggingTransports,
});

export default logger;
