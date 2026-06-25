import { io } from "socket.io-client";
import { tokenStore } from "./client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:4000";

export const createSocket = () =>
  io(SOCKET_URL, {
    auth: { token: tokenStore.get() },
    transports: ["websocket"]
  });
