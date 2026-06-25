import { Route } from "lucide-react";
import type { MonitoredUser, TrackingPoint } from "@shared/types";
import { formatCoordinate, formatDateTime } from "@renderer/utils/format";

interface TrackingHistoryPanelProps {
  selectedUser?: MonitoredUser;
  trackingHistory: TrackingPoint[];
}

export function TrackingHistoryPanel({
  selectedUser,
  trackingHistory
}: TrackingHistoryPanelProps) {
  const visibleHistory = selectedUser
    ? trackingHistory
        .filter((point) => point.userId === selectedUser.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)
    : [];

  return (
    <section className="panel history-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Tracking History</p>
          <h2>{selectedUser ? selectedUser.callSign : "No user selected"}</h2>
        </div>
        <Route size={22} />
      </div>

      <div className="history-table" role="table" aria-label="Tracking history">
        <div className="history-row history-head" role="row">
          <span role="columnheader">Time</span>
          <span role="columnheader">Latitude</span>
          <span role="columnheader">Longitude</span>
          <span role="columnheader">Speed</span>
        </div>
        {visibleHistory.map((point) => (
          <div className="history-row" role="row" key={point.id}>
            <span role="cell">{formatDateTime(point.timestamp)}</span>
            <span role="cell">{formatCoordinate(point.latitude)}</span>
            <span role="cell">{formatCoordinate(point.longitude)}</span>
            <span role="cell">{point.speedKph} kph</span>
          </div>
        ))}
      </div>
    </section>
  );
}
