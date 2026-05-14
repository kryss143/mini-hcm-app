import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { api } from "../api.js";

const ZONES = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Asia/Manila",
  "Asia/Tokyo",
];
export default function Setup() {
  const { user, token, profile, loading, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");
  const [adminSecret, setAdminSecret] = useState("");
  const [error, setError] = useState("");
  if (loading) return <div className="app-shell">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (profile) return <Navigate to="/" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const headers = {};
      if (adminSecret.trim())
        headers["x-admin-setup-secret"] = adminSecret.trim();
      await api("/api/users/profile", {
        method: "POST",
        token,
        headers,
        body: JSON.stringify({
          name,
          timezone,
          schedule: { start, end },
          role: adminSecret.trim() ? "admin" : "employee",
        }),
      });
      await refreshProfile();
    } catch (err) {
      setError(err.message || "Could not save profile");
    }
  }
  return (
    <div className="app-shell" style={{ maxWidth: 520 }}>
      <div className="card">
        <h2>Complete your profile</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: 0 }}>
          Schedule times are used for regular hours, overtime, lateness, and
          undertime. Night differential uses 22:00–06:00 in your timezone.
        </p>
        <form onSubmit={onSubmit} className="stack">
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="tz">Timezone</label>
            <select
              id="tz"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              {ZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="start">Shift start</label>
            <input
              id="start"
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="end">Shift end</label>
            <input
              id="end"
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="adm">Admin setup secret (optional)</label>
            <input
              id="adm"
              type="password"
              placeholder="Matches server ADMIN_SETUP_SECRET"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={!token}>
            Save and continue
          </button>
        </form>
      </div>
    </div>
  );
}
