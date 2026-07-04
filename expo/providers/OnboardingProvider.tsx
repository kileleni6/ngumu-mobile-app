import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useRef, useState } from "react";

import { getJSON, setJSON } from "@/services/storage";
import type { OnboardingState } from "@/types";

const ONBOARDING_KEY = "ngumu.onboarding.v1";

const DEFAULT_STATE: OnboardingState = {
  completed: false,
  skippedAt: null,
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

  const complete = useCallback(() => {
    const next: OnboardingState = { completed: true, skippedAt: null };
    setState(next);
    setJSON(ONBOARDING_KEY, next);
  }, []);

  const skip = useCallback(() => {
    const next: OnboardingState = { completed: true, skippedAt: Date.now() };
    setState(next);
    setJSON(ONBOARDING_KEY, next);
  }, []);

  const reset = useCallback(() => {
    setState(DEFAULT_STATE);
    setJSON(ONBOARDING_KEY, DEFAULT_STATE);
  }, []);

  return { hydrated, completed: state.completed, skippedAt: state.skippedAt, complete, skip, reset };
});
