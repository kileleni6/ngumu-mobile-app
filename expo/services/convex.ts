/**
 * Convex API client — reserved for optional future server-side sync
 * (analytics, cross-device data). Payment processing has been migrated
 * to RevenueCat — this module no longer handles checkout or licensing.
 *
 * Set EXPO_PUBLIC_CONVEX_URL to your Convex deployment's HTTP Actions URL.
 * All calls are wrapped with offline-safe error handling so the app
 * never crashes when the device has no internet connection.
 */
const CONVEX_URL: string = (process.env.EXPO_PUBLIC_CONVEX_URL ?? "").replace(/\/+$/, "");

export function isBackendConfigured(): boolean {
  return CONVEX_URL.length > 0;
}

/**
 * Attempts a POST to a Convex HTTP endpoint. Returns null on any network
 * failure (offline, timeout, DNS) instead of throwing — callers should
 * treat null as "offline/unavailable" and fall back to local state.
 */
export async function safePost<T>(
  path: string,
  body: Record<string, unknown>
): Promise<T | null> {
  if (!isBackendConfigured()) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${CONVEX_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      console.log(`[convex] ${path} failed ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    console.log(`[convex] ${path} offline or error:`, e instanceof Error ? e.message : e);
    return null;
  }
}
