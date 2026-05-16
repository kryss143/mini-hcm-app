import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.js";
import { useAuth } from "../AuthContext.jsx";

export default function Login() {
  const { user, profile, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const AUTH_ERRORS = {
    // Sign in
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Check your connection.",
    // Registration
    "auth/email-already-in-use": "This email is already registered.",
    "auth/weak-password": "Password must be at least 6 characters.",
    // Session / OAuth
    "auth/requires-recent-login": "Please sign in again to continue.",
    "auth/popup-closed-by-user": "Sign-in popup was closed before completing.",
    "auth/cancelled-popup-request": "Another sign-in popup is already open.",
  };

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      if (
        err.status === 502 ||
        err.message?.includes("502") ||
        err.message?.includes("Bad Gateway")
      ) {
        setError("Server is unreachable. Please try again later.");
        return;
      }
      setError(AUTH_ERRORS[err.code] || "Login failed. Please try again.");
    }
  }

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(t);
  }, [error]);

  if (loading) return <div className="app-shell">Loading…</div>;
  if (user && profile) return <Navigate to="/" replace />;
  if (user && profile === undefined)
    return <div className="app-shell">Loading…</div>;
  if (user && profile === null) return <Navigate to="/setup" replace />;
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full" style={{ maxWidth: 420 }}>
        <div className="mb-5 flex justify-center">
          <img
            src="icons/mini-hcm-login-logo.svg"
            alt="Mini HCM logo"
            aria-label="Mini HCM logo"
            className="h-50 w-auto"
          />
        </div>
        <h2 className="flex justify-center">Sign in</h2>
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
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary" type="submit">
            Sign in
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
          No account?{" "}
          <Link to="/register" className="mx-1">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
