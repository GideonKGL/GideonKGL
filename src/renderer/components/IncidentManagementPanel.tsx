import { ClipboardList, Users } from "lucide-react";
import type { Incident, IncidentStatus, MonitoredUser } from "@shared/types";
import { formatDateTime } from "@renderer/utils/format";

interface IncidentManagementPanelProps {
  incidents: Incident[];
  users: MonitoredUser[];
  onUpdateStatus: (incidentId: string, status: IncidentStatus) => void;
}

const statuses: IncidentStatus[] = ["new", "triaged", "responding", "resolved"];

export function IncidentManagementPanel({
  incidents,
  users,
  onUpdateStatus
}: IncidentManagementPanelProps) {
  return (
    <section className="panel incident-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Incident Management</p>
          <h2>Open Response Work</h2>
        </div>
        <ClipboardList size={22} />
      </div>

      <div className="incident-list">
        {incidents.map((incident) => {
          const linkedUsers = users.filter((user) => incident.userIds.includes(user.id));

          return (
            <article className="incident-card" key={incident.id}>
              <div className="incident-card-header">
                <span className={`risk-badge risk-${incident.priority}`}>{incident.priority}</span>
                <select
                  value={incident.status}
                  onChange={(event) =>
                    onUpdateStatus(incident.id, event.target.value as IncidentStatus)
                  }
                  aria-label={`Update status for ${incident.title}`}
                >
                  {statuses.map((status) => (
                    <option value={status} key={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <strong>{incident.title}</strong>
              <span className="incident-meta">
                {incident.type} · assigned to {incident.assignedTo} · updated {formatDateTime(incident.updatedAt)}
              </span>
              <div className="linked-users">
                <Users size={15} />
                {linkedUsers.map((user) => user.callSign).join(", ") || "No linked users"}
              </div>
              <ul>
                {incident.notes.slice(0, 2).map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
