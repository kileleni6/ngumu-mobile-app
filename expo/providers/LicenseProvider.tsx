import createContextHook from "@nkzw/create-context-hook";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";

import {
  createPolarCheckout,
  fetchLicenseStatus,
  isBackendConfigured,
} from "@/services/convex";
import {
  cancelNotifications,
  ensureNotificationSetup,
  notifyNow,
  scheduleAt,
} from "@/services/notifications";
import { getJSON, setJSON } from "@/services/storage";
import type { AccessTier, LicenseRecord, PlanId } from "@/types";

const TRIAL_DAYS = 40;
const DAY_MS = 24 * 60 * 60 * 1000;

const DEVICE_ID_KEY = "ngumu.deviceId.v1";
const TRIAL_KEY = "ngumu.trialStartedAt.v1";
const LICENSE_KEY = "ngumu.license.v1";
const TRIAL_NOTIF_KEY = "ngumu.trialNotifIds.v1";

function generateDeviceId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 10; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return `NGUMU-${id}`;
}

export const [LicenseProvider, useLicense] = createContextHook(() => {
  const [deviceId, setDeviceId] = useState<string>("");
  const [trialStartedAt, setTrialStartedAt] = useState<number>(0);
  const [license, setLicense] = useState<LicenseRecord | null>(null);
  const [hydrated, setHydrated] = useState<boolean>(false);
  const loadingRef = useRef<boolean>(false);

  useEffect(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    (async () => {
      let id = await getJSON<string>(DEVICE_ID_KEY, "");
      if (!id) {
        id = generateDeviceId();
        await setJSON(DEVICE_ID_KEY, id);
      }
      let trial = await getJSON<number>(TRIAL_KEY, 0);
      if (!trial) {
        trial = Date.now();
        await setJSON(TRIAL_KEY, trial);
      }
      const lic = await getJSON<LicenseRecord | null>(LICENSE_KEY, null);
      setDeviceId(id);
      setTrialStartedAt(trial);
      setLicense(lic);
      setHydrated(true);
    })();
  }, []);

  const trialEndsAt = trialStartedAt + TRIAL_DAYS * DAY_MS;
  const trialDaysLeft = hydrated
    ? Math.max(0, Math.ceil((trialEndsAt - Date.now()) / DAY_MS))
    : TRIAL_DAYS;

  const tier: AccessTier = license !== null ? "pro" : trialDaysLeft > 0 ? "trial" : "free";
  const hasPro = tier !== "free";

  // Schedule "trial ending soon" + "trial expired" notifications once.
  useEffect(() => {
    if (!hydrated || license !== null || trialStartedAt === 0) return;
    (async () => {
      const existing = await getJSON<string[] | null>(TRIAL_NOTIF_KEY, null);
      if (existing !== null) return;
      const ok = await ensureNotificationSetup();
      if (!ok) return;
      const ids: string[] = [];
      const soonAt = trialEndsAt - 3 * DAY_MS;
      if (soonAt > Date.now()) {
        const id = await scheduleAt(
          new Date(soonAt),
          "Trial ending soon",
          "3 days of Pro left. Keep app blocking, strict breaks and analytics with a plan.",
          true
        );
        if (id) ids.push(id);
      }
      if (trialEndsAt > Date.now()) {
        const id = await scheduleAt(
          new Date(trialEndsAt),
          "Trial expired",
          "Your basic timer stays free. Upgrade any time to restore Pro features.",
          true
        );
        if (id) ids.push(id);
      }
      await setJSON(TRIAL_NOTIF_KEY, ids);
    })();
  }, [hydrated, license, trialStartedAt, trialEndsAt]);

  const activateLicense = useCallback(async (record: LicenseRecord) => {
    setLicense(record);
    await setJSON(LICENSE_KEY, record);
    const pending = await getJSON<string[] | null>(TRIAL_NOTIF_KEY, null);
    if (pending && pending.length > 0) await cancelNotifications(pending);
    notifyNow("Pro restored", "NGUMU Pro is active on this device. Enjoy!", true);
  }, []);

  /** Opens the Polar hosted checkout created by Convex. */
  const beginCheckout = useCallback(
    async (plan: PlanId, email: string): Promise<void> => {
      const res = await createPolarCheckout({
        plan,
        email,
        deviceId,
        platform: Platform.OS,
      });
      await WebBrowser.openBrowserAsync(res.url);
    },
    [deviceId]
  );

  /** Single license check by email; activates locally when Convex reports an active license. */
  const checkAndActivate = useCallback(
    async (email: string): Promise<boolean> => {
      const res = await fetchLicenseStatus({ email, deviceId });
      if (res.active) {
        await activateLicense({
          email,
          plan: res.plan ?? "lifetime",
          activatedAt: Date.now(),
        });
        return true;
      }
      return false;
    },
    [deviceId, activateLicense]
  );

  return useMemo(
    () => ({
      hydrated,
      deviceId,
      trialStartedAt,
      trialEndsAt,
      trialDaysLeft,
      trialDaysTotal: TRIAL_DAYS,
      license,
      tier,
      hasPro,
      backendConfigured: isBackendConfigured(),
      beginCheckout,
      checkAndActivate,
    }),
    [
      hydrated,
      deviceId,
      trialStartedAt,
      trialEndsAt,
      trialDaysLeft,
      license,
      tier,
      hasPro,
      beginCheckout,
      checkAndActivate,
    ]
  );
});
