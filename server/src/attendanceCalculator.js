import { DateTime } from "luxon";

export function buildPairs(sorted) {
  const pairs = [];
  let pendingIn = null;
  for (const p of sorted) {
    if (p.type === "in") {
      pendingIn = p.at;
    } else if (p.type === "out" && pendingIn) {
      if (p.at > pendingIn) pairs.push({ in: pendingIn, out: p.at });
      pendingIn = null;
    }
  }
  return pairs;
}

export function shiftBounds(dateKey, schedule, zone) {
  const [sh, sm = 0] = schedule.start.split(":").map(Number);
  const [eh, em = 0] = schedule.end.split(":").map(Number);
  const day = DateTime.fromISO(`${dateKey}T12:00:00`, { zone }).startOf("day");
  const start = day.set({ hour: sh, minute: sm, second: 0, millisecond: 0 });
  const end = day.set({ hour: eh, minute: em, second: 0, millisecond: 0 });
  if (end <= start) {
    return { start, end: end.plus({ days: 1 }) };
  }
  return { start, end };
}

function overlapMs(a0, a1, b0, b1) {
  const x = Math.max(a0, b0);
  const y = Math.min(a1, b1);
  return x < y ? y - x : 0;
}

export function nightDifferentialMs(pairIn, pairOut, zone) {
  const s = pairIn.setZone(zone);
  const e = pairOut.setZone(zone);
  const sMs = s.toMillis();
  const eMs = e.toMillis();
  let total = 0;
  let cursor = s.startOf("day").minus({ days: 1 });
  const limit = e.endOf("day").plus({ days: 1 });
  while (cursor <= limit) {
    const y = cursor.year;
    const m = cursor.month;
    const d = cursor.day;
    const nightStart = DateTime.fromObject(
      {
        year: y,
        month: m,
        day: d,
        hour: 22,
        minute: 0,
        second: 0,
        millisecond: 0,
      },
      { zone },
    );
    const nightEnd = nightStart.plus({ hours: 8 });
    total += overlapMs(sMs, eMs, nightStart.toMillis(), nightEnd.toMillis());
    cursor = cursor.plus({ days: 1 });
  }
  return total;
}

export function summarizeDay(dateKey, schedule, zone, pairsForDay) {
  const { start: shiftStart, end: shiftEnd } = shiftBounds(
    dateKey,
    schedule,
    zone,
  );
  let totalWorkMs = 0;
  let ndMs = 0;
  for (const p of pairsForDay) {
    const dur = p.out.toMillis() - p.in.toMillis();
    if (dur > 0) {
      totalWorkMs += dur;
      ndMs += nightDifferentialMs(p.in, p.out, zone);
    }
  }
  const scheduledMs = Math.max(0, shiftEnd.toMillis() - shiftStart.toMillis());
  const regularMs = Math.min(totalWorkMs, scheduledMs);
  const otMs = Math.max(0, totalWorkMs - scheduledMs);
  let lateMs = 0;
  let undertimeMs = 0;

  if (pairsForDay.length > 0) {
    const firstIn = pairsForDay.reduce(
      (min, p) => (p.in < min ? p.in : min),
      pairsForDay[0].in,
    );
    const lastOut = pairsForDay.reduce(
      (max, p) => (p.out > max ? p.out : max),
      pairsForDay[0].out,
    );
    lateMs = Math.max(0, firstIn.toMillis() - shiftStart.toMillis());
    undertimeMs = Math.max(0, shiftEnd.toMillis() - lastOut.toMillis());
  }
  const toHours = (ms) => Math.round((ms / 3600000) * 1000) / 1000;
  const toMinutes = (ms) => Math.round(ms / 60000);
  return {
    dateKey,
    regularHours: toHours(regularMs),
    overtimeHours: toHours(otMs),
    nightDifferentialHours: toHours(ndMs),
    lateMinutes: toMinutes(lateMs),
    undertimeMinutes: toMinutes(undertimeMs),
    totalWorkedHours: toHours(totalWorkMs),
  };
}

export function bucketPairsByInDate(pairs, zone) {
  const map = new Map();
  for (const p of pairs) {
    const key = p.in.setZone(zone).toFormat("yyyy-MM-dd");
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(p);
  }
  return map;
}
