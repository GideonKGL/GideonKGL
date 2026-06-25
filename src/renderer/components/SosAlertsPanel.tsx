import { AlertTriangle, CheckCircle2, MapPin } from "lucide-react";
import type { Incident, MonitoredUser, SosAlert } from "@shared/types";
import { formatCoordinate, formatDateTime } from "@renderer/utils/format";

interface SosAlertsPanelProps {
  alerts: SosAlert[];
  users: MonitoredUser[];
  incidents: Incident[];
  onAcknowledge: (alertId: string) => void;
  onSelectUser: (userId: string) => void;
}

export function SosAlertsPanel({
  alerts,
  users,
  incidents,
  onAcknowledge,
  onSelectUser
}: SosAlertsPanelProps) {
  return (
    <section className="panel sos-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Incoming SOS Alerts</p>
          <h2>Emergency Queue</h2>
        </div>
        <AlertTriangle size={22} />
      </div>

      <div className="alert-list">
        {alerts.map((alert) => {
          const user = users.find((candidate) => candidate.id === alert.userId);
          const incident = incidents.find((candidate) => candidate.id === alert.incidentId);

          return (
            <article className={`alert-card ${alert.acknowledged ? "acknowledged" : ""}`} key={alert.id}>
              <div className="alert-card-top">
                <span className={`severity-badge severity-${alert.severity}`}>
                  {alert.severity.replace("-", " ")}
                </span>
                <time>{formatDateTime(alert.createdAt)}</time>
              </div>
              <strong>{user?.name ?? alert.userId}</strong>
              <p>{alert.message}</p>
              <button type="button" className="link-button" onClick={() => onSelectUser(alert.userId)}>
                <MapPin size={15} />
                {formatCoordinate(alert.coordinates.latitude)}, {formatCoordinate(alert.coordinates.longitude)}
              </button>
              {incident ? <small>Linked incident: {incident.title}</small> : null}
              <button
                type="button"
                className="primary-button"
                disabled={alert.acknowledged}
                onClick={() => onAcknowledge(alert.id)}
              >
                <CheckCircle2 size={16} />
                {alert.acknowledged ? "Acknowledged" : "Acknowledge"}
              </button>
            </article>
          );
        })}

        {alerts.length === 0 ? (
          <div className="empty-state">No SOS alerts have been received.</div>
        ) : null}
      </div>
    </section>
  );
}
