import { describe, expect, it } from "vitest";
import type { MonitoringState, SosAlert, UserLocation } from "@shared/types";
import {
  initialMonitoringState,
  monitoringReducer
} from "@renderer/state/monitoringReducer";

function cloneState(): MonitoringState {
  return structuredClone(initialMonitoringState);
}

describe("monitoringReducer", () => {
  it("updates a user's GPS location and appends tracking history", () => {
    const state = cloneState();
    const update: UserLocation = {
      userId: state.users[0].id,
      latitude: 40.75,
      longitude: -73.99,
      accuracyMeters: 4,
      speedKph: 22,
      heading: 44,
      batteryPercent: 77,
      timestamp: "2026-06-25T18:00:00.000Z"
    };

    const nextState = monitoringReducer(state, {
      type: "gps:update",
      payload: update
    });

    expect(nextState.users[0].location).toEqual(update);
    expect(nextState.trackingHistory[0]).toMatchObject({
      userId: update.userId,
      latitude: update.latitude,
      longitude: update.longitude
    });
  });

  it("adds SOS alerts and marks the user in SOS state", () => {
    const state = cloneState();
    const alert: SosAlert = {
      id: "sos-test",
      userId: state.users[0].id,
      severity: "life-threatening",
      message: "Test emergency",
      coordinates: {
        latitude: 40.7,
        longitude: -74
      },
      createdAt: "2026-06-25T18:05:00.000Z",
      acknowledged: false
    };

    const nextState = monitoringReducer(state, {
      type: "sos:alert",
      payload: alert
    });

    expect(nextState.sosAlerts[0]).toEqual(alert);
    expect(nextState.users[0].status).toBe("sos");
    expect(nextState.users[0].riskLevel).toBe("critical");
  });

  it("acknowledges SOS alerts", () => {
    const state = cloneState();
    const alertId = state.sosAlerts[0].id;

    const nextState = monitoringReducer(state, {
      type: "sos:acknowledge",
      payload: {
        alertId,
        acknowledgedBy: "Test Operator"
      }
    });

    expect(nextState.sosAlerts[0]).toMatchObject({
      id: alertId,
      acknowledged: true,
      acknowledgedBy: "Test Operator"
    });
  });

  it("updates incident status and timestamp", () => {
    const state = cloneState();
    const incidentId = state.incidents[0].id;

    const nextState = monitoringReducer(state, {
      type: "incident:update-status",
      payload: {
        incidentId,
        status: "resolved"
      }
    });

    expect(nextState.incidents[0].status).toBe("resolved");
    expect(nextState.incidents[0].updatedAt).not.toBe(state.incidents[0].updatedAt);
  });
});
