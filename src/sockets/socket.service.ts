import type { Server } from "socket.io";
import { logger } from "../config/logger";

let io: Server | undefined;

export const setSocketServer = (server: Server): void => {
  io = server;
};

export const emitToUser = (userId: string, event: string, payload: unknown): void => {
  if (!io) {
    return;
  }

  io.to(`user:${userId}`).emit(event, payload);
};

export const emitToRole = (role: string, event: string, payload: unknown): void => {
  if (!io) {
    return;
  }

  io.to(`role:${role}`).emit(event, payload);
};

export const broadcast = (event: string, payload: unknown): void => {
  if (!io) {
    logger.debug({ event }, "Socket server not initialized; event skipped");
    return;
  }

  io.emit(event, payload);
};
