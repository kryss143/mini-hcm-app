import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase.js";
import { api } from "./api.js";

const AuthCtx = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setToken(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setProfile(undefined);
      const t = await u.getIdToken();
      setToken(t);
      try {
        const me = await api("/api/users/me", { token: t });
        setProfile(me.user);
      } catch (e) {
        if (e.status === 404) setProfile(null);
        else setProfile(undefined);
      }
      setLoading(false);
    });
  }, []);
  const value = useMemo(
    () => ({
      user,
      token,
      profile,
      loading,
      refreshProfile: async () => {
        if (!user) return;
        const t = await user.getIdToken(true);
        setToken(t);
        try {
          const me = await api("/api/users/me", { token: t });
          setProfile(me.user);
        } catch (e) {
          if (e.status === 404) setProfile(null);
        }
      },
      logout: () => signOut(auth),
    }),
    [user, token, profile, loading],
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth outside provider");
  return v;
}
