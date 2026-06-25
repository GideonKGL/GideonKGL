#!/usr/bin/env node
// Live field-device client for Guardian Tracker.
//
// Mirrors the network behaviour of the Flutter mobile app against a running
// backend: it authenticates a field user, registers a device, streams live GPS
// updates (POST /locations) and triggers an SOS emergency (POST /alerts/sos).
// Operator clients (web portal / desktop console) joined to the "operations"
// room receive the resulting `location.created` and `sos.created` events live
// over Socket.IO.
//
// Usage:
//   node tools/live-device-sim.mjs
//   GUARDIAN_API_URL=http://localhost:4000/api/v1 node tools/live-device-sim.mjs --updates 8 --interval 1500
//
// All settings can be supplied via env vars or CLI flags (flags win).

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};

const config = {
  apiBaseUrl: flag("api", process.env.GUARDIAN_API_URL ?? "http://localhost:4000/api/v1"),
  email: flag("email", process.env.FIELD_EMAIL ?? "field.ranger@guardian.dev"),
  password: flag("password", process.env.FIELD_PASSWORD ?? "FieldRangerPass123!"),
  firstName: flag("first", process.env.FIELD_FIRST ?? "Thabo"),
  lastName: flag("last", process.env.FIELD_LAST ?? "Mokoena"),
  phone: flag("phone", process.env.FIELD_PHONE ?? "+27115550199"),
  deviceName: flag("device", process.env.FIELD_DEVICE ?? "Ranger Patrol Phone"),
  deviceUid: flag("uid", process.env.FIELD_DEVICE_UID ?? "field-ranger-pixel-01"),
  updates: Number(flag("updates", process.env.FIELD_UPDATES ?? "6")),
  intervalMs: Number(flag("interval", process.env.FIELD_INTERVAL_MS ?? "1500")),
  // Johannesburg, South Africa as the starting position.
  startLat: Number(flag("lat", process.env.FIELD_LAT ?? "-26.2041")),
  startLng: Number(flag("lng", process.env.FIELD_LNG ?? "28.0473")),
  sosMessage: flag("sos", process.env.FIELD_SOS ?? "Ambushed near the east checkpoint, requesting immediate backup."),
};

let accessToken = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(method, path, body) {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${method} ${path} -> ${response.status}: ${text}`);
  }
  return data;
}

async function authenticate() {
  try {
    const session = await request("POST", "/auth/login", {
      email: config.email,
      password: config.password,
    });
    accessToken = session.accessToken;
    console.log(`[auth] logged in as existing user ${config.email}`);
    return;
  } catch {
    console.log(`[auth] no existing account, registering ${config.email}`);
  }

  const session = await request("POST", "/auth/register", {
    email: config.email,
    password: config.password,
    firstName: config.firstName,
    lastName: config.lastName,
    phone: config.phone,
  });
  accessToken = session.accessToken;
  console.log(`[auth] registered and logged in as ${config.email}`);
}

async function registerDevice() {
  const device = await request("POST", "/devices", {
    name: config.deviceName,
    platform: "ANDROID",
    deviceUid: config.deviceUid,
  });
  console.log(`[device] registered "${device.name}" (${device.id})`);
  return device;
}

async function streamLocations(deviceId) {
  let lat = config.startLat;
  let lng = config.startLng;
  for (let i = 1; i <= config.updates; i += 1) {
    // Drift the position slightly each tick to simulate movement on patrol.
    lat += 0.0009 * (Math.random() - 0.3);
    lng += 0.0009 * (Math.random() - 0.3);
    await request("POST", "/locations", {
      deviceId,
      latitude: Number(lat.toFixed(7)),
      longitude: Number(lng.toFixed(7)),
      accuracy: Number((4 + Math.random() * 6).toFixed(2)),
      speed: Number((6 + Math.random() * 8).toFixed(2)),
      heading: Number((Math.random() * 360).toFixed(2)),
      altitude: Number((1680 + Math.random() * 20).toFixed(2)),
      battery: Math.max(5, 100 - i * 3),
      recordedAt: new Date().toISOString(),
    });
    console.log(`[gps ${i}/${config.updates}] ${lat.toFixed(5)}, ${lng.toFixed(5)} -> location.created emitted`);
    if (i < config.updates) {
      await sleep(config.intervalMs);
    }
  }
  return { lat, lng };
}

async function triggerSos(deviceId, position) {
  const alert = await request("POST", "/alerts/sos", {
    deviceId,
    latitude: Number(position.lat.toFixed(7)),
    longitude: Number(position.lng.toFixed(7)),
    message: config.sosMessage,
  });
  console.log(`[SOS] emergency alert ${alert.id} created (status ${alert.status}) -> sos.created emitted`);
}

async function main() {
  console.log(`[start] live field-device client -> ${config.apiBaseUrl}`);
  await authenticate();
  const device = await registerDevice();
  const finalPosition = await streamLocations(device.id);
  await sleep(config.intervalMs);
  await triggerSos(device.id, finalPosition);
  console.log("[done] live telemetry + SOS delivered; operator dashboards should have updated in real time.");
}

main().catch((error) => {
  console.error(`[error] ${error.message}`);
  process.exit(1);
});
