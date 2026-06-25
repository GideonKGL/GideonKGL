import { io, type Socket } from "socket.io-client";
import type {
  EvidenceItem,
  Incident,
  MonitoringEvent,
  MonitoredUser,
  ReportMetric,
  SosAlert,
  TrackingPoint,
  UserLocation
} from "@shared/types";

export interface RealtimeSubscription {
  unsubscribe: () => void;
}

export interface RealtimeClientOptions {
  url: string;
  useDemoData: boolean;
  onEvent: (event: MonitoringEvent) => void;
}

type MonitoringSocket = Socket<{
  "gps:update": (payload: UserLocation) => void;
  "user:upsert": (payload: MonitoredUser) => void;
  "sos:alert": (payload: SosAlert) => void;
  "sos:acknowledge": (payload: { alertId: string; acknowledgedBy: string }) => void;
  "incident:upsert": (payload: Incident) => void;
  "incident:update-status": (payload: { incidentId: string; status: Incident["status"] }) => void;
  "evidence:upsert": (payload: EvidenceItem) => void;
  "history:append": (payload: TrackingPoint) => void;
  "reports:update": (payload: ReportMetric[]) => void;
}>;

export function createRealtimeClient(options: RealtimeClientOptions): RealtimeSubscription {
  const socket: MonitoringSocket = io(options.url, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1_000,
    timeout: 6_000,
    autoConnect: true
  });

  let demoTimer: number | undefined;
  let degradedTimer: number | undefined;

  const stopDemo = () => {
    if (demoTimer !== undefined) {
      window.clearInterval(demoTimer);
      demoTimer = undefined;
    }
  };

  const startDemo = () => {
    if (!options.useDemoData || demoTimer !== undefined) {
      return;
    }

    let tick = 0;
    demoTimer = window.setInterval(() => {
      tick += 1;
      const timestamp = new Date().toISOString();
      const userId = tick % 2 === 0 ? "usr-1024" : "usr-1502";
      const latitude = 40.7128 + Math.sin(tick / 4) * 0.007;
      const longitude = -74.006 + Math.cos(tick / 5) * 0.008;

      options.onEvent({
        type: "gps:update",
        payload: {
          userId,
          latitude,
          longitude,
          accuracyMeters: 6 + (tick % 5),
          speedKph: 8 + (tick % 18),
          heading: (tick * 28) % 360,
          batteryPercent: Math.max(22, 94 - tick),
          timestamp
        }
      });

      if (tick % 5 === 0) {
        options.onEvent({
          type: "reports:update",
          payload: [
            { label: "Active users", value: 3 + (tick % 2), trend: 8 + (tick % 4) },
            { label: "Open incidents", value: 2 + (tick % 3), trend: -6 + (tick % 4) },
            { label: "Avg response", value: 4.2 + (tick % 6) / 10, trend: -12, unit: "min" },
            { label: "Evidence items", value: 3 + tick, trend: 18 }
          ]
        });
      }
    }, 3_000);
  };

  const setDegradedIfNeeded = () => {
    degradedTimer = window.setTimeout(() => {
      if (!socket.connected) {
        options.onEvent({ type: "connection", state: "degraded" });
        startDemo();
      }
    }, 1_500);
  };

  socket.on("connect", () => {
    stopDemo();
    if (degradedTimer !== undefined) {
      window.clearTimeout(degradedTimer);
      degradedTimer = undefined;
    }
    options.onEvent({ type: "connection", state: "connected" });
  });

  socket.on("disconnect", () => {
    options.onEvent({ type: "connection", state: "offline" });
    startDemo();
  });

  socket.on("connect_error", () => {
    options.onEvent({ type: "connection", state: "degraded" });
    startDemo();
  });

  socket.on("gps:update", (payload) => options.onEvent({ type: "gps:update", payload }));
  socket.on("user:upsert", (payload) => options.onEvent({ type: "user:upsert", payload }));
  socket.on("sos:alert", (payload) => options.onEvent({ type: "sos:alert", payload }));
  socket.on("sos:acknowledge", (payload) =>
    options.onEvent({ type: "sos:acknowledge", payload })
  );
  socket.on("incident:upsert", (payload) =>
    options.onEvent({ type: "incident:upsert", payload })
  );
  socket.on("incident:update-status", (payload) =>
    options.onEvent({ type: "incident:update-status", payload })
  );
  socket.on("evidence:upsert", (payload) =>
    options.onEvent({ type: "evidence:upsert", payload })
  );
  socket.on("history:append", (payload) =>
    options.onEvent({ type: "history:append", payload })
  );
  socket.on("reports:update", (payload) =>
    options.onEvent({ type: "reports:update", payload })
  );

  options.onEvent({ type: "connection", state: "connecting" });
  setDegradedIfNeeded();

  return {
    unsubscribe: () => {
      stopDemo();
      if (degradedTimer !== undefined) {
        window.clearTimeout(degradedTimer);
      }
      socket.removeAllListeners();
      socket.disconnect();
    }
  };
}
