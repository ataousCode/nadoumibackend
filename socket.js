import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import logger from "./utils/logger.js";
import { verifyToken } from "./utils/jwt.js";
import { ROLES } from "./config/constants.js";
import prisma from "./config/prisma.js";

export const initSocket = (server, allowedOrigins) => {
  const io = new Server(server, {
    cors: {
      origin: Array.from(allowedOrigins),
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const redisUrl = process.env.REDIS_URL;
  const useRedisAdapter = process.env.USE_REDIS_SOCKET_ADAPTER === "true";

  if (redisUrl && useRedisAdapter) {
    try {
      const pubClient = new Redis(redisUrl);
      const subClient = pubClient.duplicate();
      io.adapter(createAdapter(pubClient, subClient));
      logger.info("Socket.io Redis adapter initialized (Multi-instance mode)");
    } catch (err) {
      logger.error("Failed to initialize Socket.io Redis adapter:", err);
    }
  } else if (redisUrl && !useRedisAdapter) {
    logger.info("Socket.io using in-memory adapter (Single-instance mode). Redis adapter disabled to save limits.");
  } else {
    logger.warn("REDIS_URL not provided, falling back to in-memory adapter");
  }

  // Authentication Middleware for Sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];
      if (!token) return next(new Error("Authentication error"));

      const payload = verifyToken(token);
      socket.user = payload;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user.id;
    const userRole = socket.user.role;

    logger.info(`User connected to socket: ${userId} (${userRole})`);

    // Join user-specific room for presence logic across servers
    socket.join(`user:${userId}`);

    // Broadcast online status to others
    io.emit("status:update", { userId, status: "online" });

    // Join conversation rooms - SECURED
    socket.on("join:conversation", async (conversationId) => {
      try {
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          select: { studentId: true, adminId: true }
        });

        if (conversation && (conversation.studentId === userId || conversation.adminId === userId)) {
          socket.join(`conversation:${conversationId}`);
          logger.debug(`User ${userId} joined room: conversation:${conversationId}`);
        } else {
          logger.warn(`Unauthorized join attempt from ${userId} to ${conversationId}`);
        }
      } catch (err) {
        logger.error(`Error joining conversation ${conversationId}:`, err);
      }
    });

    socket.on("leave:conversation", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Handle typing indicator
    socket.on("typing", ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit("user:typing", {
        userId,
        isTyping,
      });
    });

    // Handle presence query
    socket.on("presence:query", async (targetUserId) => {
      try {
         const sockets = await io.in(`user:${targetUserId}`).fetchSockets();
         const isOnline = sockets.length > 0;
         socket.emit("presence:res", { 
           userId: targetUserId, 
           isOnline
         });
      } catch (err) {
         logger.error(`Error checking presence for ${targetUserId}:`, err);
      }
    });

    socket.on("disconnect", () => {
      try {
        // Delay slightly to ensure socket leaves the room before we check remaining sockets
        setTimeout(async () => {
          try {
            const sockets = await io.in(`user:${userId}`).fetchSockets();
            if (sockets.length === 0) {
              io.emit("status:update", { userId, status: "offline" });
            }
          } catch(e) {
            logger.error("Error in delayed disconnect check", e);
          }
        }, 100);
      } catch (err) {
        logger.error(`Error gracefully disconnecting user ${userId}:`, err);
      }
      logger.info(`User disconnected: ${userId}`);
    });
  });

  return io;
};
