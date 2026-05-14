import { Router } from "express";
import { DateTime } from "luxon";
import { db } from "../firebase.js";
import { requireUser } from "../authMiddleware.js";
import { loadUser } from "../recalcService.js";

const r = Router();
r.get("/daily", requireUser, async (req, res) => {
  try {
    const user = await loadUser(req.uid);
    if (!user) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    const zone = user.timezone || "UTC";
    const dateKey =
      req.query.date && /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.date))
        ? String(req.query.date)
        : DateTime.now().setZone(zone).toFormat("yyyy-MM-dd");
    const docId = `${req.uid}_${dateKey}`;
    const snap = await db.collection("dailySummary").doc(docId).get();
    if (!snap.exists) {
      res.json({
        dateKey,
        summary: {
          userId: req.uid,
          dateKey,
          regularHours: 0,
          overtimeHours: 0,
          nightDifferentialHours: 0,
          lateMinutes: 0,
          undertimeMinutes: 0,
          totalWorkedHours: 0,
        },
      });
      return;
    }
    res.json({ dateKey, summary: { id: snap.id, ...snap.data() } });
  } catch (e) {
    res.status(500).json({ error: e.message || "Server error" });
  }
});

r.get("/history", requireUser, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 90);
    const snap = await db
      .collection("dailySummary")
      .where("userId", "==", req.uid)
      .orderBy("dateKey", "desc")
      .limit(limit)
      .get();
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ summaries: rows });
  } catch (e) {
    res.status(500).json({ error: e.message || "Server error" });
  }
});

export default r;
