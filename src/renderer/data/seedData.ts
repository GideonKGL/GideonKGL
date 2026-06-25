import type {
  EvidenceItem,
  Incident,
  MonitoredUser,
  ReportMetric,
  SosAlert,
  TrackingPoint
} from "@shared/types";

const now = new Date();

function minutesAgo(minutes: number): string {
  return new Date(now.getTime() - minutes * 60_000).toISOString();
}

export const seedUsers: MonitoredUser[] = [
  {
    id: "usr-1024",
    name: "Amelia Carter",
    callSign: "Medic 12",
    team: "Medical Response",
    phone: "+1 202 555 0124",
    riskLevel: "medium",
    status: "active",
    lastCheckIn: minutesAgo(2),
    location: {
      userId: "usr-1024",
      latitude: 40.7128,
      longitude: -74.006,
      accuracyMeters: 7,
      speedKph: 12,
      heading: 82,
      batteryPercent: 84,
      timestamp: minutesAgo(1)
    }
  },
  {
    id: "usr-1188",
    name: "Jon Bell",
    callSign: "Unit Bravo",
    team: "Security",
    phone: "+1 202 555 0188",
    riskLevel: "critical",
    status: "sos",
    lastCheckIn: minutesAgo(1),
    location: {
      userId: "usr-1188",
      latitude: 40.7192,
      longitude: -74.0121,
      accuracyMeters: 5,
      speedKph: 0,
      heading: 14,
      batteryPercent: 39,
      timestamp: minutesAgo(1)
    }
  },
  {
    id: "usr-1337",
    name: "Priya Singh",
    callSign: "Ops Lead",
    team: "Field Operations",
    phone: "+1 202 555 0137",
    riskLevel: "low",
    status: "idle",
    lastCheckIn: minutesAgo(8),
    location: {
      userId: "usr-1337",
      latitude: 40.7062,
      longitude: -74.0098,
      accuracyMeters: 11,
      speedKph: 2,
      heading: 215,
      batteryPercent: 91,
      timestamp: minutesAgo(8)
    }
  },
  {
    id: "usr-1502",
    name: "Noah Williams",
    callSign: "Traffic 4",
    team: "Traffic Control",
    phone: "+1 202 555 0150",
    riskLevel: "high",
    status: "active",
    lastCheckIn: minutesAgo(4),
    location: {
      userId: "usr-1502",
      latitude: 40.7215,
      longitude: -73.9989,
      accuracyMeters: 9,
      speedKph: 18,
      heading: 160,
      batteryPercent: 66,
      timestamp: minutesAgo(4)
    }
  }
];

export const seedSosAlerts: SosAlert[] = [
  {
    id: "sos-7001",
    userId: "usr-1188",
    severity: "life-threatening",
    message: "Panic button activated near Canal St. No voice response.",
    coordinates: {
      latitude: 40.7192,
      longitude: -74.0121
    },
    createdAt: minutesAgo(3),
    acknowledged: false,
    incidentId: "inc-4401"
  }
];

export const seedIncidents: Incident[] = [
  {
    id: "inc-4401",
    title: "SOS activation - Canal Street",
    type: "sos",
    status: "responding",
    priority: "critical",
    assignedTo: "Dispatch Desk 1",
    userIds: ["usr-1188"],
    location: {
      latitude: 40.7192,
      longitude: -74.0121
    },
    createdAt: minutesAgo(5),
    updatedAt: minutesAgo(2),
    notes: [
      "Nearest security unit dispatched.",
      "Attempted phone contact; no answer."
    ]
  },
  {
    id: "inc-4402",
    title: "Traffic escort delay",
    type: "traffic",
    status: "triaged",
    priority: "medium",
    assignedTo: "Traffic Supervisor",
    userIds: ["usr-1502"],
    location: {
      latitude: 40.7215,
      longitude: -73.9989
    },
    createdAt: minutesAgo(34),
    updatedAt: minutesAgo(11),
    notes: ["Route adjusted to avoid construction closure."]
  }
];

export const seedEvidence: EvidenceItem[] = [
  {
    id: "ev-9001",
    incidentId: "inc-4401",
    type: "audio",
    title: "Open microphone capture",
    source: "Jon Bell device",
    collectedAt: minutesAgo(3),
    sizeMb: 2.4,
    url: "https://example.com/evidence/open-mic-capture.wav",
    verified: true
  },
  {
    id: "ev-9002",
    incidentId: "inc-4401",
    type: "image",
    title: "Nearby CCTV still",
    source: "Canal St Camera 07",
    collectedAt: minutesAgo(2),
    sizeMb: 5.7,
    url: "https://example.com/evidence/cctv-still.jpg",
    verified: false
  },
  {
    id: "ev-9003",
    incidentId: "inc-4402",
    type: "document",
    title: "Route exception report",
    source: "Traffic Control",
    collectedAt: minutesAgo(12),
    sizeMb: 0.8,
    url: "https://example.com/evidence/route-exception.pdf",
    verified: true
  }
];

export const seedTrackingHistory: TrackingPoint[] = seedUsers.flatMap((user, userIndex) =>
  Array.from({ length: 8 }, (_, index) => ({
    id: `hist-${user.id}-${index}`,
    userId: user.id,
    latitude: user.location.latitude - index * 0.001 * (userIndex % 2 === 0 ? 1 : -1),
    longitude: user.location.longitude - index * 0.0012 * (userIndex % 2 === 0 ? -1 : 1),
    timestamp: minutesAgo(index * 5 + userIndex),
    speedKph: Math.max(0, user.location.speedKph - index)
  }))
);

export const seedReportMetrics: ReportMetric[] = [
  { label: "Active users", value: 3, trend: 12 },
  { label: "Open incidents", value: 2, trend: -8 },
  { label: "Avg response", value: 4.8, trend: -16, unit: "min" },
  { label: "Evidence items", value: 3, trend: 22 }
];
