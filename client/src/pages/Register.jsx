import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.js";
import { useAuth } from "../AuthContext.jsx";

export default function Register() {
  const { user, profile, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message || "Registration failed");
    }
  }
  if (loading) return <div className="app-shell">Loading…</div>;
  if (user && profile) return <Navigate to="/" replace />;
  if (user && profile === null) return <Navigate to="/setup" replace />;
  return (
    <div className="app-shell" style={{ maxWidth: 420 }}>
      <div className="card">
        <div className="mb-10 flex justify-center">
          <img
            src="icons/mini-hcm-login-logo.svg"
            alt="Mini HCM logo"
            aria-label="Mini HCM logo"
            className="h-50 w-auto"
          />
        </div>
        <h2 className="flex justify-center">Create account</h2>
        <form onSubmit={onSubmit} className="stack">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password (6+ chars)</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary" type="submit">
            Register
          </button>
        </form>
        <p
          style={{
            marginTop: "1rem",
            color: "var(--muted)",
            fontSize: "0.9rem",
          }}
          className="flex justify-center py-1"
        >
          Already have an account?{" "}
          <Link to="/login" className="mx-1">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
