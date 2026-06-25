import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { allowedOrigins } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";
import { verifyAccessToken } from "../utils/tokens.js";
import { registerSocketServer } from "./events.js";

export const attachSocketServer = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (typeof token !== "string") {
        throw new Error("Socket token missing");
      }

      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        include: { roles: { include: { role: true } } }
      });

      if (!user?.isActive) {
        throw new Error("Socket user inactive");
      }

      socket.data.user = {
        id: user.id,
        roles: user.roles.map((userRole) => userRole.role.name)
      };
      next();
    } catch (error) {
      next(error instanceof Error ? error : new Error("Socket authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user as { id: string; roles: string[] };
    socket.join(`user:${user.id}`);

    if (user.roles.some((role) => ["SUPER_ADMIN", "ADMIN", "DISPATCHER", "RESPONDER"].includes(role))) {
      socket.join("operations");
    }

    socket.on("device.subscribe", async ({ deviceId }: { deviceId?: string }) => {
      if (!deviceId) {
        return;
      }

      const device = await prisma.device.findUnique({ where: { id: deviceId } });
      const operations = user.roles.some((role) => ["SUPER_ADMIN", "ADMIN", "DISPATCHER", "RESPONDER"].includes(role));
      if (device && (operations || device.userId === user.id)) {
        socket.join(`device:${device.id}`);
      }
    });

    socket.on("device.unsubscribe", ({ deviceId }: { deviceId?: string }) => {
      if (deviceId) {
        socket.leave(`device:${deviceId}`);
      }
    });
  });

  registerSocketServer(io);
  logger.info("Socket.IO server attached");
  return io;
};
