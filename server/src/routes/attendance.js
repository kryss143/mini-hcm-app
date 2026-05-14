import { Router } from "express";
import admin from "firebase-admin";
import { db } from "../firebase.js";
import { requireUser } from "../authMiddleware.js";
import { recalculateSummariesForUser } from "../recalcService.js";

const r = Router();
r.post("/punch", requireUser, async (req, res) => {
  try {
    const type = req.body?.type;
    if (type !== "in" && type !== "out") {
      res.status(400).json({ error: "type must be in or out" });
      return;
    }
    const ts = admin.firestore.Timestamp.fromDate(new Date());
    const ref = await db.collection("attendance").add({
      userId: req.uid,
      type,
      timestamp: ts,
    });
    const snap = await ref.get();
    await recalculateSummariesForUser(req.uid);
    res.status(201).json({ punch: { id: snap.id, ...snap.data() } });
  } catch (e) {
    res.status(500).json({ error: e.message || "Server error" });
  }
});

r.get("/mine", requireUser, async (req, res) => {
  try {
    const from = req.query.from
      ? new Date(String(req.query.from)).getTime()
      : null;
    const to = req.query.to ? new Date(String(req.query.to)).getTime() : null;
    const snap = await db
      .collection("attendance")
      .where("userId", "==", req.uid)
      .orderBy("timestamp", "desc")
      .limit(500)
      .get();
    let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    rows = rows.filter((r) => {
      const t = r.timestamp?.toDate
        ? r.timestamp.toDate().getTime()
        : new Date(r.timestamp).getTime();
      if (Number.isNaN(t)) return true;
      if (from != null && t < from) return false;
      if (to != null && t > to) return false;
      return true;
    });
    res.json({ attendance: rows });
  } catch (e) {
    res.status(500).json({ error: e.message || "Server error" });
  }
});

export default r;
