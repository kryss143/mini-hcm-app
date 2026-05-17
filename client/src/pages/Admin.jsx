import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../AuthContext.jsx";
import { api } from "../api.js";
import Pagination from "../components/Pagination.jsx";
import usePagination from "../hooks/usePagination.js";

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

function toMs(ts) {
  if (!ts) return 0;
  const sec = ts.seconds ?? ts._seconds;
  return sec ? sec * 1000 : new Date(ts).getTime();
}

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col)
    return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>;
  return <span style={{ marginLeft: 4 }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
}

const selectCls =
  "bg-slate-800 text-white border border-gray-600 rounded px-2 py-1 text-sm";
const thStyle = { cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" };

function handleApiError(e, logout, setError) {
  if (e.status === 401 || e.code === "auth/token-expired") {
    logout();
    return;
  }
  if (e.code === "network/bad-gateway") {
    setError("Server is unreachable. Please try again later.");
    return;
  }
  setError(e.message);
}

function useSortFilter(rows, fields, userMap, roleMap) {
  const [sortCol, setSortCol] = useState(fields[0].key);
  const [sortDir, setSortDir] = useState("asc");
  const [filterRole, setFilterRole] = useState("all");
  const [filterUser, setFilterUser] = useState("");

  function toggleSort(col) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    return [...rows]
      .filter((row) => {
        if (filterRole !== "all" && roleMap[row.userId] !== filterRole) {
          return false;
        }

        const userSearch = filterUser.trim().toLowerCase();
        if (!userSearch) return true;

        const userText =
          `${userMap[row.userId] || ""} ${row.userId}`.toLowerCase();
        return userText.includes(userSearch);
      })
      .sort((a, b) => {
        const field = fields.find((f) => f.key === sortCol);
        const valA = field?.getValue(a, userMap, roleMap) ?? "";
        const valB = field?.getValue(b, userMap, roleMap) ?? "";

        if (valA < valB) return sortDir === "asc" ? -1 : 1;
        if (valA > valB) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
  }, [rows, sortCol, sortDir, filterRole, filterUser, userMap, roleMap]);

  return {
    sorted,
    sortCol,
    sortDir,
    toggleSort,
    filterRole,
    setFilterRole,
    filterUser,
    setFilterUser,
  };
}

export default function Admin() {
  const { token, logout } = useAuth();
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

  const userMap = Object.fromEntries(
    users.map((u) => [u.id, u.name || u.email || u.id]),
  );
  const roleMap = Object.fromEntries(users.map((u) => [u.id, u.role || ""]));
  const displayName = (uid) => userMap[uid] ?? uid;

  const roleOptions = useMemo(
    () => [...new Set(users.map((u) => u.role).filter(Boolean))].sort(),
    [users],
  );

  // ── Punches sort/filter ──────────────────────────────────────────
  const punchFields = [
    {
      key: "user",
      label: "User",
      getValue: (r, um) => (um[r.userId] || r.userId).toLowerCase(),
    },
    {
      key: "role",
      label: "Role",
      getValue: (r, _, rm) => (rm[r.userId] || "").toLowerCase(),
    },
    { key: "type", label: "Type", getValue: (r) => r.type },
    {
      key: "date",
      label: "Timestamp (edit)",
      getValue: (r) => toMs(r.timestamp),
    },
  ];
  const punch = useSortFilter(attendance, punchFields, userMap, roleMap);
  const punchPagination = usePagination(punch.sorted, 5); // ← pagination

  // ── Daily sort/filter ────────────────────────────────────────────
  const dailyFields = [
    {
      key: "user",
      label: "User",
      getValue: (r, um) => (um[r.userId] || r.userId).toLowerCase(),
    },
    {
      key: "role",
      label: "Role",
      getValue: (r, _, rm) => (rm[r.userId] || "").toLowerCase(),
    },
    {
      key: "regular",
      label: "Regular",
      getValue: (r) => Number(r.regularHours) || 0,
    },
    { key: "ot", label: "OT", getValue: (r) => Number(r.overtimeHours) || 0 },
    {
      key: "nd",
      label: "ND",
      getValue: (r) => Number(r.nightDifferentialHours) || 0,
    },
    { key: "late", label: "Late", getValue: (r) => Number(r.lateMinutes) || 0 },
    {
      key: "undertime",
      label: "Undertime",
      getValue: (r) => Number(r.undertimeMinutes) || 0,
    },
  ];
  const daily = useSortFilter(dailyRows, dailyFields, userMap, roleMap);
  const dailyPagination = usePagination(daily.sorted, 5); // ← pagination

  // ── Weekly sort/filter ───────────────────────────────────────────
  const weeklyFields = [
    {
      key: "user",
      label: "User",
      getValue: (r, um) => (um[r.userId] || r.userId).toLowerCase(),
    },
    {
      key: "role",
      label: "Role",
      getValue: (r, _, rm) => (rm[r.userId] || "").toLowerCase(),
    },
    {
      key: "regular",
      label: "Regular",
      getValue: (r) => Number(r.totals?.regularHours) || 0,
    },
    {
      key: "ot",
      label: "OT",
      getValue: (r) => Number(r.totals?.overtimeHours) || 0,
    },
    {
      key: "nd",
      label: "ND",
      getValue: (r) => Number(r.totals?.nightDifferentialHours) || 0,
    },
    {
      key: "late",
      label: "Late (m)",
      getValue: (r) => Number(r.totals?.lateMinutes) || 0,
    },
    {
      key: "undertime",
      label: "Undertime (m)",
      getValue: (r) => Number(r.totals?.undertimeMinutes) || 0,
    },
  ];
  const weeklyEmployees = weekly?.employees ?? [];
  const weeklySort = useSortFilter(
    weeklyEmployees,
    weeklyFields,
    userMap,
    roleMap,
  );
  const weeklyPagination = usePagination(weeklySort.sorted, 5); // ← pagination

  async function reloadPunches() {
    const r = await api("/api/admin/attendance?limit=300", { token });
    setAttendance(r.attendance || []);
  }

  useEffect(() => {
    if (!token) return;
    api("/api/admin/users", { token })
      .then((r) => setUsers(r.users || []))
      .catch((e) => handleApiError(e, logout, setError));
    reloadPunches().catch((e) => handleApiError(e, logout, setError));
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
      handleApiError(e, logout, setError);
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
      handleApiError(e, logout, setError);
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
      handleApiError(e, logout, setError);
    }
  }

  async function delRow(id) {
    if (!confirm("Delete this punch?")) return;
    setError("");
    try {
      await api(`/api/admin/attendance/${id}`, { method: "DELETE", token });
      await reloadPunches();
    } catch (e) {
      handleApiError(e, logout, setError);
    }
  }

  function FilterBar({ hook, onClear }) {
    return (
      <div
        className="row-actions"
        style={{ flexWrap: "wrap", marginBottom: "0.75rem" }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: "1rem",
            color: "var(--muted)",
          }}
        >
          Role
          <select
            className={selectCls}
            value={hook.filterRole}
            onChange={(e) => {
              hook.setFilterRole(e.target.value);
              hook.setFilterUser("");
            }}
          >
            <option value="all">All</option>
            {roleOptions.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: "1rem",
            color: "var(--muted)",
          }}
        >
          User
          <input
            className={selectCls}
            type="text"
            value={hook.filterUser}
            placeholder="Search user"
            onChange={(e) => hook.setFilterUser(e.target.value)}
          />
        </label>

        {(hook.filterRole !== "all" || hook.filterUser.trim()) && (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ fontSize: "0.8rem" }}
            onClick={onClear}
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  const rolePill = (uid) => (
    <span
      style={{
        fontSize: "0.78rem",
        padding: "2px 8px",
        borderRadius: "999px",
        background:
          roleMap[uid] === "admin"
            ? "rgba(99,102,241,0.2)"
            : "rgba(34,197,94,0.15)",
        color: roleMap[uid] === "admin" ? "#a5b4fc" : "#86efac",
      }}
    >
      {roleMap[uid] || "—"}
    </span>
  );

  return (
    <div className="stack">
      <div className="card">
        <h2>Admin</h2>
        <div className="row-actions" style={{ marginTop: 0 }}>
          {["punches", "daily", "weekly"].map((t) => (
            <button
              key={t}
              type="button"
              className={`btn ${tab === t ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setTab(t)}
            >
              {t === "punches"
                ? "Punches"
                : t === "daily"
                  ? "Daily report"
                  : "Weekly report"}
            </button>
          ))}
        </div>
        {error && <p className="error">{error}</p>}
      </div>

      {/* ── PUNCHES ── */}
      {tab === "punches" && (
        <div className="card">
          <div
            className="row-actions"
            style={{ marginBottom: "0.75rem", flexWrap: "wrap" }}
          >
            <h2 style={{ margin: 0, flex: 1 }}>All punches</h2>
            <span
              style={{
                color: "var(--muted)",
                fontSize: "0.85rem",
                alignSelf: "center",
              }}
            >
              <p className="text-lg">
                {punch.sorted.length} record
                {punch.sorted.length !== 1 ? "s" : ""}
              </p>
            </span>
          </div>
          <FilterBar
            hook={punch}
            onClear={() => {
              punch.setFilterRole("all");
              punch.setFilterUser("");
            }}
          />
          <div style={{ overflowX: "auto" }}>
            <table className="data">
              <thead>
                <tr>
                  {punchFields.map((f) => (
                    <th
                      key={f.key}
                      style={thStyle}
                      onClick={() => punch.toggleSort(f.key)}
                    >
                      {f.label}{" "}
                      <SortIcon
                        col={f.key}
                        sortCol={punch.sortCol}
                        sortDir={punch.sortDir}
                      />
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {punchPagination.paged.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: "center",
                        color: "var(--muted)",
                        padding: "1.5rem",
                      }}
                    >
                      No punches match the selected filters.
                    </td>
                  </tr>
                )}
                {punchPagination.paged.map(
                  (
                    row, // ← use paged instead of sorted
                  ) => (
                    <tr key={row.id}>
                      <td>
                        <span>{displayName(row.userId)}</span>
                        <span
                          style={{
                            display: "block",
                            fontSize: "0.72rem",
                            color: "var(--muted)",
                            marginTop: 2,
                          }}
                        >
                          {row.userId}
                        </span>
                      </td>
                      <td>{rolePill(row.userId)}</td>
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
                            (row.editTs = new Date(
                              e.target.value,
                            ).toISOString())
                          }
                        />
                      </td>
                      <td className="space-x-3 space-y-3">
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
                  ),
                )}
              </tbody>
            </table>
          </div>
          {/* ← Pagination */}
          <Pagination
            page={punchPagination.page}
            totalPages={punchPagination.totalPages}
            onPageChange={punchPagination.setPage}
          />
          <p
            style={{ color: "var(--muted)", fontSize: "0.85rem" }}
            className="mt-2"
          >
            Employee/s:{" "}
            {users
              .filter((u) => u.role === "employee")
              .map((u) => u.name || u.id)
              .join(", ")}
          </p>
          <p
            style={{ color: "var(--muted)", fontSize: "0.85rem" }}
            className="mt-2"
          >
            Admin/s:{" "}
            {users
              .filter((u) => u.role === "admin")
              .map((u) => u.name || u.id)
              .join(", ")}
          </p>
        </div>
      )}

      {/* ── DAILY ── */}
      {tab === "daily" && (
        <div className="card">
          <h2>Daily report (all employees)</h2>
          <div className="row-actions" style={{ marginBottom: "0.5rem" }}>
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
          <FilterBar
            hook={daily}
            onClear={() => {
              daily.setFilterRole("all");
              daily.setFilterUser("");
            }}
          />
          <table className="data">
            <thead>
              <tr>
                {dailyFields.map((f) => (
                  <th
                    key={f.key}
                    style={thStyle}
                    onClick={() => daily.toggleSort(f.key)}
                  >
                    {f.label}{" "}
                    <SortIcon
                      col={f.key}
                      sortCol={daily.sortCol}
                      sortDir={daily.sortDir}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dailyPagination.paged.length === 0 && (
                <tr>
                  <td
                    colSpan={dailyFields.length}
                    style={{
                      textAlign: "center",
                      color: "var(--muted)",
                      padding: "1.5rem",
                    }}
                  >
                    No data for this day.
                  </td>
                </tr>
              )}
              {dailyPagination.paged.map(
                (
                  r, // ← use paged instead of sorted
                ) => (
                  <tr key={r.id}>
                    <td>{displayName(r.userId)}</td>
                    <td>{rolePill(r.userId)}</td>
                    <td>{r.regularHours}</td>
                    <td>{r.overtimeHours}</td>
                    <td>{r.nightDifferentialHours}</td>
                    <td>{r.lateMinutes}</td>
                    <td>{r.undertimeMinutes}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
          {/* ← Pagination */}
          <Pagination
            page={dailyPagination.page}
            totalPages={dailyPagination.totalPages}
            onPageChange={dailyPagination.setPage}
          />
        </div>
      )}

      {/* ── WEEKLY ── */}
      {tab === "weekly" && (
        <div className="card">
          <h2>Weekly report</h2>
          <div className="row-actions" style={{ marginBottom: "0.5rem" }}>
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
            <>
              <FilterBar
                hook={weeklySort}
                onClear={() => {
                  weeklySort.setFilterRole("all");
                  weeklySort.setFilterUser("");
                }}
              />
              <div className="stack">
                {weeklyPagination.paged.length === 0 && (
                  <p style={{ color: "var(--muted)" }}>
                    No data matches the selected filters.
                  </p>
                )}
                {weeklyPagination.paged.map(
                  (
                    emp, // ← use paged instead of sorted
                  ) => (
                    <div
                      key={emp.userId}
                      className="card"
                      style={{ background: "rgba(0,0,0,0.2)" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <strong>{displayName(emp.userId)}</strong>
                        {rolePill(emp.userId)}
                      </div>
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
                            {Number(
                              emp.totals.nightDifferentialHours || 0,
                            ).toFixed(2)}
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
                  ),
                )}
              </div>
              {/* ← Pagination */}
              <Pagination
                page={weeklyPagination.page}
                totalPages={weeklyPagination.totalPages}
                onPageChange={weeklyPagination.setPage}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
