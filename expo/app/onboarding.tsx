import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  Bell,
  Check,
  Eye,
  Gift,
  Play,
  ShieldBan,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
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

import PermissionSetup from "@/components/PermissionSetup";
import Colors from "@/constants/colors";
import { MODES } from "@/constants/modes";
import { useLicense } from "@/providers/LicenseProvider";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { useTimer } from "@/providers/TimerProvider";
import type { PermissionState } from "@/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const STEP_COUNT = 7;
const MAX_STEP = 6;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const onboarding = useOnboarding();
  const license = useLicense();
  const settings = useSettings();
  const timer = useTimer();

  const [step, setStep] = useState<Step>(0);
  const [selectedModeId, setSelectedModeId] = useState<string>("pomodoro");
  const [inviteCode, setInviteCode] = useState<string>("");
  const [claimResult, setClaimResult] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<boolean>(false);
  const [claimed, setClaimed] = useState<boolean>(false);

  const [permissions, setPermissions] = useState<{
    usageAccess: PermissionState;
    overlay: PermissionState;
    notifications: PermissionState;
  }>({
    usageAccess: "pending",
    overlay: "pending",
    notifications: "pending",
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fadeIn = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const goNext = useCallback(() => {
    fadeAnim.setValue(0);
    setStep((prev) => (Math.min(MAX_STEP, prev + 1) as Step));
    fadeIn();
  }, [fadeAnim, fadeIn]);

  const goBack = useCallback(() => {
    fadeAnim.setValue(0);
    setStep((prev) => (Math.max(0, prev - 1) as Step));
    fadeIn();
  }, [fadeAnim, fadeIn]);

  const requestNotifications = useCallback(async () => {
    try {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("ngumu-focus", {
          name: "Focus & Breaks",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
        });
      }
      const { granted } = await Notifications.requestPermissionsAsync();
      setPermissions((prev) => ({ ...prev, notifications: granted ? "granted" : "denied" }));
      onboarding.setNotificationsGranted(granted);
    } catch {
      setPermissions((prev) => ({ ...prev, notifications: "denied" }));
    }
  }, [onboarding]);

  const handleClaimInvite = useCallback(async () => {
    if (inviteCode.trim().length < 4 || claiming) return;
    setClaiming(true);
    setClaimResult(null);
    try {
      const result = await license.claimInviteCode(inviteCode);
      if (result.valid) {
        setClaimed(true);
        setClaimResult(result.message);
        onboarding.setInviteCode(inviteCode.trim().toUpperCase(), result.extraDays);
      } else {
        setClaimResult(result.message);
      }
    } catch {
      setClaimResult("Could not verify code. Check your connection and try again.");
    } finally {
      setClaiming(false);
    }
  }, [inviteCode, claiming, license, onboarding]);

  const finishOnboarding = useCallback(() => {
    onboarding.setSelectedModeId(selectedModeId);
    onboarding.complete();
    // Apply the selected mode to the timer.
    timer.setModeId(selectedModeId);
    router.replace("/(tabs)");
  }, [onboarding, selectedModeId, timer, router]);

  const startFirstSession = useCallback(() => {
    onboarding.setSelectedModeId(selectedModeId);
    onboarding.complete();
    timer.setModeId(selectedModeId);
    timer.startFocus();
    router.replace("/(tabs)");
  }, [onboarding, selectedModeId, timer, router]);

  const skipOnboarding = useCallback(() => {
    onboarding.setSelectedModeId(selectedModeId);
    onboarding.skip();
    timer.setModeId(selectedModeId);
    router.replace("/(tabs)");
  }, [onboarding, selectedModeId, timer, router]);

  // Step 0: Welcome
  const renderWelcome = () => (
    <View style={styles.slideContent}>
      <View style={[styles.iconWrapLg, { backgroundColor: `${Colors.gold}25` }]}>
        <Sparkles color={Colors.gold} size={40} />
      </View>
      <Text style={styles.title}>Welcome to NGUMU</Text>
      <Text style={styles.body}>
        Focus better, protect your eyes, and take control of your screen time.{"\n\n"}
        Your first 40 days are on us — full Pro access, no card needed.
      </Text>
    </View>
  );

  // Step 1: Choose default focus mode
  const renderChooseMode = () => (
    <View style={styles.slideContent}>
      <View style={[styles.iconWrapLg, { backgroundColor: `${Colors.blue}25` }]}>
        <Timer color={Colors.gold} size={40} />
      </View>
      <Text style={styles.title}>Choose your focus style</Text>
      <Text style={styles.body}>
        Pick a default mode. You can switch any time from the Focus screen.
      </Text>
      <View style={styles.modeList}>
        {MODES.filter((m) => !m.pro || m.id === "custom").map((m) => {
          const selected = selectedModeId === m.id;
          return (
            <TouchableOpacity
              key={m.id}
              style={[
                styles.modeOption,
                selected && { backgroundColor: m.accent, borderColor: m.accent },
              ]}
              onPress={() => setSelectedModeId(m.id)}
              activeOpacity={0.8}
            >
              <View style={styles.modeOptionLeft}>
                <Text
                  style={[
                    styles.modeOptionName,
                    selected && styles.modeOptionNameSelected,
                  ]}
                >
                  {m.name}
                </Text>
                <Text
                  style={[
                    styles.modeOptionTagline,
                    selected && styles.modeOptionTaglineSelected,
                  ]}
                >
                  {m.tagline}
                </Text>
              </View>
              {selected && (
                <Check color={Colors.white} size={20} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // Step 2: Blink warning & eye breaks
  const renderEyeHealth = () => (
    <View style={styles.slideContent}>
      <View style={[styles.iconWrapLg, { backgroundColor: `${Colors.goldDeep}25` }]}>
        <Eye color={Colors.gold} size={40} />
      </View>
      <Text style={styles.title}>Protect your eyes</Text>
      <Text style={styles.body}>
        The 20-20-20 rule and blink warnings keep your eyes healthy during long sessions.{"\n\n"}
        NGUMU reminds you to look 20 feet away for 20 seconds every 20 minutes, and blinks an eye animation before each break.
      </Text>
      <View style={styles.eyeFeatureCard}>
        <View style={styles.eyeFeatureRow}>
          <View style={styles.eyeFeatureIcon}>
            <Eye color={Colors.goldDeep} size={18} />
          </View>
          <Text style={styles.eyeFeatureText}>20-20-20 eye break reminders</Text>
        </View>
        <View style={styles.eyeFeatureRow}>
          <View style={styles.eyeFeatureIcon}>
            <Zap color={Colors.purple} size={18} />
          </View>
          <Text style={styles.eyeFeatureText}>Blink animation before breaks</Text>
        </View>
        <View style={styles.eyeFeatureRow}>
          <View style={styles.eyeFeatureIcon}>
            <Check color={Colors.success} size={18} />
          </View>
          <Text style={styles.eyeFeatureText}>Customizable warning duration</Text>
        </View>
      </View>
    </View>
  );

  // Step 3: Blocking permissions explanation
  const renderBlockingInfo = () => (
    <View style={styles.slideContent}>
      <View style={[styles.iconWrapLg, { backgroundColor: `${Colors.purple}25` }]}>
        <ShieldBan color={Colors.gold} size={40} />
      </View>
      <Text style={styles.title}>Block distractions</Text>
      <Text style={styles.body}>
        NGUMU can shield distracting apps and websites during your focus sessions.
      </Text>
      <View style={styles.blockingInfoCard}>
        {Platform.OS === "android" ? (
          <>
            <View style={styles.blockingInfoRow}>
              <View style={styles.blockingInfoDot} />
              <Text style={styles.blockingInfoText}>
                <Text style={styles.boldText}>Usage Access</Text> — track which apps are in the foreground
              </Text>
            </View>
            <View style={styles.blockingInfoRow}>
              <View style={styles.blockingInfoDot} />
              <Text style={styles.blockingInfoText}>
                <Text style={styles.boldText}>Display Over Apps</Text> — show the NGUMU block screen over distractions
              </Text>
            </View>
            <View style={styles.blockingInfoRow}>
              <View style={styles.blockingInfoDot} />
              <Text style={styles.blockingInfoText}>
                <Text style={styles.boldText}>Notifications</Text> — get reminded when focus ends
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.blockingInfoRow}>
              <View style={styles.blockingInfoDot} />
              <Text style={styles.blockingInfoText}>
                <Text style={styles.boldText}>Screen Time APIs</Text> — Apple-approved app shielding via FamilyControls
              </Text>
            </View>
            <View style={styles.blockingInfoRow}>
              <View style={styles.blockingInfoDot} />
              <Text style={styles.blockingInfoText}>
                <Text style={styles.boldText}>Notifications</Text> — focus and break reminders
              </Text>
            </View>
            <View style={styles.blockingInfoRow}>
              <View style={styles.blockingInfoDot} />
              <Text style={styles.blockingInfoText}>
                Some system-level blocking may be limited by iOS restrictions
              </Text>
            </View>
          </>
        )}
      </View>
      <Text style={styles.bodySmall}>
        We{"\u2019"}ll ask for these permissions on the next screen.
      </Text>
    </View>
  );

  // Step 4: Permission setup (uses PermissionSetup component)
  const renderPermissionSetup = () => (
    <View style={{ flex: 1 }}>
      <PermissionSetup
        permissions={permissions}
        onGrantUsageAccess={() => {
          // In Expo, we can't directly open system settings, but we mark as explained.
          // Real permission granting happens when the user uses blocking features.
          setPermissions((prev) => ({ ...prev, usageAccess: "granted" }));
        }}
        onGrantOverlay={() => {
          setPermissions((prev) => ({ ...prev, overlay: "granted" }));
        }}
        onGrantNotifications={requestNotifications}
        onContinue={goNext}
        onSkip={goNext}
      />
    </View>
  );

  // Step 5: Trial explanation + invite code
  const renderTrial = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.slideContent}>
          <View style={[styles.iconWrapLg, { backgroundColor: `${Colors.maroon}25` }]}>
            <Gift color={Colors.gold} size={40} />
          </View>
          <Text style={styles.title}>40 days of Pro, free</Text>
          <Text style={styles.body}>
            You get full Pro access for 40 days — app blocking, website blocking, custom modes, strict breaks, advanced analytics, and more.{"\n\n"}
            After your trial, the basic timer stays free. Pro features require a subscription.
          </Text>

          {/* Invite code section */}
          <View style={styles.inviteCard}>
            <View style={styles.inviteHeader}>
              <Gift color={Colors.gold} size={18} />
              <Text style={styles.inviteTitle}>Have an invite code?</Text>
            </View>
            <Text style={styles.inviteSub}>
              Claim a code to extend your free trial. Try{" "}
              <Text style={styles.inviteDemo}>NGUMU-WELCOME</Text> for +14 days.
            </Text>
            <View style={styles.inviteInputRow}>
              <TextInput
                style={styles.inviteInput}
                placeholder="Enter code"
                placeholderTextColor={Colors.textOnDarkMuted}
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!claimed}
              />
              <TouchableOpacity
                style={[
                  styles.inviteClaimButton,
                  (claiming || inviteCode.trim().length < 4 || claimed) &&
                    styles.inviteClaimButtonDisabled,
                ]}
                onPress={handleClaimInvite}
                disabled={claiming || inviteCode.trim().length < 4 || claimed}
                activeOpacity={0.8}
              >
                {claimed ? (
                  <Check color={Colors.maroonDeep} size={16} />
                ) : (
                  <Text style={styles.inviteClaimText}>
                    {claiming ? "..." : "Claim"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            {claimResult && (
              <Text
                style={[
                  styles.claimResult,
                  claimed ? styles.claimResultSuccess : styles.claimResultError,
                ]}
              >
                {claimResult}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // Step 6: Start first focus session
  const renderStart = () => {
    const mode = MODES.find((m) => m.id === selectedModeId) ?? MODES[0];
    return (
      <View style={styles.slideContent}>
        <View style={[styles.iconWrapLg, { backgroundColor: `${Colors.gold}25` }]}>
          <Play color={Colors.gold} size={40} fill={Colors.gold} />
        </View>
        <Text style={styles.title}>You{"\u2019"}re all set!</Text>
        <Text style={styles.body}>
          Everything is configured. Start your first focus session now, or jump right into the app.
        </Text>

        <View style={styles.readyCard}>
          <View style={styles.readyRow}>
            <Timer color={Colors.gold} size={18} />
            <Text style={styles.readyText}>
              Mode: <Text style={styles.readyBold}>{mode.name}</Text>
            </Text>
          </View>
          <View style={styles.readyRow}>
            <Eye color={Colors.gold} size={18} />
            <Text style={styles.readyText}>
              Eye health: <Text style={styles.readyBold}>{mode.eyeHealth ? "Enabled" : "Standard"}</Text>
            </Text>
          </View>
          <View style={styles.readyRow}>
            <Bell color={Colors.gold} size={18} />
            <Text style={styles.readyText}>
              Notifications:{" "}
              <Text style={styles.readyBold}>
                {permissions.notifications === "granted" ? "On" : "Optional"}
              </Text>
            </Text>
          </View>
          <View style={styles.readyRow}>
            <Gift color={Colors.gold} size={18} />
            <Text style={styles.readyText}>
              Trial: <Text style={styles.readyBold}>{license.trialDaysTotal} days</Text>
              {license.extraTrialDays > 0 && (
                <Text style={styles.readyBonus}> (+{license.extraTrialDays} from invite)</Text>
              )}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.startSessionButton}
          onPress={startFirstSession}
          activeOpacity={0.85}
        >
          <Play color={Colors.maroonDeep} size={20} fill={Colors.maroonDeep} />
          <Text style={styles.startSessionText}>Start first focus session</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const steps = [
    renderWelcome,
    renderChooseMode,
    renderEyeHealth,
    renderBlockingInfo,
    renderPermissionSetup,
    renderTrial,
    renderStart,
  ];

  const isPermissionStep = step === 4;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.maroonDeep, Colors.maroon, Colors.maroonDark]}
        style={styles.gradient}
      >
        {/* Step content */}
        {!isPermissionStep && (
          <View style={{ flex: 1 }}>
            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
              {steps[step]()}
            </Animated.View>
          </View>
        )}
        {isPermissionStep && (
          <View style={{ flex: 1 }}>
            {steps[step]()}
          </View>
        )}

        {/* Bottom controls (hidden on permission step — it has its own) */}
        {!isPermissionStep && (
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity onPress={skipOnboarding} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            <View style={styles.dotsRow}>
              {Array.from({ length: 7 }, (_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === step && styles.dotActive]}
                />
              ))}
            </View>

            {step === 6 ? (
              <TouchableOpacity
                style={styles.goButton}
                onPress={finishOnboarding}
                activeOpacity={0.8}
              >
                <Text style={styles.goButtonText}>Go to app</Text>
                <ArrowRight color={Colors.maroonDeep} size={18} />
              </TouchableOpacity>
            ) : step < 4 ? (
              <TouchableOpacity style={styles.nextButton} onPress={goNext} activeOpacity={0.8}>
                <ArrowRight color={Colors.gold} size={20} />
              </TouchableOpacity>
            ) : step === 5 ? (
              <TouchableOpacity style={styles.nextButton} onPress={goNext} activeOpacity={0.8}>
                <ArrowRight color={Colors.gold} size={20} />
              </TouchableOpacity>
            ) : (
              <View style={styles.nextButtonPlaceholder} />
            )}
          </View>
        )}

        {/* Back button on non-first, non-permission steps */}
        {!isPermissionStep && step > 0 && step < 5 && (
          <TouchableOpacity
            style={[styles.backButton, { top: insets.top + 8 }]}
            onPress={goBack}
            hitSlop={12}
          >
            <ArrowRight color={Colors.gold} size={20} style={{ transform: [{ rotate: "180deg" }] }} />
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.maroonDeep },
  gradient: { flex: 1 },
  slideContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  iconWrapLg: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    color: Colors.textOnDark,
    fontSize: 26,
    fontWeight: "800" as const,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  body: {
    color: Colors.textOnDarkMuted,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 23,
  },
  bodySmall: {
    color: Colors.textOnDarkMuted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 8,
  },
  boldText: { fontWeight: "700" as const, color: Colors.textOnDark },
  // Mode selection
  modeList: {
    width: "100%" as const,
    gap: 10,
    marginTop: 12,
  },
  modeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  modeOptionLeft: { flex: 1 },
  modeOptionName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.textOnDark,
  },
  modeOptionNameSelected: { color: Colors.white },
  modeOptionTagline: {
    fontSize: 12,
    color: Colors.textOnDarkMuted,
    marginTop: 2,
  },
  modeOptionTaglineSelected: { color: "rgba(255,255,255,0.8)" },
  // Eye health card
  eyeFeatureCard: {
    width: "100%" as const,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 18,
    gap: 14,
    marginTop: 8,
  },
  eyeFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  eyeFeatureIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  eyeFeatureText: {
    color: Colors.textOnDark,
    fontSize: 14,
    fontWeight: "500" as const,
  },
  // Blocking info card
  blockingInfoCard: {
    width: "100%" as const,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 18,
    gap: 14,
    marginTop: 4,
  },
  blockingInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  blockingInfoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gold,
    marginTop: 6,
  },
  blockingInfoText: {
    color: Colors.textOnDark,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  // Invite code card
  inviteCard: {
    width: "100%" as const,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 20,
    marginTop: 8,
  },
  inviteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  inviteTitle: {
    color: Colors.textOnDark,
    fontSize: 16,
    fontWeight: "700" as const,
  },
  inviteSub: {
    color: Colors.textOnDarkMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  inviteDemo: {
    fontWeight: "700" as const,
    color: Colors.gold,
  },
  inviteInputRow: {
    flexDirection: "row",
    gap: 10,
  },
  inviteInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: Colors.textOnDark,
    fontSize: 15,
    fontWeight: "600" as const,
    letterSpacing: 1,
  },
  inviteClaimButton: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  inviteClaimButtonDisabled: {
    opacity: 0.4,
  },
  inviteClaimText: {
    color: Colors.maroonDeep,
    fontSize: 15,
    fontWeight: "800" as const,
  },
  claimResult: {
    fontSize: 13,
    marginTop: 10,
    fontWeight: "600" as const,
  },
  claimResultSuccess: {
    color: Colors.gold,
  },
  claimResultError: {
    color: Colors.danger,
  },
  // Ready card (step 6)
  readyCard: {
    width: "100%" as const,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 20,
    gap: 14,
    marginTop: 4,
  },
  readyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  readyText: {
    color: Colors.textOnDark,
    fontSize: 14,
    fontWeight: "500" as const,
  },
  readyBold: {
    fontWeight: "700" as const,
    color: Colors.white,
  },
  readyBonus: {
    color: Colors.gold,
    fontWeight: "700" as const,
    fontSize: 12,
  },
  startSessionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.gold,
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 16,
    marginTop: 8,
  },
  startSessionText: {
    color: Colors.maroonDeep,
    fontSize: 16,
    fontWeight: "800" as const,
  },
  // Bottom bar
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  skipButton: { paddingVertical: 8, paddingHorizontal: 4 },
  skipText: { color: Colors.textOnDarkMuted, fontSize: 15, fontWeight: "600" as const },
  dotsRow: { flexDirection: "row", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.25)" },
  dotActive: { backgroundColor: Colors.gold, width: 20 },
  nextButton: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonPlaceholder: { width: 48 },
  goButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.gold,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 13,
  },
  goButtonText: { color: Colors.maroonDeep, fontSize: 16, fontWeight: "800" as const },
  backButton: {
    position: "absolute" as const,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
});
