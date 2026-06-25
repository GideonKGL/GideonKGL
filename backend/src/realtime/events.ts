import type { Server } from "socket.io";

let io: Server | undefined;

export const registerSocketServer = (server: Server) => {
  io = server;
};

export const emitOperations = (event: string, payload: unknown) => {
  io?.to("operations").emit(event, payload);
};

export const emitUser = (userId: string, event: string, payload: unknown) => {
  io?.to(`user:${userId}`).emit(event, payload);
};

export const emitDevice = (deviceId: string, event: string, payload: unknown) => {
  io?.to(`device:${deviceId}`).emit(event, payload);
};
