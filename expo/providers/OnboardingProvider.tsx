import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useRef, useState } from "react";

import { getJSON, setJSON } from "@/services/storage";
import type { OnboardingState } from "@/types";

const ONBOARDING_KEY = "ngumu.onboarding.v2";

const DEFAULT_STATE: OnboardingState = {
  completed: false,
  skippedAt: null,
  selectedModeId: null,
  inviteCode: null,
  trialExtendedDays: 0,
  notificationsGranted: false,
};

export const [OnboardingProvider, useOnboarding] = createContextHook(() => {
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState<boolean>(false);
  const loadingRef = useRef<boolean>(false);

  useEffect(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    (async () => {
      const saved = await getJSON<Partial<OnboardingState>>(ONBOARDING_KEY, {});
      setState({ ...DEFAULT_STATE, ...saved });
      setHydrated(true);
    })();
  }, []);

  const persist = useCallback((next: OnboardingState) => {
    setState(next);
    setJSON(ONBOARDING_KEY, next);
  }, []);

  const complete = useCallback(() => {
    persist({ ...state, completed: true, skippedAt: null });
  }, [state, persist]);

  const skip = useCallback(() => {
    persist({ ...state, completed: true, skippedAt: Date.now() });
  }, [state, persist]);

  const reset = useCallback(() => {
    setState(DEFAULT_STATE);
    setJSON(ONBOARDING_KEY, DEFAULT_STATE);
  }, []);

  const setSelectedModeId = useCallback(
    (modeId: string) => {
      const next = { ...state, selectedModeId: modeId };
      persist(next);
    },
    [state, persist]
  );

  const setInviteCode = useCallback(
    (code: string, extraDays: number) => {
      const next = { ...state, inviteCode: code, trialExtendedDays: extraDays };
      persist(next);
    },
    [state, persist]
  );

  const setNotificationsGranted = useCallback(
    (granted: boolean) => {
      const next = { ...state, notificationsGranted: granted };
      persist(next);
    },
    [state, persist]
  );

  return {
    hydrated,
    completed: state.completed,
    skippedAt: state.skippedAt,
    selectedModeId: state.selectedModeId,
    inviteCode: state.inviteCode,
    trialExtendedDays: state.trialExtendedDays,
    notificationsGranted: state.notificationsGranted,
    complete,
    skip,
    reset,
    setSelectedModeId,
    setInviteCode,
    setNotificationsGranted,
  };
});
