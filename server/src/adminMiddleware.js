import { db } from "./firebase.js";
import { loadUser } from "./recalcService.js";

export async function requireAdmin(req, res, next) {
  try {
    const user = await loadUser(req.uid);
    if (!user || user.role !== "admin") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    req.profile = user;
    next();
  } catch (e) {
    res.status(500).json({ error: e.message || "Server error" });
  }
}

export async function listAllUsers() {
  const snap = await db.collection("users").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
