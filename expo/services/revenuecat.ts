import { Platform } from "react-native";
import Purchases from "react-native-purchases";

/**
 * RevenueCat service — handles all in-app purchase logic.
 * Replaces the previous Polar/Convex checkout flow.
 *
 * Three stores are configured: Test Store (dev/web), iOS App Store, Android Play Store.
 * The correct API key is selected automatically based on platform and build type.
 */

const ENTITLEMENT_ID = "NGUMU Pro";

let configured = false;

/** Picks the correct RevenueCat public API key for the current platform/build. */
export function getRCApiKey(): string {
  if (__DEV__ || Platform.OS === "web") {
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY ?? "";
  }
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? "",
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? "",
    default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY ?? "",
  });
}

/** Returns true if RevenueCat API keys are configured in environment variables. */
export function isRevenueCatConfigured(): boolean {
  return getRCApiKey().length > 0;
}

/**
 * Configures the RevenueCat SDK. Safe to call multiple times —
 * only configures once. Must be called before any other RC operation.
 */
export async function configureRevenueCat(appUserId?: string): Promise<void> {
  if (configured) return;
  const apiKey = getRCApiKey();
  if (!apiKey) {
    console.log("[revenuecat] No API key found — skipping configuration");
    return;
  }
  try {
    Purchases.configure({ apiKey, appUserID: appUserId ?? undefined });
    configured = true;
  } catch (e) {
    console.log("[revenuecat] configure failed", e);
  }
}

export interface RCPackageInfo {
  identifier: string;
  packageType: string;
  priceString: string;
  product: {
    identifier: string;
    title: string;
    description: string;
    price: number;
    currencyCode: string;
  };
  /** The raw Purchases package object — keep for purchasePackage calls. */
  raw: unknown;
}

export interface RCOfferingsResult {
  current: RCPackageInfo[] | null;
  all: Record<string, RCPackageInfo[]>;
}

/** Fetches the current offering's packages, or null if none available. */
export async function fetchOfferings(): Promise<RCOfferingsResult> {
  if (!configured) await configureRevenueCat();
  try {
    const offerings = await Purchases.getOfferings();
    const mapPackage = (pkg: any): RCPackageInfo => ({
      identifier: pkg.identifier,
      packageType: pkg.packageType,
      priceString: pkg.product?.priceString ?? "",
      product: {
        identifier: pkg.product?.identifier ?? "",
        title: pkg.product?.title ?? "",
        description: pkg.product?.description ?? "",
        price: pkg.product?.price ?? 0,
        currencyCode: pkg.product?.currencyCode ?? "USD",
      },
      raw: pkg,
    });
    const current = offerings.current
      ? (offerings.current.availablePackages ?? []).map(mapPackage)
      : null;
    const all: Record<string, RCPackageInfo[]> = {};
    for (const [key, offering] of Object.entries(offerings.all)) {
      all[key] = (offering.availablePackages ?? []).map(mapPackage);
    }
    return { current, all };
  } catch (e) {
    console.log("[revenuecat] fetchOfferings failed", e);
    return { current: null, all: {} };
  }
}

export interface RCCustomerInfoResult {
  hasPro: boolean;
  entitlementId: string | null;
  expirationDate: number | null;
  activeSubscriptions: string[];
}

/** Checks the current customer's entitlement status. */
export async function getCustomerInfo(): Promise<RCCustomerInfoResult> {
  if (!configured) await configureRevenueCat();
  try {
    const info = await Purchases.getCustomerInfo();
    const entitlements = info.entitlements.active;
    const proEntitlement = entitlements[ENTITLEMENT_ID];
    const hasPro = !!proEntitlement;
    const expirationDate = proEntitlement?.expirationDate
      ? new Date(proEntitlement.expirationDate).getTime()
      : null;
    return {
      hasPro,
      entitlementId: hasPro ? ENTITLEMENT_ID : null,
      expirationDate,
      activeSubscriptions: Object.keys(entitlements),
    };
  } catch (e) {
    console.log("[revenuecat] getCustomerInfo failed", e);
    return { hasPro: false, entitlementId: null, expirationDate: null, activeSubscriptions: [] };
  }
}

export interface PurchaseResult {
  success: boolean;
  cancelled: boolean;
  hasPro: boolean;
}

/** Initiates a purchase for a specific package. Handles cancel/error gracefully. */
export async function purchasePackage(pkgRaw: unknown): Promise<PurchaseResult> {
  if (!configured) await configureRevenueCat();
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkgRaw as any);
    const hasPro = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    return { success: true, cancelled: false, hasPro };
  } catch (e: any) {
    if (e?.userCancelled) {
      return { success: false, cancelled: true, hasPro: false };
    }
    console.log("[revenuecat] purchasePackage failed", e);
    throw e;
  }
}

/** Restores previous purchases — required by App Store review. */
export async function restorePurchases(): Promise<RCCustomerInfoResult> {
  if (!configured) await configureRevenueCat();
  try {
    const info = await Purchases.restorePurchases();
    const entitlements = info.entitlements.active;
    const proEntitlement = entitlements[ENTITLEMENT_ID];
    const hasPro = !!proEntitlement;
    const expirationDate = proEntitlement?.expirationDate
      ? new Date(proEntitlement.expirationDate).getTime()
      : null;
    return {
      hasPro,
      entitlementId: hasPro ? ENTITLEMENT_ID : null,
      expirationDate,
      activeSubscriptions: Object.keys(entitlements),
    };
  } catch (e) {
    console.log("[revenuecat] restorePurchases failed", e);
    return { hasPro: false, entitlementId: null, expirationDate: null, activeSubscriptions: [] };
  }
}

/** Resets the current user (useful for logout / testing). */
export async function resetUser(): Promise<void> {
  if (!configured) return;
  try {
    await Purchases.logOut();
  } catch {
    // ignore — may fail if no user is logged in
  }
}
