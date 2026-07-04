import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useRef, useState } from "react";

import { cancelNotifications, ensureNotificationSetup, scheduleDaily } from "@/services/notifications";
import { getJSON, setJSON } from "@/services/storage";
import type { AppSettings } from "@/types";

const SETTINGS_KEY = "ngumu.settings.v1";
const DAILY_REMINDER_ID_KEY = "ngumu.dailyReminderId.v1";

export const DEFAULT_SETTINGS: AppSettings = {
  blinkWarningEnabled: true,
  blinkSeconds: 5,
  soundEnabled: true,
  vibrationEnabled: true,
  strictBreaks: false,
  notificationsEnabled: true,
  dailyReminderEnabled: false,
  customFocusMin: 25,
  customBreakMin: 10,
  dailyGoalMin: 120,
  customEyeHealth: false,
};

export const [SettingsProvider, useSettings] = createContextHook(() => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState<boolean>(false);
  const loadingRef = useRef<boolean>(false);

  useEffect(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    (async () => {
      const saved = await getJSON<Partial<AppSettings>>(SETTINGS_KEY, {});
      setSettings({ ...DEFAULT_SETTINGS, ...saved });
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setJSON(SETTINGS_KEY, settings);
  }, [settings, hydrated]);

  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    if (patch.dailyReminderEnabled !== undefined) {
      (async () => {
        const existing = await getJSON<string | null>(DAILY_REMINDER_ID_KEY, null);
        if (existing) {
          await cancelNotifications([existing]);
          await setJSON(DAILY_REMINDER_ID_KEY, null);
        }
        if (patch.dailyReminderEnabled) {
          const ok = await ensureNotificationSetup();
          if (!ok) return;
          const id = await scheduleDaily(
            9,
            0,
            "Time to focus",
            "Start a focus session and protect your eyes today."
          );
          if (id) await setJSON(DAILY_REMINDER_ID_KEY, id);
        }
      })();
    }
  }, []);

  return { settings, update, hydrated };
});
