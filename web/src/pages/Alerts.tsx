import { useEffect, useState } from "react";
import { api } from "../api/client";
import { createSocket } from "../api/socket";

type Alert = {
  id: string;
  status: string;
  latitude: string;
  longitude: string;
  message?: string;
  createdAt: string;
  user: { firstName: string; lastName: string; phone?: string };
  device: { name: string };
};

export function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const load = () => api<Alert[]>("/alerts").then(setAlerts).catch(console.error);

  useEffect(() => {
    load();
    const socket = createSocket();
    socket.on("sos.created", load);
    socket.on("sos.updated", load);
    return () => {
      socket.disconnect();
    };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await api(`/alerts/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    await load();
  };

  return (
    <section>
      <h2>SOS Alert Monitoring</h2>
      <div className="alerts-grid">
        {alerts.map((alert) => (
          <article key={alert.id} className={`card alert ${alert.status.toLowerCase()}`}>
            <strong>{alert.status}</strong>
            <h3>{alert.user.firstName} {alert.user.lastName}</h3>
            <p>{alert.device.name}</p>
            <p>{alert.message ?? "No message supplied"}</p>
            <p>{Number(alert.latitude).toFixed(5)}, {Number(alert.longitude).toFixed(5)}</p>
            <p>{new Date(alert.createdAt).toLocaleString()}</p>
            <div className="actions">
              <button onClick={() => updateStatus(alert.id, "ACKNOWLEDGED")}>Acknowledge</button>
              <button onClick={() => updateStatus(alert.id, "RESOLVED")}>Resolve</button>
              <button onClick={() => updateStatus(alert.id, "CANCELLED")}>Cancel</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
