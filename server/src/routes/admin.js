import { Router } from "express";
import { db } from "../firebase.js";
import { requireUser } from "../authMiddleware.js";
import { requireAdmin, listAllUsers } from "../adminMiddleware.js";
import { recalculateSummariesForUser } from "../recalcService.js";
import admin from "firebase-admin";

const r = Router();

r.use(requireUser, requireAdmin);

r.get("/attendance", async (req, res) => {
  try {
    const userId = req.query.userId || null;
    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const q = userId
      ? db
          .collection("attendance")
          .where("userId", "==", userId)
          .orderBy("timestamp", "desc")
          .limit(limit)
      : db.collection("attendance").orderBy("timestamp", "desc").limit(limit);
    const snap = await q.get();
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ attendance: rows });
  } catch (e) {
    res.status(500).json({ error: e.message || "Server error" });
  }
});

r.patch("/attendance/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const ref = db.collection("attendance").doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const patch = {};
    if (req.body.type === "in" || req.body.type === "out")
      patch.type = req.body.type;
    if (req.body.timestamp)
      patch.timestamp = admin.firestore.Timestamp.fromDate(
        new Date(req.body.timestamp),
      );
    if (Object.keys(patch).length === 0) {
      res.status(400).json({ error: "No valid fields" });
      return;
    }
    await ref.update(patch);
    await recalculateSummariesForUser(doc.data().userId);
    const updated = await ref.get();
    res.json({ attendance: { id: updated.id, ...updated.data() } });
  } catch (e) {
    res.status(500).json({ error: e.message || "Server error" });
  }
});

r.delete("/attendance/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const ref = db.collection("attendance").doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const userId = doc.data().userId;
    await ref.delete();
    await recalculateSummariesForUser(userId);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || "Server error" });
  }
});

r.get("/reports/daily", async (req, res) => {
  try {
    const dateKey = req.query.date;
    if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(String(dateKey))) {
      res.status(400).json({ error: "Query date=YYYY-MM-DD required" });
      return;
    }
    const snap = await db
      .collection("dailySummary")
      .where("dateKey", "==", dateKey)
      .get();
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ dateKey, summaries: rows });
  } catch (e) {
    res.status(500).json({ error: e.message || "Server error" });
  }
});

r.get("/reports/weekly", async (req, res) => {
  try {
    const weekStart = req.query.weekStart;
    if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(String(weekStart))) {
      res.status(400).json({ error: "Query weekStart=YYYY-MM-DD required" });
      return;
    }
    const { DateTime } = await import("luxon");
    const start = DateTime.fromISO(String(weekStart), { zone: "utc" });
    const keys = [];
    for (let i = 0; i < 7; i += 1) {
      keys.push(start.plus({ days: i }).toFormat("yyyy-MM-dd"));
    }
    const byUser = new Map();
    for (const dk of keys) {
      const snap = await db
        .collection("dailySummary")
        .where("dateKey", "==", dk)
        .get();
      snap.docs.forEach((d) => {
        const row = d.data();
        const uid = row.userId;
        if (!byUser.has(uid)) {
          byUser.set(uid, {
            userId: uid,
            days: [],
            totals: {
              regularHours: 0,
              overtimeHours: 0,
              nightDifferentialHours: 0,
              lateMinutes: 0,
              undertimeMinutes: 0,
              totalWorkedHours: 0,
            },
          });
        }
        const agg = byUser.get(uid);
        agg.days.push({ dateKey: dk, ...row });
        agg.totals.regularHours += Number(row.regularHours || 0);
        agg.totals.overtimeHours += Number(row.overtimeHours || 0);
        agg.totals.nightDifferentialHours += Number(
          row.nightDifferentialHours || 0,
        );
        agg.totals.lateMinutes += Number(row.lateMinutes || 0);
        agg.totals.undertimeMinutes += Number(row.undertimeMinutes || 0);
        agg.totals.totalWorkedHours += Number(row.totalWorkedHours || 0);
      });
    }
    res.json({ weekStart, dateKeys: keys, employees: [...byUser.values()] });
  } catch (e) {
    res.status(500).json({ error: e.message || "Server error" });
  }
});

r.get("/users", async (req, res) => {
  try {
    const users = await listAllUsers();
    res.json({ users });
  } catch (e) {
    res.status(500).json({ error: e.message || "Server error" });
  }
});
export default r;
