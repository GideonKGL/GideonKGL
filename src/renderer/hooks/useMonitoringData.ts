import { useEffect, useMemo, useReducer, useRef } from "react";
import type { MonitoringEvent, SosAlert } from "@shared/types";
import {
  initialMonitoringState,
  monitoringReducer
} from "@renderer/state/monitoringReducer";
import { createRealtimeClient } from "@renderer/services/realtimeClient";

const socketUrl =
  import.meta.env.VITE_SOCKET_URL?.toString() ?? "http://localhost:4000";
const demoDataEnabled = import.meta.env.VITE_DEMO_DATA !== "false";

export function useMonitoringData() {
  const [state, dispatch] = useReducer(monitoringReducer, initialMonitoringState);
  const latestAlertRef = useRef<SosAlert | undefined>(undefined);

  useEffect(() => {
    const subscription = createRealtimeClient({
      url: socketUrl,
      useDemoData: demoDataEnabled,
      onEvent: (event: MonitoringEvent) => {
        if (event.type === "sos:alert") {
          latestAlertRef.current = event.payload;
        }
        dispatch(event);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const activeSosAlerts = useMemo(
    () => state.sosAlerts.filter((alert) => !alert.acknowledged),
    [state.sosAlerts]
  );

  return {
    state,
    activeSosAlerts,
    latestAlert: latestAlertRef.current,
    dispatch
  };
}
