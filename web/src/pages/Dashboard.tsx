import { useEffect, useState } from "react";
import { api } from "../api/client";
import { createSocket } from "../api/socket";

type Summary = {
  users: number;
  activeDevices: number;
  locations: number;
  openAlerts: number;
  resolvedAlerts: number;
};

export function Dashboard() {
  const [summary, setSummary] = useState<Summary>();
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    api<Summary>("/reports/summary").then(setSummary).catch(console.error);
    const socket = createSocket();
    socket.on("location.created", () => setEvents((current) => ["Location update received", ...current].slice(0, 6)));
    socket.on("sos.created", () => setEvents((current) => ["SOS alert received", ...current].slice(0, 6)));
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <section>
      <h2>Dashboard</h2>
      <div className="stats">
        <Stat label="Users" value={summary?.users} />
        <Stat label="Active Devices" value={summary?.activeDevices} />
        <Stat label="Location Updates" value={summary?.locations} />
        <Stat label="Open SOS" value={summary?.openAlerts} danger />
        <Stat label="Resolved SOS" value={summary?.resolvedAlerts} />
      </div>
      <div className="card">
        <h3>Realtime Activity</h3>
        {events.length === 0 ? <p>No realtime events yet.</p> : events.map((event, index) => <p key={`${event}-${index}`}>{event}</p>)}
      </div>
    </section>
  );
}

function Stat({ label, value, danger }: { label: string; value?: number; danger?: boolean }) {
  return (
    <div className={`card stat ${danger ? "danger" : ""}`}>
      <span>{label}</span>
      <strong>{value ?? "-"}</strong>
    </div>
  );
}
