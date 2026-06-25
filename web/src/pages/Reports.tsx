import { useEffect, useState } from "react";
import { api } from "../api/client";

type Summary = {
  users: number;
  activeDevices: number;
  locations: number;
  openAlerts: number;
  resolvedAlerts: number;
};

export function Reports() {
  const [summary, setSummary] = useState<Summary>();

  useEffect(() => {
    api<Summary>("/reports/summary").then(setSummary).catch(console.error);
  }, []);

  return (
    <section>
      <h2>Reports</h2>
      <div className="card">
        <h3>Operational Summary</h3>
        <pre>{JSON.stringify(summary, null, 2)}</pre>
        <button onClick={() => window.print()}>Print Report</button>
      </div>
    </section>
  );
}
