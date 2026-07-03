import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useSettings } from "@/providers/SettingsProvider";
import { getJSON, setJSON } from "@/services/storage";
import { dayKey, dayKeyOffset } from "@/utils/time";
import type { DayStats } from "@/types";

const STATS_KEY = "ngumu.stats.v1";
const KEEP_DAYS = 90;

function emptyDay(date: string): DayStats {
  return { date, focusMinutes: 0, sessions: 0, breaksTaken: 0, breaksSkipped: 0, blockedAttempts: 0 };
}

type StatsMap = Record<string, DayStats>;

function prune(map: StatsMap): StatsMap {
  const cutoff = dayKeyOffset(-KEEP_DAYS);
  const next: StatsMap = {};
  for (const key of Object.keys(map)) {
    if (key >= cutoff) next[key] = map[key];
  }
  return next;
}

export const [AnalyticsProvider, useAnalytics] = createContextHook(() => {
  const { settings } = useSettings();
  const [stats, setStats] = useState<StatsMap>({});
  const [hydrated, setHydrated] = useState<boolean>(false);
  const loadingRef = useRef<boolean>(false);

  useEffect(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    (async () => {
      const saved = await getJSON<StatsMap>(STATS_KEY, {});
      setStats(prune(saved));
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setJSON(STATS_KEY, stats);
  }, [stats, hydrated]);

  const mutateToday = useCallback((fn: (day: DayStats) => DayStats) => {
    const key = dayKey();
    setStats((prev) => ({ ...prev, [key]: fn(prev[key] ?? emptyDay(key)) }));
  }, []);

  const addFocusMinutes = useCallback(
    (min: number) => {
      if (min <= 0) return;
      mutateToday((d) => ({ ...d, focusMinutes: d.focusMinutes + min }));
    },
    [mutateToday]
  );

  const addSession = useCallback(() => {
    mutateToday((d) => ({ ...d, sessions: d.sessions + 1 }));
  }, [mutateToday]);

  const addBreakTaken = useCallback(() => {
    mutateToday((d) => ({ ...d, breaksTaken: d.breaksTaken + 1 }));
  }, [mutateToday]);

  const addBreakSkipped = useCallback(() => {
    mutateToday((d) => ({ ...d, breaksSkipped: d.breaksSkipped + 1 }));
  }, [mutateToday]);

  const addBlockedAttempt = useCallback(() => {
    mutateToday((d) => ({ ...d, blockedAttempts: d.blockedAttempts + 1 }));
  }, [mutateToday]);

  const today: DayStats = stats[dayKey()] ?? emptyDay(dayKey());

  /** Last 7 days, oldest first. */
  const week: DayStats[] = useMemo(() => {
    const days: DayStats[] = [];
    for (let i = 6; i >= 0; i--) {
      const key = dayKeyOffset(-i);
      days.push(stats[key] ?? emptyDay(key));
    }
    return days;
  }, [stats]);

  /** Consecutive days (ending today or yesterday) with at least 10 focus minutes. */
  const streak: number = useMemo(() => {
    let count = 0;
    let offset = 0;
    const todayHasFocus = (stats[dayKey()]?.focusMinutes ?? 0) >= 10;
    if (!todayHasFocus) offset = -1;
    for (let i = 0; i < KEEP_DAYS; i++) {
      const key = dayKeyOffset(offset - i);
      if ((stats[key]?.focusMinutes ?? 0) >= 10) count++;
      else break;
    }
    if (todayHasFocus) return count;
    return count;
  }, [stats]);

  /** 0-100 score: 70% daily goal progress + 30% break compliance. */
  const focusScore: number = useMemo(() => {
    const goal = Math.max(1, settings.dailyGoalMin);
    const goalPart = Math.min(1, today.focusMinutes / goal) * 70;
    const totalBreaks = today.breaksTaken + today.breaksSkipped;
    const compliance = totalBreaks === 0 ? 1 : today.breaksTaken / totalBreaks;
    return Math.round(goalPart + compliance * 30);
  }, [today, settings.dailyGoalMin]);

  const toCSV = useCallback((): string => {
    const keys = Object.keys(stats).sort().reverse();
    const header = "date,focus_minutes,sessions,breaks_taken,breaks_skipped,blocked_attempts";
    const rows = keys.map((k) => {
      const d = stats[k];
      return `${d.date},${d.focusMinutes},${d.sessions},${d.breaksTaken},${d.breaksSkipped},${d.blockedAttempts}`;
    });
    return [header, ...rows].join("\n");
  }, [stats]);

  return {
    hydrated,
    today,
    week,
    streak,
    focusScore,
    addFocusMinutes,
    addSession,
    addBreakTaken,
    addBreakSkipped,
    addBlockedAttempt,
    toCSV,
  };
});
