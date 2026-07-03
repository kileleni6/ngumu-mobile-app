import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useRef, useState } from "react";

import { getJSON, setJSON } from "@/services/storage";
import type { SiteListMode } from "@/types";

const BLOCKING_KEY = "ngumu.blocking.v1";

interface BlockingState {
  appBlockingEnabled: boolean;
  siteBlockingEnabled: boolean;
  blockedAppIds: string[];
  sites: string[];
  siteListMode: SiteListMode;
}

const DEFAULT_STATE: BlockingState = {
  appBlockingEnabled: false,
  siteBlockingEnabled: false,
  blockedAppIds: [],
  sites: [],
  siteListMode: "blocklist",
};

function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
}

export const [BlockingProvider, useBlocking] = createContextHook(() => {
  const [state, setState] = useState<BlockingState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState<boolean>(false);
  const loadingRef = useRef<boolean>(false);

  useEffect(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    (async () => {
      const saved = await getJSON<Partial<BlockingState>>(BLOCKING_KEY, {});
      setState({ ...DEFAULT_STATE, ...saved });
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setJSON(BLOCKING_KEY, state);
  }, [state, hydrated]);

  const setAppBlockingEnabled = useCallback((enabled: boolean) => {
    setState((prev) => ({ ...prev, appBlockingEnabled: enabled }));
  }, []);

  const setSiteBlockingEnabled = useCallback((enabled: boolean) => {
    setState((prev) => ({ ...prev, siteBlockingEnabled: enabled }));
  }, []);

  const toggleApp = useCallback((appId: string) => {
    setState((prev) => {
      const has = prev.blockedAppIds.includes(appId);
      return {
        ...prev,
        blockedAppIds: has
          ? prev.blockedAppIds.filter((id) => id !== appId)
          : [...prev.blockedAppIds, appId],
      };
    });
  }, []);

  const addSite = useCallback((domain: string): boolean => {
    const clean = normalizeDomain(domain);
    if (!clean || !clean.includes(".")) return false;
    setState((prev) =>
      prev.sites.includes(clean) ? prev : { ...prev, sites: [...prev.sites, clean] }
    );
    return true;
  }, []);

  const removeSite = useCallback((domain: string) => {
    setState((prev) => ({ ...prev, sites: prev.sites.filter((s) => s !== domain) }));
  }, []);

  const setSiteListMode = useCallback((mode: SiteListMode) => {
    setState((prev) => ({ ...prev, siteListMode: mode }));
  }, []);

  return {
    hydrated,
    ...state,
    setAppBlockingEnabled,
    setSiteBlockingEnabled,
    toggleApp,
    addSite,
    removeSite,
    setSiteListMode,
  };
});
