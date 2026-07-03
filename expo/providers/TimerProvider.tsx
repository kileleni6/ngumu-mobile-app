import createContextHook from "@nkzw/create-context-hook";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";

import { resolveMode } from "@/constants/modes";
import { useAnalytics } from "@/providers/AnalyticsProvider";
import { useSettings } from "@/providers/SettingsProvider";
import {
  cancelNotifications,
  ensureNotificationSetup,
  notifyNow,
  scheduleAt,
} from "@/services/notifications";
import { getJSON, setJSON } from "@/services/storage";
import type { TimerPhase } from "@/types";

const TIMER_KEY = "ngumu.timer.v2";
const DEFAULT_MODE_ID = "pomodoro";

interface PersistedTimer {
  phase: TimerPhase;
  running: boolean;
  endsAt: number | null;
  remainingMs: number;
  totalMs: number;
  modeId: string;
}

function idleSnap(modeId: string, focusMs: number): PersistedTimer {
  return {
    phase: "idle",
    running: false,
    endsAt: null,
    remainingMs: focusMs,
    totalMs: focusMs,
    modeId,
  };
}

export const [TimerProvider, useTimer] = createContextHook(() => {
  const { settings, hydrated: settingsHydrated } = useSettings();
  const analytics = useAnalytics();

  const [snap, setSnap] = useState<PersistedTimer>(() => idleSnap(DEFAULT_MODE_ID, 25 * 60 * 1000));
  const [hydrated, setHydrated] = useState<boolean>(false);
  const [now, setNow] = useState<number>(Date.now());

  const notifIdsRef = useRef<string[]>([]);
  const hydratingRef = useRef<boolean>(false);
  const transitioningRef = useRef<boolean>(false);
  const blinkWasImminentRef = useRef<boolean>(false);

  const analyticsRef = useRef(analytics);
  analyticsRef.current = analytics;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const mode = useMemo(() => resolveMode(snap.modeId, settings), [snap.modeId, settings]);

  // Hydrate persisted timer, reconciling sessions that finished while the app was closed.
  useEffect(() => {
    if (hydrated || hydratingRef.current || !settingsHydrated || !analytics.hydrated) return;
    hydratingRef.current = true;
    (async () => {
      const saved = await getJSON<PersistedTimer | null>(TIMER_KEY, null);
      if (saved) {
        const nowTs = Date.now();
        const m = resolveMode(saved.modeId, settingsRef.current);
        if (saved.running && saved.endsAt !== null && nowTs >= saved.endsAt) {
          if (saved.phase === "focus") {
            analyticsRef.current.addFocusMinutes(Math.round(saved.totalMs / 60000));
            analyticsRef.current.addSession();
            const breakMs = m.breakSec * 1000;
            const breakEnds = saved.endsAt + breakMs;
            if (nowTs < breakEnds) {
              setSnap({
                phase: "break",
                running: true,
                endsAt: breakEnds,
                remainingMs: breakEnds - nowTs,
                totalMs: breakMs,
                modeId: saved.modeId,
              });
            } else {
              analyticsRef.current.addBreakTaken();
              setSnap(idleSnap(saved.modeId, m.focusSec * 1000));
            }
          } else if (saved.phase === "break") {
            analyticsRef.current.addBreakTaken();
            setSnap(idleSnap(saved.modeId, m.focusSec * 1000));
          } else {
            setSnap(idleSnap(saved.modeId, m.focusSec * 1000));
          }
        } else {
          setSnap(saved);
        }
      }
      setNow(Date.now());
      setHydrated(true);
    })();
  }, [hydrated, settingsHydrated, analytics.hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    setJSON(TIMER_KEY, snap);
  }, [snap, hydrated]);

  useEffect(() => {
    if (!snap.running) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [snap.running]);

  const remainingMs =
    snap.running && snap.endsAt !== null ? Math.max(0, snap.endsAt - now) : snap.remainingMs;
  const progress = snap.totalMs > 0 ? Math.min(1, 1 - remainingMs / snap.totalMs) : 0;

  const blinkImminent =
    settings.blinkWarningEnabled &&
    snap.phase === "focus" &&
    snap.running &&
    remainingMs > 0 &&
    remainingMs <= settings.blinkSeconds * 1000;

  // Haptic pulse when the blink warning begins.
  useEffect(() => {
    if (blinkImminent && !blinkWasImminentRef.current) {
      if (settingsRef.current.vibrationEnabled && Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
    }
    blinkWasImminentRef.current = blinkImminent;
  }, [blinkImminent]);

  // Phase completion while the app is open.
  useEffect(() => {
    if (!hydrated || !snap.running || snap.endsAt === null) return;
    if (now < snap.endsAt || transitioningRef.current) return;
    transitioningRef.current = true;
    const nowTs = Date.now();
    if (snap.phase === "focus") {
      analyticsRef.current.addFocusMinutes(Math.round(snap.totalMs / 60000));
      analyticsRef.current.addSession();
      if (settingsRef.current.vibrationEnabled && Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      const breakMs = mode.breakSec * 1000;
      setSnap((prev) => ({
        ...prev,
        phase: "break",
        running: true,
        endsAt: nowTs + breakMs,
        remainingMs: breakMs,
        totalMs: breakMs,
      }));
    } else if (snap.phase === "break") {
      analyticsRef.current.addBreakTaken();
      setSnap(idleSnap(snap.modeId, mode.focusSec * 1000));
    }
    setTimeout(() => {
      transitioningRef.current = false;
    }, 400);
  }, [now, hydrated, snap, mode]);

  // Keep idle timer in sync when the selected mode's durations change (e.g. custom settings).
  useEffect(() => {
    if (!hydrated || snap.phase !== "idle" || snap.running) return;
    const focusMs = mode.focusSec * 1000;
    if (snap.totalMs !== focusMs) {
      setSnap(idleSnap(snap.modeId, focusMs));
    }
  }, [mode.focusSec, snap, hydrated]);

  const clearScheduled = useCallback(async () => {
    if (notifIdsRef.current.length > 0) {
      const ids = notifIdsRef.current;
      notifIdsRef.current = [];
      await cancelNotifications(ids);
    }
  }, []);

  const scheduleSessionNotifications = useCallback(
    async (focusEndsAt: number, breakMs: number) => {
      const s = settingsRef.current;
      if (!s.notificationsEnabled) return;
      const ok = await ensureNotificationSetup();
      if (!ok) return;
      const ids: string[] = [];
      const warnAt = focusEndsAt - 60_000;
      if (warnAt > Date.now() + 5_000) {
        const id = await scheduleAt(
          new Date(warnAt),
          "Break starting soon",
          "Your focus block ends in 1 minute. Get ready to rest your eyes.",
          s.soundEnabled
        );
        if (id) ids.push(id);
      }
      const startId = await scheduleAt(
        new Date(focusEndsAt),
        "Break started",
        "Nice work. Step away from the screen and rest your eyes.",
        s.soundEnabled
      );
      if (startId) ids.push(startId);
      const endId = await scheduleAt(
        new Date(focusEndsAt + breakMs),
        "Break ended",
        "Break is over — ready for your next focus block?",
        s.soundEnabled
      );
      if (endId) ids.push(endId);
      notifIdsRef.current = ids;
    },
    []
  );

  const startFocus = useCallback(() => {
    const focusMs = mode.focusSec * 1000;
    const nowTs = Date.now();
    const endsAt = nowTs + focusMs;
    setNow(nowTs);
    setSnap((prev) => ({
      ...prev,
      phase: "focus",
      running: true,
      endsAt,
      remainingMs: focusMs,
      totalMs: focusMs,
    }));
    if (settingsRef.current.vibrationEnabled && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    if (settingsRef.current.notificationsEnabled) {
      notifyNow(
        "Focus started",
        `${mode.name}: ${Math.round(mode.focusSec / 60)} minutes. Stay on task!`,
        settingsRef.current.soundEnabled
      );
    }
    clearScheduled().then(() => scheduleSessionNotifications(endsAt, mode.breakSec * 1000));
  }, [mode, clearScheduled, scheduleSessionNotifications]);

  const pause = useCallback(() => {
    if (!snap.running || snap.endsAt === null) return;
    const rem = Math.max(0, snap.endsAt - Date.now());
    setSnap((prev) => ({ ...prev, running: false, endsAt: null, remainingMs: rem }));
    clearScheduled();
  }, [snap, clearScheduled]);

  const resume = useCallback(() => {
    if (snap.running || snap.phase === "idle") return;
    const nowTs = Date.now();
    const endsAt = nowTs + snap.remainingMs;
    setNow(nowTs);
    setSnap((prev) => ({ ...prev, running: true, endsAt }));
    if (snap.phase === "focus") {
      clearScheduled().then(() => scheduleSessionNotifications(endsAt, mode.breakSec * 1000));
    }
  }, [snap, mode.breakSec, clearScheduled, scheduleSessionNotifications]);

  const reset = useCallback(() => {
    if (snap.phase === "focus") {
      const rem =
        snap.running && snap.endsAt !== null
          ? Math.max(0, snap.endsAt - Date.now())
          : snap.remainingMs;
      const elapsedMin = Math.floor((snap.totalMs - rem) / 60000);
      if (elapsedMin > 0) analyticsRef.current.addFocusMinutes(elapsedMin);
    }
    clearScheduled();
    setSnap(idleSnap(snap.modeId, mode.focusSec * 1000));
  }, [snap, mode.focusSec, clearScheduled]);

  const skipBreak = useCallback(() => {
    if (snap.phase !== "break") return;
    analyticsRef.current.addBreakSkipped();
    clearScheduled();
    setSnap(idleSnap(snap.modeId, mode.focusSec * 1000));
  }, [snap, mode.focusSec, clearScheduled]);

  const setModeId = useCallback(
    (id: string) => {
      if (snap.phase !== "idle") return;
      const m = resolveMode(id, settingsRef.current);
      setSnap(idleSnap(id, m.focusSec * 1000));
    },
    [snap.phase]
  );

  return {
    hydrated,
    phase: snap.phase,
    running: snap.running,
    modeId: snap.modeId,
    mode,
    remainingMs,
    totalMs: snap.totalMs,
    progress,
    blinkImminent,
    startFocus,
    pause,
    resume,
    reset,
    skipBreak,
    setModeId,
  };
});
