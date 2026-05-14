import { DateTime } from "luxon";
import { db } from "./firebase.js";
import {
  buildPairs,
  bucketPairsByInDate,
  summarizeDay,
} from "./attendanceCalculator.js";

function toDateTime(ts, zone) {
  if (ts?.toDate)
    return DateTime.fromJSDate(ts.toDate(), { zone: "utc" }).setZone(zone);
  if (ts instanceof Date)
    return DateTime.fromJSDate(ts, { zone: "utc" }).setZone(zone);
  return DateTime.fromISO(String(ts), { zone: "utc" }).setZone(zone);
}

export async function loadUser(userId) {
  const snap = await db.collection("users").doc(userId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

export async function fetchAttendanceSince(userId, since) {
  let q = db
    .collection("attendance")
    .where("userId", "==", userId)
    .orderBy("timestamp", "asc");
  if (since) q = q.where("timestamp", ">=", since);
  const snap = await q.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function recalculateSummariesForUser(userId) {
  const user = await loadUser(userId);
  if (!user) throw new Error("User profile not found");
  const zone = user.timezone || "UTC";
  const schedule = user.schedule || { start: "09:00", end: "18:00" };
  const since = DateTime.now()
    .setZone(zone)
    .minus({ days: 120 })
    .startOf("day")
    .toUTC();
  const rows = await fetchAttendanceSince(userId, since.toJSDate());

  const punches = rows
    .map((r) => ({
      type: r.type,
      at: toDateTime(r.timestamp, zone),
    }))
    .sort((a, b) => a.at.toMillis() - b.at.toMillis());

  const pairs = buildPairs(punches);
  const buckets = bucketPairsByInDate(pairs, zone);
  const batch = db.batch();
  for (const [dateKey, dayPairs] of buckets.entries()) {
    const metrics = summarizeDay(dateKey, schedule, zone, dayPairs);
    const docId = `${userId}_${dateKey}`;
    const ref = db.collection("dailySummary").doc(docId);
    batch.set(
      ref,
      {
        userId,
        dateKey,
        ...metrics,
        updatedAt: new Date(),
      },
      { merge: true },
    );
  }

  await batch.commit();
  return buckets.size;
}
