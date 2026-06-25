import { useEffect, useMemo, useState } from "react";
import type { IncidentStatus } from "@shared/types";
import { CommandHeader } from "@renderer/components/CommandHeader";
import { EvidenceViewerPanel } from "@renderer/components/EvidenceViewerPanel";
import { IncidentManagementPanel } from "@renderer/components/IncidentManagementPanel";
import { LiveMap } from "@renderer/components/LiveMap";
import { ReportingDashboard } from "@renderer/components/ReportingDashboard";
import { SosAlertsPanel } from "@renderer/components/SosAlertsPanel";
import { TrackingHistoryPanel } from "@renderer/components/TrackingHistoryPanel";
import { UserSearchPanel } from "@renderer/components/UserSearchPanel";
import { useAlertNotifications } from "@renderer/hooks/useAlertNotifications";
import { useMonitoringData } from "@renderer/hooks/useMonitoringData";

export function App() {
  const { state, activeSosAlerts, latestAlert, dispatch } = useMonitoringData();
  const [selectedUserId, setSelectedUserId] = useState(state.users[0]?.id);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIncidentId, setSelectedIncidentId] = useState("all");
  const [appVersion, setAppVersion] = useState<string>();

  const {
    soundEnabled,
    setSoundEnabled,
    desktopNotificationsEnabled,
    requestDesktopNotifications
  } = useAlertNotifications(latestAlert);

  useEffect(() => {
    void window.monitoringConsole?.getAppVersion().then(setAppVersion);
  }, []);

  useEffect(() => {
    if (!selectedUserId && state.users.length > 0) {
      setSelectedUserId(state.users[0].id);
    }
  }, [selectedUserId, state.users]);

  const selectedUser = useMemo(
    () => state.users.find((user) => user.id === selectedUserId),
    [selectedUserId, state.users]
  );

  function acknowledgeAlert(alertId: string) {
    dispatch({
      type: "sos:acknowledge",
      payload: {
        alertId,
        acknowledgedBy: "Console Operator"
      }
    });
  }

  function updateIncidentStatus(incidentId: string, status: IncidentStatus) {
    dispatch({
      type: "incident:update-status",
      payload: {
        incidentId,
        status
      }
    });
  }

  return (
    <main className="app-shell">
      <CommandHeader
        connectionState={state.connectionState}
        activeSosCount={activeSosAlerts.length}
        soundEnabled={soundEnabled}
        desktopNotificationsEnabled={desktopNotificationsEnabled}
        appVersion={appVersion}
        onToggleSound={() => setSoundEnabled((enabled) => !enabled)}
        onEnableDesktopNotifications={requestDesktopNotifications}
      />

      <section className="dashboard-grid">
        <div className="left-column">
          <UserSearchPanel
            users={state.users}
            selectedUserId={selectedUserId}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onSelectUser={setSelectedUserId}
          />
          <SosAlertsPanel
            alerts={state.sosAlerts}
            users={state.users}
            incidents={state.incidents}
            onAcknowledge={acknowledgeAlert}
            onSelectUser={setSelectedUserId}
          />
        </div>

        <div className="center-column">
          <LiveMap
            users={state.users}
            trackingHistory={state.trackingHistory}
            selectedUserId={selectedUserId}
            onSelectUser={setSelectedUserId}
          />
          <ReportingDashboard
            metrics={state.reportMetrics}
            users={state.users}
            incidents={state.incidents}
            alerts={state.sosAlerts}
          />
        </div>

        <div className="right-column">
          <IncidentManagementPanel
            incidents={state.incidents}
            users={state.users}
            onUpdateStatus={updateIncidentStatus}
          />
          <EvidenceViewerPanel
            evidence={state.evidence}
            incidents={state.incidents}
            selectedIncidentId={selectedIncidentId}
            onSelectedIncidentChange={setSelectedIncidentId}
          />
          <TrackingHistoryPanel
            selectedUser={selectedUser}
            trackingHistory={state.trackingHistory}
          />
        </div>
      </section>
    </main>
  );
}
