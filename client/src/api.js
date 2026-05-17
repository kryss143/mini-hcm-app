import { auth } from "./firebase.js";
import { signOut } from "firebase/auth";

const devBase = import.meta.env.VITE_API_BASE || "";
const prodBase = import.meta.env.VITE_API_PROD_BASE || "";

const base = import.meta.env.PROD ? prodBase : devBase;

const AUTH_ERROR_CODES = [
  "auth/token-expired",
  "auth/invalid-token",
  "auth/user-token-expired",
  "auth/user-not-found",
  "auth/invalid-user-token",
  "auth/requires-recent-login",
];

async function handleAuthRedirect() {
  try {
    await signOut(auth);
  } catch {
    // silently fail if signOut errors
  }
  window.location.href = "/login";
}

export async function api(path, options = {}) {
  const { token, ...rest } = options;
  const headers = {
    "Content-Type": "application/json",
    ...(rest.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, { ...rest, headers });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text };
  }
  if (!res.ok) {
    const err = new Error(data.error || res.statusText);
    err.status = res.status;
    err.data = data;

    if (res.status === 401) {
      err.code = "auth/token-expired";
      await handleAuthRedirect(); // ← auto redirect on 401
      return;
    }

    if (res.status === 502 || err.message?.includes("Bad Gateway"))
      err.code = "network/bad-gateway";

    // catch any firebase auth error codes from response body
    if (data?.code && AUTH_ERROR_CODES.includes(data.code)) {
      await handleAuthRedirect(); // ← auto redirect on Firebase auth errors
      return;
    }

    throw err;
  }
  return data;
}
