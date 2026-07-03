import type { PlanId } from "@/types";

/**
 * Convex API client — the mobile app ONLY talks to your existing Convex HTTP
 * endpoints. No Polar secrets live in this app; Convex creates checkouts and
 * polls Polar by checkout email server-side (same webhook-less flow as the
 * Chrome extension).
 *
 * Set EXPO_PUBLIC_CONVEX_URL to your Convex deployment's HTTP Actions URL,
 * e.g. https://your-deployment.convex.site
 *
 * If your existing HTTP routes use different paths, adjust ENDPOINTS below to
 * match the routes your Chrome extension already calls.
 */
const CONVEX_URL: string = (process.env.EXPO_PUBLIC_CONVEX_URL ?? "").replace(/\/+$/, "");

export const ENDPOINTS = {
  /** POST { plan, email, deviceId, platform } -> { url } (Polar checkout URL) */
  createCheckout: "/api/checkout",
  /** POST { email, deviceId } -> { active, plan? } — polls Polar by checkout email */
  licenseStatus: "/api/license/status",
} as const;

export function isBackendConfigured(): boolean {
  return CONVEX_URL.length > 0;
}

export class ConvexNotConfiguredError extends Error {
  constructor() {
    super(
      "Backend not connected yet. Add your Convex deployment URL (EXPO_PUBLIC_CONVEX_URL) to enable checkout and restore."
    );
    this.name = "ConvexNotConfiguredError";
  }
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  if (!isBackendConfigured()) throw new ConvexNotConfiguredError();
  const res = await fetch(`${CONVEX_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.log(`[convex] ${path} failed ${res.status}: ${text.slice(0, 200)}`);
    throw new Error(`Request failed (${res.status}). Please try again.`);
  }
  return (await res.json()) as T;
}

export interface CheckoutResponse {
  url: string;
}

export interface LicenseStatusResponse {
  active: boolean;
  plan?: PlanId;
  status?: string;
}

/** Asks Convex to create a Polar checkout session and returns the hosted URL. */
export async function createPolarCheckout(params: {
  plan: PlanId;
  email: string;
  deviceId: string;
  platform: string;
}): Promise<CheckoutResponse> {
  return post<CheckoutResponse>(ENDPOINTS.createCheckout, { ...params, source: "mobile" });
}

/** Checks license status by checkout email (webhook-less Polar polling on the Convex side). */
export async function fetchLicenseStatus(params: {
  email: string;
  deviceId: string;
}): Promise<LicenseStatusResponse> {
  return post<LicenseStatusResponse>(ENDPOINTS.licenseStatus, { ...params, source: "mobile" });
}
