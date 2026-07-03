/** Formats milliseconds as mm:ss (or h:mm:ss above one hour). */
export function formatClock(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Formats minutes as "2h 15m" / "45m". */
export function formatMinutes(min: number): string {
  const safe = Math.max(0, Math.round(min));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** yyyy-mm-dd key for a date (local time). */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** yyyy-mm-dd key offset by N days from today (negative = past). */
export function dayKeyOffset(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return dayKey(d);
}

/** Short weekday label ("Mon") for a yyyy-mm-dd key. */
export function weekdayLabel(key: string): string {
  const parts = key.split("-").map((p) => parseInt(p, 10));
  const d = new Date(parts[0], (parts[1] ?? 1) - 1, parts[2] ?? 1);
  return d.toLocaleDateString(undefined, { weekday: "short" });
}
