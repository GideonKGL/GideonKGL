import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { prisma } from "../database/prisma";
import { verifyAccessToken } from "../utils/jwt";
import { setSocketServer } from "./socket.service";

export const configureSocketServer = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS,
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const authToken =
        socket.handshake.auth.token ??
        socket.handshake.headers.authorization?.toString().replace(/^Bearer\s+/i, "");

      if (!authToken) {
        return next(new Error("Authentication required"));
      }

      const payload = verifyAccessToken(authToken);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true, isActive: true }
      });

      if (!user?.isActive) {
        return next(new Error("User account is inactive or no longer exists"));
      }

      socket.data.user = user;
      return next();
    } catch (error) {
      return next(error instanceof Error ? error : new Error("Socket authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user as { id: string; role: string };
    socket.join(`user:${user.id}`);
    socket.join(`role:${user.role}`);

    logger.info({ socketId: socket.id, userId: user.id }, "Socket connected");

    socket.on("disconnect", (reason) => {
      logger.info({ socketId: socket.id, userId: user.id, reason }, "Socket disconnected");
    });
  });

  setSocketServer(io);
  return io;
};
