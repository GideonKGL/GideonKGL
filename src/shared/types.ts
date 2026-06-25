export type ConnectionState = "connecting" | "connected" | "degraded" | "offline";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type IncidentStatus = "new" | "triaged" | "responding" | "resolved";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface UserProfile {
  id: string;
  name: string;
  callSign: string;
  team: string;
  phone: string;
  riskLevel: RiskLevel;
}

export interface UserLocation extends Coordinates {
  userId: string;
  accuracyMeters: number;
  speedKph: number;
  heading: number;
  batteryPercent: number;
  timestamp: string;
}

export interface MonitoredUser extends UserProfile {
  location: UserLocation;
  status: "active" | "idle" | "offline" | "sos";
  lastCheckIn: string;
}

export interface SosAlert {
  id: string;
  userId: string;
  severity: "urgent" | "life-threatening";
  message: string;
  coordinates: Coordinates;
  createdAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  incidentId?: string;
}

export interface Incident {
  id: string;
  title: string;
  type: "sos" | "geofence" | "medical" | "security" | "traffic" | "other";
  status: IncidentStatus;
  priority: RiskLevel;
  assignedTo: string;
  userIds: string[];
  location: Coordinates;
  createdAt: string;
  updatedAt: string;
  notes: string[];
}

export interface EvidenceItem {
  id: string;
  incidentId: string;
  type: "image" | "video" | "audio" | "document";
  title: string;
  source: string;
  collectedAt: string;
  sizeMb: number;
  url: string;
  verified: boolean;
}

export interface TrackingPoint extends Coordinates {
  id: string;
  userId: string;
  timestamp: string;
  speedKph: number;
}

export interface ReportMetric {
  label: string;
  value: number;
  trend: number;
  unit?: string;
}

export interface MonitoringState {
  connectionState: ConnectionState;
  users: MonitoredUser[];
  sosAlerts: SosAlert[];
  incidents: Incident[];
  evidence: EvidenceItem[];
  trackingHistory: TrackingPoint[];
  reportMetrics: ReportMetric[];
  lastUpdated?: string;
}

export type MonitoringEvent =
  | { type: "connection"; state: ConnectionState }
  | { type: "gps:update"; payload: UserLocation }
  | { type: "user:upsert"; payload: MonitoredUser }
  | { type: "sos:alert"; payload: SosAlert }
  | { type: "sos:acknowledge"; payload: { alertId: string; acknowledgedBy: string } }
  | { type: "incident:upsert"; payload: Incident }
  | { type: "incident:update-status"; payload: { incidentId: string; status: IncidentStatus } }
  | { type: "evidence:upsert"; payload: EvidenceItem }
  | { type: "history:append"; payload: TrackingPoint }
  | { type: "reports:update"; payload: ReportMetric[] };
