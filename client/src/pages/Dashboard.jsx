import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import { api } from "../api.js";

// Helper to get today's date in YYYY-MM-DD format
function getTodayKey() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Dashboard() {
  const { token, profile } = useAuth();
  const [dateKey, setDateKey] = useState(getTodayKey);
  const [summary, setSummary] = useState(null);
  const [punches, setPunches] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    const q =
      dateKey && /^\d{4}-\d{2}-\d{2}$/.test(dateKey)
        ? `?date=${encodeURIComponent(dateKey)}`
        : "";
    const [s, a] = await Promise.all([
      api(`/api/summary/daily${q}`, { token }),
      api("/api/attendance/mine", { token }),
    ]);
    setSummary(s.summary);
    setPunches(a.attendance || []);
  }, [token, dateKey]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  async function punch(type) {
    setBusy(true);
    setError("");
    try {
      await api("/api/attendance/punch", {
        method: "POST",
        token,
        body: JSON.stringify({ type }),
      });
      await load();
    } catch (e) {
      if (e.status === 401 || e.code === "auth/token-expired") {
        await logout();
        return;
      }
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load().catch((e) => {
      if (e.status === 401 || e.code === "auth/token-expired") {
        logout();
        return;
      }
      setError(e.message);
    });
  }, [load]);

  const s = summary || {};
  const last = punches[0];

  return (
    <div className="stack">
      <div className="card">
        <h2>Hello, {profile?.name}</h2>
        <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.9rem" }}>
          Schedule {profile?.schedule?.start}–{profile?.schedule?.end} (
          {profile?.timezone})
        </p>
        <div className="field" style={{ marginTop: "1rem", maxWidth: 220 }}>
          <label htmlFor="d">Summary date</label>
          <input
            id="d"
            type="date"
            value={dateKey}
            onChange={(e) => setDateKey(e.target.value)}
          />
        </div>
        <div className="row-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={() => punch("in")}
          >
            Punch in
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy}
            onClick={() => punch("out")}
          >
            Punch out
          </button>
        </div>
        {last && (
          <p
            style={{
              color: "var(--muted)",
              fontSize: "0.85rem",
              marginTop: "0.75rem",
            }}
          >
            Last punch: <span className="badge">{last.type}</span>{" "}
            {(() => {
              const ts = last.timestamp;
              const sec = ts?.seconds ?? ts?._seconds;
              if (sec) return new Date(sec * 1000).toLocaleString();
              return "";
            })()}
          </p>
        )}
        {error && <p className="error">{error}</p>}
      </div>

      <div className="card">
        <h2>Daily KPIs</h2>
        <div className="grid-kpi">
          <div className="kpi">
            <label>Regular</label>
            <strong>{s.regularHours ?? 0}h</strong>
          </div>
          <div className="kpi">
            <label>Overtime</label>
            <strong>{s.overtimeHours ?? 0}h</strong>
          </div>
          <div className="kpi">
            <label>Night diff.</label>
            <strong>{s.nightDifferentialHours ?? 0}h</strong>
          </div>
          <div className="kpi">
            <label>Late</label>
            <strong>{s.lateMinutes ?? 0}m</strong>
          </div>
          <div className="kpi">
            <label>Undertime</label>
            <strong>{s.undertimeMinutes ?? 0}m</strong>
          </div>
          <div className="kpi">
            <label>Total worked</label>
            <strong>{s.totalWorkedHours ?? 0}h</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
