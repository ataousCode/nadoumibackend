import "./config/env.js"; // Initialize and validate environment first
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import helmet from "helmet";
import hpp from "hpp";
import swaggerUi from "swagger-ui-express";
import compression from "compression";
import { swaggerSpec } from "./config/swagger.js";
import { getUploadsDir } from "./utils/paths.js";
import { FRONTEND_URL } from "./config/constants.js";
import prisma from "./config/prisma.js";
import emailConfig from "./config/email.js";
import { errorHandler } from "./middleware/errorHandler.js";
import adminRoutes from "./routes/admin.js";
import applicationsRoutes from "./routes/applications.js";
import documentsRoutes from "./routes/documents.js";
import studentsRoutes from "./routes/students.js";
import scholarshipsRoutes from "./routes/scholarships.js";
import universitiesRoutes from "./routes/universities.js";
import programsRoutes from "./routes/programs.js";
import mediaRoutes from "./routes/media.js";
import queueService from "./services/queue.service.js";
import redisConnection from "./config/redis.js";
import {
  requestIdMiddleware,
  requestLoggerMiddleware,
} from "./middleware/requestTracker.js";
import logger from "./utils/logger.js";

dotenv.config();


const app = express();
process.app = app; // Expose globally for services (e.g. for Socket.io access)
const PORT = process.env.PORT || 3001;

const normalizeOrigin = (url) => {
  if (!url) return url;
  return url.replace(/\/$/, "");
};

const frontendUrl = normalizeOrigin(FRONTEND_URL);

// In production, strictly only allow the FRONTEND_URL. 
// In development, we can allow localhost and others if needed.
const ALLOWED_ORIGINS = new Set(
  process.env.NODE_ENV === "production"
    ? [
        frontendUrl,
        "https://nadoumibackend.up.railway.app",
        normalizeOrigin(process.env.RAILWAY_STATIC_URL),
      ]
    : [frontendUrl, "http://localhost:5173", "http://localhost:3000"]
);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.has(normalizeOrigin(origin))) {
        return callback(null, true);
      }
      logger.warn(`Blocked by CORS: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(compression());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Request Tracking
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware(logger));

// Security
app.use(hpp());
app.use(
  helmet({
    contentSecurityPolicy: false, // For development flexibility
  }),
);

app.use(
  "/uploads",
  express.static(getUploadsDir(), {
    setHeaders: (res, filePath) => {
      res.set("Access-Control-Allow-Origin", frontendUrl);
      res.set("Access-Control-Allow-Credentials", "true");
    },
  }),
);

app.get("/api/health", async (req, res) => {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    services: {
      database: "down",
      redis: "down",
    },
  };

  // Diagnostic health check: Skip pinging Redis every hit to save costs/limits from automated monitoring.
  // We only check if the connection object exists.
  health.services.database = "up"; // Assumed ok if prisma is connected
  health.services.redis = redisConnection ? "up" : "down";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    health.status = "error";
    health.services.database = "down";
    logger.error("Health check: Database connection failed", {
      error: err.message,
    });
  }

  const statusCode = health.status === "ok" ? 200 : 503;
  res.status(statusCode).json(health);
});

app.use("/api/admin", adminRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/students", studentsRoutes);
app.use("/api/scholarships", scholarshipsRoutes);
app.use("/api/universities", universitiesRoutes);
app.use("/api/programs", programsRoutes);
app.use("/api/media", mediaRoutes);

import { initSocket } from "./socket.js";
import messagesRoutes from "./routes/messages.js";
import http from "http";

const server = http.createServer(app);

app.use("/api/messages", messagesRoutes);

app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: "Nadoumi API Documentation",
  }),
);

// Initialize Socket.IO
import notificationService from "./services/notification.service.js";
const io = initSocket(server, ALLOWED_ORIGINS);
app.set("io", io); // Make io accessible in controllers if needed
notificationService.init(io);

app.use((req, res) => {
  logger.debug("404 Route Not Found", {
    url: req.originalUrl,
    method: req.method,
  });
  res.status(404).json({
    success: false,
    error: {
      message: "Route not found",
      code: "NOT_FOUND",
    },
  });
});

app.use(errorHandler);


async function startServer() {
  const maxRetries = 3;
  let retryCount = 0;

  async function connectWithRetry() {
    try {
      await prisma.$connect();
      logger.info("Connected to PostgreSQL via Prisma");
      return true;
    } catch (error) {
      retryCount++;
      if (retryCount >= maxRetries) {
        logger.error("All Prisma connection retries failed.", {
          code: error.code,
          message: error.message,
          stack: error.stack,
          dbUrl: process.env.DATABASE_URL?.replace(/:.*@/, ":****@"),
        });
        throw error;
      }
      logger.warn(`Prisma connection attempt ${retryCount} failed. Retrying in 2s...`, {
        code: error.code,
        message: error.message,
        dbUrl: process.env.DATABASE_URL?.replace(/:.*@/, ":****@"),
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
      return connectWithRetry();
    }
  }

  try {
    await connectWithRetry();

    emailConfig.initialize();
    // ... rest of startServer logic

    if (process.env.NODE_ENV === "development") {
      try {
        await emailConfig.verify();
        logger.info("Email service verified");
      } catch {
        logger.warn(
          "Email service verification failed. Make sure MailDev is running.",
        );
      }
    }

    queueService.initializeWorker();

    server.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`, {
        environment: process.env.NODE_ENV || "development",
        frontendUrl,
      });
    });
  } catch (error) {
    logger.error("Failed to start server", { error: error.message });
    process.exit(1);
  }
}

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  await queueService.shutdown();
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully");
  await queueService.shutdown();
  await prisma.$disconnect();
  process.exit(0);
});

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;
