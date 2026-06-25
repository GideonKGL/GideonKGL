import { BarChart3 } from "lucide-react";
import type { Incident, MonitoredUser, ReportMetric, SosAlert } from "@shared/types";
import { MetricCard } from "@renderer/components/MetricCard";

interface ReportingDashboardProps {
  metrics: ReportMetric[];
  users: MonitoredUser[];
  incidents: Incident[];
  alerts: SosAlert[];
}

export function ReportingDashboard({
  metrics,
  users,
  incidents,
  alerts
}: ReportingDashboardProps) {
  const activeUsers = users.filter((user) => user.status === "active" || user.status === "sos").length;
  const resolvedIncidents = incidents.filter((incident) => incident.status === "resolved").length;
  const acknowledgedAlerts = alerts.filter((alert) => alert.acknowledged).length;
  const totalAlerts = Math.max(alerts.length, 1);
  const acknowledgementRate = Math.round((acknowledgedAlerts / totalAlerts) * 100);

  return (
    <section className="panel reporting-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Reporting Dashboard</p>
          <h2>Operational Snapshot</h2>
        </div>
        <BarChart3 size={22} />
      </div>

      <div className="metric-grid">
        {metrics.map((metric) => (
          <MetricCard metric={metric} key={metric.label} />
        ))}
      </div>

      <div className="report-bars">
        <label>
          Active coverage
          <span>{activeUsers}/{users.length}</span>
          <progress value={activeUsers} max={Math.max(users.length, 1)} />
        </label>
        <label>
          Incident resolution
          <span>{resolvedIncidents}/{incidents.length}</span>
          <progress value={resolvedIncidents} max={Math.max(incidents.length, 1)} />
        </label>
        <label>
          SOS acknowledgement
          <span>{acknowledgementRate}%</span>
          <progress value={acknowledgementRate} max={100} />
        </label>
      </div>
    </section>
  );
}
