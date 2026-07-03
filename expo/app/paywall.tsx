import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  BarChart3,
  CheckCircle2,
  Crown,
  Eye,
  Lock,
  Mail,
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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useLicense } from "@/providers/LicenseProvider";
import type { PlanId } from "@/types";

interface PlanOption {
  id: PlanId;
  name: string;
  detail: string;
  badge?: string;
}

const PLANS: PlanOption[] = [
  { id: "weekly", name: "Weekly", detail: "Flexible — cancel anytime" },
  { id: "monthly", name: "Monthly", detail: "Most popular balance", badge: "POPULAR" },
  { id: "lifetime", name: "Lifetime", detail: "Pay once, own it forever", badge: "BEST VALUE" },
];

const FEATURES: { icon: React.ReactNode; label: string }[] = [
  { icon: <ShieldBan color={Colors.gold} size={18} />, label: "App & website blocking during focus" },
  { icon: <Timer color={Colors.gold} size={18} />, label: "Custom focus & break modes" },
  { icon: <Lock color={Colors.gold} size={18} />, label: "Strict break mode" },
  { icon: <Eye color={Colors.gold} size={18} />, label: "Blink warning customization" },
  { icon: <BarChart3 color={Colors.gold} size={18} />, label: "Advanced analytics & CSV export" },
  { icon: <RefreshCcw color={Colors.gold} size={18} />, label: "Multi-device restore by email" },
];

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const license = useLicense();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("lifetime");
  const [email, setEmail] = useState<string>(license.license?.email ?? "");
  const [busy, setBusy] = useState<"checkout" | "verify" | "restore" | null>(null);

  const onCheckout = async () => {
    if (!isValidEmail(email)) {
      Alert.alert("Email needed", "Enter the email you want your license attached to.");
      return;
    }
    setBusy("checkout");
    try {
      await license.beginCheckout(selectedPlan, email.trim());
    } catch (e) {
      Alert.alert("Checkout unavailable", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const onVerify = async () => {
    if (!isValidEmail(email)) {
      Alert.alert("Email needed", "Enter the email you used at checkout.");
      return;
    }
    setBusy("verify");
    try {
      let activated = false;
      for (let attempt = 0; attempt < 4; attempt++) {
        activated = await license.checkAndActivate(email.trim());
        if (activated) break;
        await new Promise((r) => setTimeout(r, 2500));
      }
      if (activated) {
        Alert.alert("Pro activated", "Welcome to NGUMU Pro. Enjoy your focus!");
        router.back();
      } else {
        Alert.alert(
          "Not found yet",
          "We couldn't confirm the payment yet. It can take a minute — try Verify again shortly."
        );
      }
    } catch (e) {
      Alert.alert("Verification failed", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const onRestore = async () => {
    if (!isValidEmail(email)) {
      Alert.alert("Email needed", "Enter the email you purchased with to restore.");
      return;
    }
    setBusy("restore");
    try {
      const ok = await license.checkAndActivate(email.trim());
      if (ok) {
        Alert.alert("Restored", "Your Pro license is active on this device.");
        router.back();
      } else {
        Alert.alert("No license found", "No active license found for that email.");
      }
    } catch (e) {
      Alert.alert("Restore failed", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(null);
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
        >
          <LinearGradient colors={[Colors.maroonDeep, Colors.maroon]} style={styles.hero}>
            <TouchableOpacity
              style={[styles.closeButton, { top: insets.top + 8 }]}
              onPress={() => router.back()}
              testID="paywall-close"
            >
              <X color={Colors.textOnDarkMuted} size={22} />
            </TouchableOpacity>
            <View style={styles.crownWrap}>
              <Crown color={Colors.gold} size={34} />
            </View>
            <Text style={styles.heroTitle}>NGUMU Pro</Text>
            <Text style={styles.heroSub}>
              {license.tier === "trial"
                ? `You have ${license.trialDaysLeft} trial days of full Pro access left`
                : license.tier === "pro"
                  ? "Pro is active on this device"
                  : "Your trial ended — the basic timer stays free forever"}
            </Text>
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
                <View style={styles.plans}>
                  {PLANS.map((p) => {
                    const selected = selectedPlan === p.id;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.planCard, selected && styles.planCardSelected]}
                        onPress={() => setSelectedPlan(p.id)}
                        testID={`plan-${p.id}`}
                      >
                        <View style={styles.planTextWrap}>
                          <View style={styles.planNameRow}>
                            <Text style={[styles.planName, selected && styles.planNameSelected]}>
                              {p.name}
                            </Text>
                            {p.badge && (
                              <View style={styles.planBadge}>
                                <Text style={styles.planBadgeText}>{p.badge}</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.planDetail}>{p.detail}</Text>
                        </View>
                        <CheckCircle2
                          color={selected ? Colors.gold : Colors.border}
                          size={22}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.priceNote}>
                  Final price is shown on the secure Polar checkout page.
                </Text>

                <Text style={styles.sectionTitle}>Your email</Text>
                <View style={styles.emailRow}>
                  <Mail color={Colors.textSecondary} size={18} />
                  <TextInput
                    style={styles.emailInput}
                    placeholder="you@example.com"
                    placeholderTextColor={Colors.textSecondary}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    testID="email-input"
                  />
                </View>
                <Text style={styles.emailNote}>
                  Your license is attached to this email — it&apos;s also how you restore Pro on
                  other devices.
                </Text>

                {!license.backendConfigured && (
                  <View style={styles.warnCard}>
                    <Text style={styles.warnText}>
                      Backend not connected yet. Add your Convex deployment URL to enable checkout
                      and restore.
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.ctaButton, busy !== null && styles.ctaDisabled]}
                  onPress={onCheckout}
                  disabled={busy !== null}
                  testID="checkout-button"
                >
                  {busy === "checkout" ? (
                    <ActivityIndicator color={Colors.maroonDeep} />
                  ) : (
                    <Text style={styles.ctaText}>Continue to secure checkout</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryButton, busy !== null && styles.ctaDisabled]}
                  onPress={onVerify}
                  disabled={busy !== null}
                  testID="verify-button"
                >
                  {busy === "verify" ? (
                    <ActivityIndicator color={Colors.maroon} />
                  ) : (
                    <Text style={styles.secondaryText}>I already paid — verify</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.restoreLink}
                  onPress={onRestore}
                  disabled={busy !== null}
                  testID="restore-button"
                >
                  {busy === "restore" ? (
                    <ActivityIndicator color={Colors.textSecondary} size="small" />
                  ) : (
                    <Text style={styles.restoreText}>Restore purchase by email</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {license.tier === "pro" && license.license && (
              <View style={styles.proCard}>
                <CheckCircle2 color={Colors.success} size={22} />
                <Text style={styles.proCardText}>
                  {license.license.plan.toUpperCase()} plan · {license.license.email}
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
  priceNote: { fontSize: 12, color: Colors.textSecondary, marginTop: 10 },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
  },
  emailInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: Colors.text },
  emailNote: { fontSize: 12, color: Colors.textSecondary, marginTop: 8, lineHeight: 17 },
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
  secondaryButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: Colors.maroon,
  },
  secondaryText: { color: Colors.maroon, fontSize: 15, fontWeight: "700" as const },
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
