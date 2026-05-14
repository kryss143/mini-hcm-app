import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import { api } from "../api.js";

export default function History() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!token) return;
    api("/api/summary/history?limit=60", { token })
      .then((r) => setRows(r.summaries || []))
      .catch((e) => setError(e.message));
  }, [token]);

  return (
    <div className="card">
      <h2>Daily history</h2>
      {error && <p className="error">{error}</p>}
      <div style={{ overflowX: "auto" }}>
        <table className="data">
          <thead>
            <tr>
              <th>Date</th>
              <th>Regular</th>
              <th>OT</th>
              <th>ND</th>
              <th>Late (m)</th>
              <th>Undertime (m)</th>
              <th>Worked</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id || r.dateKey}>
                <td>{r.dateKey}</td>
                <td>{r.regularHours}</td>
                <td>{r.overtimeHours}</td>
                <td>{r.nightDifferentialHours}</td>
                <td>{r.lateMinutes}</td>
                <td>{r.undertimeMinutes}</td>
                <td>{r.totalWorkedHours}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ color: "var(--muted)" }}>
                  No summaries yet. Punch in and out to generate data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
