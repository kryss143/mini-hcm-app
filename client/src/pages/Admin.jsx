import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import { api } from "../api.js";

function fmt(ts) {
  if (!ts) return "";
  const sec = ts.seconds ?? ts._seconds;
  if (sec) return new Date(sec * 1000).toISOString().slice(0, 16);
  return new Date(ts).toISOString().slice(0, 16);
}

function toIso(ts) {
  const sec = ts?.seconds ?? ts?._seconds;
  if (sec) return new Date(sec * 1000).toISOString();
  return new Date(ts).toISOString();
}

export default function Admin() {
  const { token } = useAuth();
  const [tab, setTab] = useState("punches");
  const [attendance, setAttendance] = useState([]);
  const [users, setUsers] = useState([]);
  const [dailyDate, setDailyDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [weekStart, setWeekStart] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [dailyRows, setDailyRows] = useState([]);
  const [weekly, setWeekly] = useState(null);
  const [error, setError] = useState("");
  async function reloadPunches() {
    const r = await api("/api/admin/attendance?limit=300", { token });
    setAttendance(r.attendance || []);
  }

  useEffect(() => {
    if (!token) return;
    api("/api/admin/users", { token })
      .then((r) => setUsers(r.users || []))
      .catch((e) => setError(e.message));
    reloadPunches().catch((e) => setError(e.message));
  }, [token]);

  async function loadDaily() {
    setError("");
    try {
      const r = await api(
        `/api/admin/reports/daily?date=${encodeURIComponent(dailyDate)}`,
        { token },
      );
      setDailyRows(r.summaries || []);
    } catch (e) {
      setError(e.message);
    }
  }

  async function loadWeekly() {
    setError("");
    try {
      const r = await api(
        `/api/admin/reports/weekly?weekStart=${encodeURIComponent(weekStart)}`,
        { token },
      );
      setWeekly(r);
    } catch (e) {
      setError(e.message);
    }
  }

  async function saveRow(row) {
    setError("");
    try {
      const tsIso = row.editTs || toIso(row.timestamp);
      await api(`/api/admin/attendance/${row.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ type: row.type, timestamp: tsIso }),
      });
      await reloadPunches();
    } catch (e) {
      setError(e.message);
    }
  }

  async function delRow(id) {
    if (!confirm("Delete this punch?")) return;
    setError("");
    try {
      await api(`/api/admin/attendance/${id}`, { method: "DELETE", token });
      await reloadPunches();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="stack">
      <div className="card">
        <h2>Admin</h2>
        <div className="row-actions" style={{ marginTop: 0 }}>
          <button
            type="button"
            className={`btn ${tab === "punches" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setTab("punches")}
          >
            Punches
          </button>
          <button
            type="button"
            className={`btn ${tab === "daily" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setTab("daily")}
          >
            Daily report
          </button>
          <button
            type="button"
            className={`btn ${tab === "weekly" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setTab("weekly")}
          >
            Weekly report
          </button>
        </div>

        {error && <p className="error">{error}</p>}
      </div>
      {tab === "punches" && (
        <div className="card">
          <h2>All punches</h2>
          <div style={{ overflowX: "auto" }}>
            <table className="data">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Type</th>
                  <th>Timestamp (edit)</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {attendance.map((row) => (
                  <tr key={row.id}>
                    <td>{row.userId}</td>
                    <td>
                      <select
                        defaultValue={row.type}
                        onChange={(e) => (row.type = e.target.value)}
                      >
                        <option value="in">in</option>
                        <option value="out">out</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="datetime-local"
                        defaultValue={fmt(row.timestamp)}
                        onChange={(e) =>
                          (row.editTs = new Date(e.target.value).toISOString())
                        }
                      />
                    </td>
                    <td className="space-x-2">
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => saveRow(row)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => delRow(row.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
            Users: {users.map((u) => u.name || u.id).join(", ")}
          </p>
        </div>
      )}
      {tab === "daily" && (
        <div className="card">
          <h2>Daily report (all employees)</h2>
          <div className="row-actions">
            <input
              type="date"
              value={dailyDate}
              onChange={(e) => setDailyDate(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={loadDaily}
            >
              Load
            </button>
          </div>
          <table className="data">
            <thead>
              <tr>
                <th>User</th>
                <th>Regular</th>
                <th>OT</th>
                <th>ND</th>
                <th>Late</th>
                <th>Undertime</th>
              </tr>
            </thead>
            <tbody>
              {dailyRows.map((r) => (
                <tr key={r.id}>
                  <td>{r.userId}</td>
                  <td>{r.regularHours}</td>
                  <td>{r.overtimeHours}</td>
                  <td>{r.nightDifferentialHours}</td>
                  <td>{r.lateMinutes}</td>
                  <td>{r.undertimeMinutes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "weekly" && (
        <div className="card">
          <h2>Weekly report</h2>
          <div className="row-actions">
            <input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={loadWeekly}
            >
              Load
            </button>
          </div>
          {weekly && (
            <div className="stack">
              {weekly.employees.map((emp) => (
                <div
                  key={emp.userId}
                  className="card"
                  style={{ background: "rgba(0,0,0,0.2)" }}
                >
                  <strong>{emp.userId}</strong>
                  <div className="grid-kpi">
                    <div className="kpi">
                      <label>Regular</label>
                      <strong>
                        {Number(emp.totals.regularHours || 0).toFixed(2)}h
                      </strong>
                    </div>
                    <div className="kpi">
                      <label>OT</label>
                      <strong>
                        {Number(emp.totals.overtimeHours || 0).toFixed(2)}h
                      </strong>
                    </div>
                    <div className="kpi">
                      <label>ND</label>
                      <strong>
                        {Number(emp.totals.nightDifferentialHours || 0).toFixed(
                          2,
                        )}
                        h
                      </strong>
                    </div>
                    <div className="kpi">
                      <label>Late (m)</label>
                      <strong>{emp.totals.lateMinutes}</strong>
                    </div>
                    <div className="kpi">
                      <label>Undertime (m)</label>
                      <strong>{emp.totals.undertimeMinutes}</strong>
                    </div>
                  </div>
                </div>
              ))}
              {weekly.employees.length === 0 && (
                <p style={{ color: "var(--muted)" }}>No data for this week.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
