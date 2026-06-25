import { BellRing, Radio, ShieldAlert, Volume2, VolumeX } from "lucide-react";
import type { ConnectionState } from "@shared/types";

interface CommandHeaderProps {
  connectionState: ConnectionState;
  activeSosCount: number;
  soundEnabled: boolean;
  desktopNotificationsEnabled: boolean;
  appVersion?: string;
  onToggleSound: () => void;
  onEnableDesktopNotifications: () => void;
}

const connectionLabels: Record<ConnectionState, string> = {
  connecting: "Connecting",
  connected: "Live",
  degraded: "Demo / Degraded",
  offline: "Offline"
};

export function CommandHeader({
  connectionState,
  activeSosCount,
  soundEnabled,
  desktopNotificationsEnabled,
  appVersion,
  onToggleSound,
  onEnableDesktopNotifications
}: CommandHeaderProps) {
  return (
    <header className="command-header">
      <div>
        <p className="eyebrow">Windows Desktop Monitoring Console</p>
        <h1>Realtime Response Dashboard</h1>
      </div>

      <div className="header-actions">
        <div className={`connection-pill connection-${connectionState}`}>
          <Radio size={16} />
          {connectionLabels[connectionState]}
        </div>

        <div className="sos-pill" aria-live="polite">
          <ShieldAlert size={16} />
          {activeSosCount} Active SOS
        </div>

        <button className="icon-button" type="button" onClick={onToggleSound}>
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          {soundEnabled ? "Sound on" : "Sound off"}
        </button>

        <button
          className="icon-button"
          type="button"
          onClick={onEnableDesktopNotifications}
          disabled={desktopNotificationsEnabled}
        >
          <BellRing size={18} />
          {desktopNotificationsEnabled ? "Desktop alerts on" : "Enable desktop alerts"}
        </button>

        {appVersion ? <span className="version">v{appVersion}</span> : null}
      </div>
    </header>
  );
}
