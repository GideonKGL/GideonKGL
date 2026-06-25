import { BatteryCharging, LocateFixed, Search } from "lucide-react";
import type { MonitoredUser } from "@shared/types";
import { formatCoordinate, formatTime } from "@renderer/utils/format";

interface UserSearchPanelProps {
  users: MonitoredUser[];
  selectedUserId?: string;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSelectUser: (userId: string) => void;
}

export function UserSearchPanel({
  users,
  selectedUserId,
  searchTerm,
  onSearchTermChange,
  onSelectUser
}: UserSearchPanelProps) {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    const searchable = `${user.name} ${user.callSign} ${user.team} ${user.phone}`.toLowerCase();
    return searchable.includes(normalizedSearch);
  });

  return (
    <section className="panel roster-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">User Search</p>
          <h2>Tracked Personnel</h2>
        </div>
        <span>{filteredUsers.length}/{users.length}</span>
      </div>

      <label className="search-field">
        <Search size={18} />
        <input
          type="search"
          placeholder="Search name, team, call sign, phone..."
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
        />
      </label>

      <div className="user-list">
        {filteredUsers.map((user) => (
          <button
            type="button"
            className={`user-card ${selectedUserId === user.id ? "selected" : ""}`}
            key={user.id}
            onClick={() => onSelectUser(user.id)}
          >
            <span className={`status-dot status-${user.status}`} />
            <div className="user-card-main">
              <strong>{user.name}</strong>
              <span>{user.callSign} · {user.team}</span>
              <small>Last check-in {formatTime(user.lastCheckIn)}</small>
            </div>
            <div className="user-card-meta">
              <span className={`risk-badge risk-${user.riskLevel}`}>{user.riskLevel}</span>
              <span>
                <BatteryCharging size={14} />
                {user.location.batteryPercent}%
              </span>
              <span>
                <LocateFixed size={14} />
                {formatCoordinate(user.location.latitude)}, {formatCoordinate(user.location.longitude)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
