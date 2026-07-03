import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  BarChart3,
  CheckCircle2,
  Crown,
  Eye,
  Lock,
  RefreshCcw,
  ShieldBan,
  Timer,
  X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useLicense } from "@/providers/LicenseProvider";
import {
  fetchOfferings,
  purchasePackage,
  type RCPackageInfo,
} from "@/services/revenuecat";
import { getJSON, setJSON } from "@/services/storage";

const FEATURES: { icon: React.ReactNode; label: string }[] = [
  { icon: <ShieldBan color={Colors.gold} size={18} />, label: "App & website blocking during focus" },
  { icon: <Timer color={Colors.gold} size={18} />, label: "Custom focus & break modes" },
  { icon: <Lock color={Colors.gold} size={18} />, label: "Strict break mode" },
  { icon: <Eye color={Colors.gold} size={18} />, label: "Blink warning customization" },
  { icon: <BarChart3 color={Colors.gold} size={18} />, label: "Advanced analytics & CSV export" },
  { icon: <RefreshCcw color={Colors.gold} size={18} />, label: "Multi-device restore" },
];

/** Maps RevenueCat package types to display metadata. */
function packageMeta(pkg: RCPackageInfo): { name: string; badge?: string; detail: string } {
  const type = pkg.packageType;
  if (type.includes("WEEKLY")) {
    return { name: "Weekly", detail: "Flexible — cancel anytime" };
  }
  if (type.includes("MONTHLY")) {
    return { name: "Monthly", detail: "Most popular balance", badge: "POPULAR" };
  }
  if (type.includes("ANNUAL") || type.includes("YEARLY")) {
    return { name: "Yearly", detail: "Best yearly value" };
  }
  if (type.includes("LIFETIME")) {
    return { name: "Lifetime", detail: "Pay once, own it forever", badge: "BEST VALUE" };
  }
  return { name: pkg.product.title || pkg.identifier, detail: pkg.product.description };
}

