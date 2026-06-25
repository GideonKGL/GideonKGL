import type {
  EvidenceItem,
  Incident,
  MonitoringEvent,
  MonitoringState,
  MonitoredUser,
  ReportMetric,
  SosAlert,
  TrackingPoint,
  UserLocation
} from "@shared/types";
import {
  seedEvidence,
  seedIncidents,
  seedReportMetrics,
  seedSosAlerts,
  seedTrackingHistory,
  seedUsers
} from "@renderer/data/seedData";

export const initialMonitoringState: MonitoringState = {
  connectionState: "connecting",
  users: seedUsers,
  sosAlerts: seedSosAlerts,
  incidents: seedIncidents,
  evidence: seedEvidence,
  trackingHistory: seedTrackingHistory,
  reportMetrics: seedReportMetrics,
  lastUpdated: new Date().toISOString()
};

function upsertById<T extends { id: string }>(items: T[], nextItem: T): T[] {
  const index = items.findIndex((item) => item.id === nextItem.id);
  if (index === -1) {
    return [nextItem, ...items];
  }

  return items.map((item) => (item.id === nextItem.id ? nextItem : item));
}

function updateUserLocation(users: MonitoredUser[], location: UserLocation): MonitoredUser[] {
  return users.map((user) => {
    if (user.id !== location.userId) {
      return user;
    }

    return {
      ...user,
      status: user.status === "sos" ? "sos" : "active",
      lastCheckIn: location.timestamp,
      location
    };
  });
}

function appendHistory(history: TrackingPoint[], point: TrackingPoint): TrackingPoint[] {
  return [point, ...history].slice(0, 500);
}

function markUserInSos(users: MonitoredUser[], alert: SosAlert): MonitoredUser[] {
  return users.map((user) =>
    user.id === alert.userId
      ? {
          ...user,
          status: "sos",
          riskLevel: alert.severity === "life-threatening" ? "critical" : "high",
          lastCheckIn: alert.createdAt
        }
      : user
  );
}

function acknowledgeAlert(
  alerts: SosAlert[],
  alertId: string,
  acknowledgedBy: string
): SosAlert[] {
  return alerts.map((alert) =>
    alert.id === alertId
      ? {
          ...alert,
          acknowledged: true,
          acknowledgedBy
        }
      : alert
  );
}

function updateIncidentStatus(
  incidents: Incident[],
  incidentId: string,
  status: Incident["status"]
): Incident[] {
  const updatedAt = new Date().toISOString();
  return incidents.map((incident) =>
    incident.id === incidentId
      ? {
          ...incident,
          status,
          updatedAt
        }
      : incident
  );
}

function normalizeReports(metrics: ReportMetric[]): ReportMetric[] {
  return metrics.map((metric) => ({
    ...metric,
    value: Number(metric.value.toFixed(2)),
    trend: Number(metric.trend.toFixed(2))
  }));
}

export function monitoringReducer(
  state: MonitoringState,
  event: MonitoringEvent
): MonitoringState {
  const lastUpdated = new Date().toISOString();

  switch (event.type) {
    case "connection":
      return {
        ...state,
        connectionState: event.state,
        lastUpdated
      };
    case "gps:update":
      return {
        ...state,
        users: updateUserLocation(state.users, event.payload),
        trackingHistory: appendHistory(state.trackingHistory, {
          id: `hist-${event.payload.userId}-${event.payload.timestamp}`,
          userId: event.payload.userId,
          latitude: event.payload.latitude,
          longitude: event.payload.longitude,
          timestamp: event.payload.timestamp,
          speedKph: event.payload.speedKph
        }),
        lastUpdated
      };
    case "user:upsert":
      return {
        ...state,
        users: upsertById(state.users, event.payload),
        lastUpdated
      };
    case "sos:alert":
      return {
        ...state,
        users: markUserInSos(state.users, event.payload),
        sosAlerts: upsertById(state.sosAlerts, event.payload),
        lastUpdated
      };
    case "sos:acknowledge":
      return {
        ...state,
        sosAlerts: acknowledgeAlert(
          state.sosAlerts,
          event.payload.alertId,
          event.payload.acknowledgedBy
        ),
        lastUpdated
      };
    case "incident:upsert":
      return {
        ...state,
        incidents: upsertById(state.incidents, event.payload),
        lastUpdated
      };
    case "incident:update-status":
      return {
        ...state,
        incidents: updateIncidentStatus(
          state.incidents,
          event.payload.incidentId,
          event.payload.status
        ),
        lastUpdated
      };
    case "evidence:upsert":
      return {
        ...state,
        evidence: upsertById<EvidenceItem>(state.evidence, event.payload),
        lastUpdated
      };
    case "history:append":
      return {
        ...state,
        trackingHistory: appendHistory(state.trackingHistory, event.payload),
        lastUpdated
      };
    case "reports:update":
      return {
        ...state,
        reportMetrics: normalizeReports(event.payload),
        lastUpdated
      };
    default:
      return state;
  }
}
