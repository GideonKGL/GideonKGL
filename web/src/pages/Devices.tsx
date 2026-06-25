import { useEffect, useState } from "react";
import { api } from "../api/client";

type Device = {
  id: string;
  name: string;
  platform: string;
  deviceUid: string;
  isActive: boolean;
  lastSeenAt?: string;
  user?: { email: string; firstName: string; lastName: string };
};

export function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    api<Device[]>("/devices").then(setDevices).catch(console.error);
  }, []);

  return (
    <section>
      <h2>Device Management</h2>
      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Owner</th>
              <th>Platform</th>
              <th>UID</th>
              <th>Last Seen</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.id}>
                <td>{device.name}</td>
                <td>{device.user ? `${device.user.firstName} ${device.user.lastName}` : "-"}</td>
                <td>{device.platform}</td>
                <td>{device.deviceUid}</td>
                <td>{device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : "-"}</td>
                <td>{device.isActive ? "Active" : "Inactive"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
