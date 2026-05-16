import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { AuthProvider, useAuth } from "./AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Setup from "./pages/Setup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import History from "./pages/History.jsx";
import Admin from "./pages/Admin.jsx";

function Shell({ children }) {
  const { user, profile, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onClickOutside);
    };
  }, []);

  if (!user) return children;
  return (
    <div className="app-shell">
      <header className="border border-gray-600 text-white px-4 py-3 rounded-2xl flex items-center justify-between mb-5 font-semibold text-xl bg-linear-to-br from-[#ffffff0f] to-[#ffffff05] backdrop-blur-3xl">
        <div className="brand">
          <img
            src="icons/mini-hcm-navbar-logo.svg"
            alt="Mini HCM Navbar Logo"
            className="h-12 w-auto"
          />
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center space-x-3">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3 py-1 rounded ${isActive ? "bg-slate-700" : "hover:bg-slate-700"}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `px-3 py-1 rounded ${isActive ? "bg-slate-700" : "hover:bg-slate-700"}`
            }
          >
            History
          </NavLink>
          {profile?.role === "admin" && (
            <NavLink
              to="/admin"
              className="px-3 py-1 rounded hover:bg-slate-700"
            >
              Admin
            </NavLink>
          )}
          <button
            onClick={logout}
            className="px-3 py-1 rounded hover:bg-slate-700"
          >
            Sign out
          </button>
        </nav>

        {/* Mobile hamburger */}
        <div className="md:hidden relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="p-2.5 rounded hover:bg-slate-700"
          >
            <span
              className={`block w-6 h-0.5 bg-white mb-1.5 transition-transform ${open ? "translate-y-1.5 rotate-45" : ""}`}
            />
            <span
              className={`block w-6 h-0.5 bg-white mb-1.5 transition-opacity ${open ? "opacity-0" : "opacity-100"}`}
            />
            <span
              className={`block w-6 h-0.5 bg-white transition-transform ${open ? "-translate-y-1.5 -rotate-45" : ""}`}
            />
          </button>

          <div
            className={`z-50 origin-top-right absolute right-0 mt-2 w-44 overflow-hidden rounded shadow-lg ring-1 ring-black/5 border border-gray-600 transform transition-all duration-150 font-semibold text-xl bg-linear-to-br from-[#03043dd0] to-[#02000ad3] backdrop-blur-3xl
    ${open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
          >
            <NavLink
              to="/"
              end
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-1 py-3 ${isActive ? "bg-slate-700" : "hover:bg-slate-700"}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/history"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-1 py-3 ${isActive ? "bg-slate-700" : "hover:bg-slate-700"}`
              }
            >
              History
            </NavLink>
            {profile?.role === "admin" && (
              <NavLink
                to="/admin"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block px-1 py-3 ${isActive ? "bg-slate-700" : "hover:bg-slate-700"}`
                }
              >
                Admin
              </NavLink>
            )}
            <button
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="w-full text-left px-1 py-3 hover:bg-slate-700"
            >
              Sign out
            </button>
          </div>
        </div>
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