const ONBOARDING_KEY = "ngumu.onboarding.v1";

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const license = useLicense();
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [busy, setBusy] = useState<"purchase" | "restore" | null>(null);

  const offeringsQuery = useQuery({
    queryKey: ["rc-offerings"],
    queryFn: fetchOfferings,
    staleTime: 5 * 60 * 1000,
  });

  const packages: RCPackageInfo[] = offeringsQuery.data?.current ?? [];
  const isLoading = offeringsQuery.isLoading;
  const isError = offeringsQuery.isError;
  const isHardPaywall = license.tier === "free";
  const canDismiss = !isHardPaywall;

  const onPurchase = async () => {
    if (packages.length === 0) return;
    setBusy("purchase");
    try {
      const result = await purchasePackage(packages[selectedIdx].raw);
      if (result.cancelled) {
        // user dismissed the native sheet — no action needed
      } else if (result.hasPro) {
        await license.onPurchaseSuccess();
        Alert.alert("Pro activated", "Welcome to NGUMU Pro. Enjoy your focus!");
        router.back();
      } else {
        Alert.alert(
          "Almost there",
          "Payment received but entitlement is still syncing. Try Restore in a moment."
        );
      }
    } catch {
      Alert.alert(
        "Purchase unavailable",
        "Check your connection and try again. If the problem persists, contact support."
      );
    } finally {
      setBusy(null);
    }
  };

  const onRestore = async () => {
    setBusy("restore");
    try {
      const ok = await license.restorePurchase();
      if (ok) {
        Alert.alert("Restored", "Your NGUMU Pro license is active on this device.");
        router.back();
      } else {
        Alert.alert("No purchases found", "No active NGUMU Pro purchases were found for this account.");
      }
    } catch {
      Alert.alert("Restore failed", "Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  };

  const onClose = () => {
    if (canDismiss) {
      router.back();
    } else {
      Alert.alert(
        "Trial expired",
        "Your 40-day trial has ended. The basic timer remains free, but Pro features require a subscription.",
        [{ text: "View plans", style: "default" }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient colors={[Colors.maroonDeep, Colors.maroon]} style={styles.hero}>
            {canDismiss && (
              <TouchableOpacity
                style={[styles.closeButton, { top: insets.top + 8 }]}
                onPress={onClose}
                testID="paywall-close"
              >
                <X color={Colors.textOnDarkMuted} size={22} />
              </TouchableOpacity>
            )}
            <View style={styles.crownWrap}>
              <Crown color={Colors.gold} size={34} />
            </View>
            <Text style={styles.heroTitle}>NGUMU Pro</Text>
            <Text style={styles.heroSub}>
              {license.tier === "trial"
                ? `You have ${license.trialDaysLeft} trial days of full Pro access left`
                : license.tier === "pro"
                  ? "Pro is active on this device"
                  : "Your 40-day trial has ended — the basic timer stays free forever"}
            </Text>
            {isHardPaywall && (
              <View style={styles.hardPaywallBadge}>
                <Lock color={Colors.gold} size={14} />
                <Text style={styles.hardPaywallText}>Trial expired — unlock Pro to continue</Text>
              </View>
            )}
          </LinearGradient>

          <View style={styles.body}>
            <View style={styles.features}>
              {FEATURES.map((f) => (
                <View key={f.label} style={styles.featureRow}>
                  {f.icon}
                  <Text style={styles.featureText}>{f.label}</Text>
                </View>
              ))}
            </View>

            {license.tier !== "pro" && (
              <>
                <Text style={styles.sectionTitle}>Choose a plan</Text>
                {isLoading && (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color={Colors.maroon} size="large" />
                    <Text style={styles.loadingText}>Loading plans...</Text>
                  </View>
                )}
                {isError && !isLoading && (
                  <View style={styles.errorCard}>
                    <Text style={styles.errorText}>
                      Could not load plans. Check your connection and pull down to retry, or tap
                      Restore if you already purchased.
                    </Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => offeringsQuery.refetch()}
                    >
                      <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {!isLoading && !isError && packages.length === 0 && (
                  <View style={styles.errorCard}>
                    <Text style={styles.errorText}>
                      No plans available right now. Tap Restore if you already purchased, or try
                      again later.
                    </Text>
                  </View>
                )}
                {!isLoading && packages.length > 0 && (
                  <View style={styles.plans}>
                    {packages.map((pkg, idx) => {
                      const meta = packageMeta(pkg);
                      const selected = selectedIdx === idx;
                      return (
                        <TouchableOpacity
                          key={pkg.identifier}
                          style={[styles.planCard, selected && styles.planCardSelected]}
                          onPress={() => setSelectedIdx(idx)}
                        >
                          <View style={styles.planTextWrap}>
                            <View style={styles.planNameRow}>
                              <Text style={[styles.planName, selected && styles.planNameSelected]}>
                                {meta.name}
                              </Text>
                              {meta.badge && (
                                <View style={styles.planBadge}>
                                  <Text style={styles.planBadgeText}>{meta.badge}</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.planDetail}>{meta.detail}</Text>
                          </View>
                          <View style={styles.planRightCol}>
                            {pkg.priceString ? (
                              <Text style={[styles.planPrice, selected && styles.planPriceSelected]}>
                                {pkg.priceString}
                              </Text>
                            ) : null}
                            <CheckCircle2
                              color={selected ? Colors.gold : Colors.border}
                              size={22}
                            />
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
                <Text style={styles.priceNote}>
                  Subscription auto-renews unless cancelled at least 24 hours before the period ends.
                  Manage in your device&apos;s store settings.
                </Text>

                {!license.revenueCatConfigured && (
                  <View style={styles.warnCard}>
                    <Text style={styles.warnText}>
                      Payments are not fully configured yet. Restore may still work if you have a
                      previous purchase.
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.ctaButton, busy !== null && styles.ctaDisabled, packages.length === 0 && styles.ctaDisabled]}
                  onPress={onPurchase}
                  disabled={busy !== null || packages.length === 0}
                  testID="checkout-button"
                >
                  {busy === "purchase" ? (
                    <ActivityIndicator color={Colors.maroonDeep} />
                  ) : (
                    <Text style={styles.ctaText}>
                      {isHardPaywall ? "Subscribe to unlock" : "Continue"}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.restoreLink, busy !== null && styles.ctaDisabled]}
                  onPress={onRestore}
                  disabled={busy !== null}
                  testID="restore-button"
                >
                  {busy === "restore" ? (
                    <ActivityIndicator color={Colors.textSecondary} size="small" />
                  ) : (
                    <Text style={styles.restoreText}>Restore purchases</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {license.tier === "pro" && license.license && (
              <View style={styles.proCard}>
                <CheckCircle2 color={Colors.success} size={22} />
                <Text style={styles.proCardText}>
                  Pro active{license.license.expirationDate
                    ? ` · renews ${new Date(license.license.expirationDate).toLocaleDateString()}`
                    : " · lifetime"}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  hero: {
    alignItems: "center",
    paddingTop: 64,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  closeButton: { position: "absolute", right: 16, padding: 8 },
  crownWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(227,168,28,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroTitle: { color: Colors.white, fontSize: 28, fontWeight: "800" as const },
  heroSub: {
    color: Colors.textOnDarkMuted,
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
  hardPaywallBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(227,168,28,0.15)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 12,
  },
  hardPaywallText: { color: Colors.gold, fontSize: 12, fontWeight: "700" as const },
  body: { paddingHorizontal: 20, paddingTop: 20 },
  features: { gap: 12, marginBottom: 8 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureText: { fontSize: 15, color: Colors.text, flex: 1 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginTop: 22,
    marginBottom: 10,
  },
  loadingRow: { alignItems: "center", paddingVertical: 28, gap: 12 },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },
  errorCard: {
    backgroundColor: Colors.dangerSoft,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  errorText: { color: Colors.danger, fontSize: 13, lineHeight: 18 },
  retryButton: {
    alignSelf: "flex-start",
    backgroundColor: Colors.maroon,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: { color: Colors.white, fontSize: 14, fontWeight: "700" as const },
  plans: { gap: 10 },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: 16,
  },
  planCardSelected: { borderColor: Colors.gold, backgroundColor: Colors.goldSoft },
  planTextWrap: { flex: 1 },
  planNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  planName: { fontSize: 16, fontWeight: "800" as const, color: Colors.text },
  planNameSelected: { color: Colors.maroonDeep },
  planBadge: {
    backgroundColor: Colors.maroon,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  planBadgeText: { color: Colors.gold, fontSize: 9, fontWeight: "800" as const },
  planDetail: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  planRightCol: { alignItems: "flex-end", gap: 6 },
  planPrice: { fontSize: 15, fontWeight: "800" as const, color: Colors.text },
  planPriceSelected: { color: Colors.maroonDeep },
  priceNote: { fontSize: 11, color: Colors.textSecondary, marginTop: 10, lineHeight: 15 },
  warnCard: {
    backgroundColor: Colors.dangerSoft,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  warnText: { color: Colors.danger, fontSize: 13, lineHeight: 18 },
  ctaButton: {
    backgroundColor: Colors.gold,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: Colors.maroonDeep, fontSize: 16, fontWeight: "800" as const },
  restoreLink: { alignItems: "center", paddingVertical: 16 },
  restoreText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "600" as const,
    textDecorationLine: "underline" as const,
  },
  proCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.successSoft,
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
  },
  proCardText: { color: Colors.text, fontSize: 14, fontWeight: "600" as const, flex: 1 },
});
