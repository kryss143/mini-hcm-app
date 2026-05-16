import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.js";
import { useAuth } from "../AuthContext.jsx";
import { z } from "zod";

export default function Register() {
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

  const registerSchema = z.object({
    email: z
      .string()
      .trim()
      .min(1, "Email is required.")
      .email("Please enter a valid email address."),
    password: z
      .string()
      .min(1, "Password is required.")
      .min(6, "Password must be at least 6 characters."),
  });

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    const result = registerSchema.safeParse({ email, password });

    if (!result.success) {
      setError(result.error.issues[0]?.message || "Please check your input.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(
        auth,
        result.data.email,
        result.data.password,
      );
    } catch (err) {
      if (
        err.status === 502 ||
        err.message?.includes("502") ||
        err.message?.includes("Bad Gateway")
      ) {
        setError("Server is unreachable. Please try again later.");
        return;
      }

      setError(
        AUTH_ERRORS[err.code] || "Registration failed. Please try again.",
      );
    }
  }

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(t);
  }, [error]);

  if (loading) return <div className="app-shell">Loading…</div>;
  if (user && profile) return <Navigate to="/" replace />;
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
        <h2 className="flex justify-center">Create account</h2>
        <form onSubmit={onSubmit} className="stack" noValidate>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password (6+ chars)</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
