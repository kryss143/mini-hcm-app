import { Router } from "express";
import { db } from "../firebase.js";
import { requireUser } from "../authMiddleware.js";

const r = Router();
r.post("/profile", requireUser, async (req, res) => {
  try {
    const { name, timezone, schedule, role } = req.body || {};
    if (!name || !timezone || !schedule?.start || !schedule?.end) {
      res
        .status(400)
        .json({
          error: "name, timezone, schedule.start, schedule.end required",
        });
      return;
    }
    let finalRole = "employee";
    if (
      role === "admin" &&
      req.headers["x-admin-setup-secret"] === process.env.ADMIN_SETUP_SECRET &&
      process.env.ADMIN_SETUP_SECRET
    ) {
      finalRole = "admin";
    }
    const email = req.email || "";
    const ref = db.collection("users").doc(req.uid);
    await ref.set(
      {
        name: String(name),
        email,
        role: finalRole,
        timezone: String(timezone),
        schedule: { start: String(schedule.start), end: String(schedule.end) },
        updatedAt: new Date(),
      },
      { merge: true },
    );
    const snap = await ref.get();
    res.json({ user: { id: snap.id, ...snap.data() } });
  } catch (e) {
    res.status(500).json({ error: e.message || "Server error" });
  }
});

r.get("/me", requireUser, async (req, res) => {
  try {
    const snap = await db.collection("users").doc(req.uid).get();
    if (!snap.exists) {
      res
        .status(404)
        .json({ error: "Profile not found. Complete registration." });
      return;
    }
    res.json({ user: { id: snap.id, ...snap.data() } });
  } catch (e) {
    res.status(500).json({ error: e.message || "Server error" });
  }
});
export default r;
