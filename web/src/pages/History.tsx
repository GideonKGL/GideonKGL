import { FormEvent, useState } from "react";
import { api } from "../api/client";

type Location = {
  id: string;
  latitude: string;
  longitude: string;
  accuracy?: string;
  recordedAt: string;
};

export function History() {
  const [deviceId, setDeviceId] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLocations(await api<Location[]>(`/locations/history?deviceId=${encodeURIComponent(deviceId)}`));
  };

  return (
    <section>
      <h2>Tracking History</h2>
      <form className="card filters" onSubmit={submit}>
        <label>
          Device ID
          <input value={deviceId} onChange={(event) => setDeviceId(event.target.value)} required />
        </label>
        <button type="submit">Load History</button>
      </form>
      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Recorded</th>
              <th>Latitude</th>
              <th>Longitude</th>
              <th>Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((location) => (
              <tr key={location.id}>
                <td>{new Date(location.recordedAt).toLocaleString()}</td>
                <td>{location.latitude}</td>
                <td>{location.longitude}</td>
                <td>{location.accuracy ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
