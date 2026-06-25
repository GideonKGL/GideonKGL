import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { api, login, tokenStore } from "./api/client";
import { createSocket } from "./api/socket";
import "./styles/app.css";

type Alert = {
  id: string;
  status: string;
  latitude: string;
  longitude: string;
  message?: string;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string; phone?: string };
  device: { name: string };
};

type Device = {
  id: string;
  name: string;
  user: { firstName: string; lastName: string; email: string };
  locations: { latitude: string; longitude: string; recordedAt: string }[];
};

function App() {
  const [authenticated, setAuthenticated] = useState(Boolean(tokenStore.get()));
  return authenticated ? <Console onLogout={() => setAuthenticated(false)} /> : <Login onLogin={() => setAuthenticated(true)} />;
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await login(email, password);
      onLogin();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed");
    }
  };

  return (
    <main className="login">
      <form className="panel login-panel" onSubmit={submit}>
        <h1>Monitoring Console</h1>
        <input placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        {error && <p className="error">{error}</p>}
        <button>Login</button>
      </form>
    </main>
  );
}

function Console({ onLogout }: { onLogout: () => void }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [query, setQuery] = useState("");
  const alarmContext = useRef<AudioContext>();

  const load = () => {
    api<Alert[]>("/alerts").then(setAlerts).catch(console.error);
    api<Device[]>("/locations/live").then(setDevices).catch(console.error);
  };

  useEffect(() => {
    load();
    const socket = createSocket();
    socket.on("location.created", load);
    socket.on("sos.created", (alert: Alert) => {
      load();
      playAlarm(alarmContext);
      void window.guardian?.notifySos({
        title: "SOS Emergency Alert",
        body: `${alert.user.firstName} ${alert.user.lastName} triggered an SOS`
      });
    });
    socket.on("sos.updated", load);
    return () => {
      socket.disconnect();
    };
  }, []);

  const filteredAlerts = useMemo(
    () =>
      alerts.filter((alert) =>
        `${alert.user.firstName} ${alert.user.lastName} ${alert.user.email} ${alert.device.name}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [alerts, query]
  );

  const updateStatus = async (id: string, status: string) => {
    await api(`/alerts/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    load();
  };

  return (
    <main className="console">
      <header>
        <div>
          <h1>Guardian Monitoring Console</h1>
          <p>Live dispatch dashboard</p>
        </div>
        <button
          onClick={() => {
            tokenStore.clear();
            onLogout();
          }}
        >
          Logout
        </button>
      </header>

      <section className="metrics">
        <Metric label="Open Alerts" value={alerts.filter((alert) => alert.status === "OPEN").length} danger />
        <Metric label="Tracked Devices" value={devices.length} />
        <Metric label="Alert History" value={alerts.length} />
      </section>

      <section className="grid">
        <div className="panel">
          <h2>Real-Time Tracking</h2>
          {devices.map((device) => (
            <div key={device.id} className="row">
              <strong>{device.name}</strong>
              <span>{device.user.firstName} {device.user.lastName}</span>
              <small>
                {device.locations[0]
                  ? `${device.locations[0].latitude}, ${device.locations[0].longitude}`
                  : "No location"}
              </small>
            </div>
          ))}
        </div>

        <div className="panel">
          <h2>User Search</h2>
          <input placeholder="Search users, emails, devices" value={query} onChange={(event) => setQuery(event.target.value)} />
          <h2>Emergency Alerts</h2>
          {filteredAlerts.map((alert) => (
            <article key={alert.id} className={`alert ${alert.status.toLowerCase()}`}>
              <strong>{alert.status}</strong>
              <h3>{alert.user.firstName} {alert.user.lastName}</h3>
              <p>{alert.user.phone ?? alert.user.email}</p>
              <p>{alert.message ?? "No message"}</p>
              <p>{new Date(alert.createdAt).toLocaleString()}</p>
              <div className="actions">
                <button onClick={() => updateStatus(alert.id, "ACKNOWLEDGED")}>Ack</button>
                <button onClick={() => updateStatus(alert.id, "RESOLVED")}>Resolve</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function playAlarm(contextRef: React.MutableRefObject<AudioContext | undefined>) {
  const context = contextRef.current ?? new AudioContext();
  contextRef.current = context;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(880, context.currentTime);
  gain.gain.setValueAtTime(0.2, context.currentTime);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.8);
}

function Metric({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className={`panel metric ${danger ? "danger" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
