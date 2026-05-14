import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Setup from "./pages/Setup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import History from "./pages/History.jsx";
import Admin from "./pages/Admin.jsx";

function Shell({ children }) {
  const { user, profile, logout } = useAuth();
  if (!user) return children;
  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="brand">Mini HCM</div>
        <nav className="nav-links">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/history">History</NavLink>
          {profile?.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
          <button type="button" onClick={() => logout()}>
            Sign out
          </button>
        </nav>
      </header>
      {children}
    </div>
  );
}

function Private({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="app-shell">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (profile === null) return <Navigate to="/setup" replace />;
  return <Shell>{children}</Shell>;
}

function AdminRoute({ children }) {
  const { profile, loading } = useAuth();
  if (loading) return <div className="app-shell">Loading…</div>;
  if (profile?.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/setup" element={<Setup />} />
        <Route
          path="/"
          element={
            <Private>
              <Dashboard />
            </Private>
          }
        />
        <Route
          path="/history"
          element={
            <Private>
              <History />
            </Private>
          }
        />
        <Route
          path="/admin"
          element={
            <Private>
              <AdminRoute>
                <Admin />
              </AdminRoute>
            </Private>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
