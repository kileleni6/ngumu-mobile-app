import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Crown,
  Eye,
  Gift,
  Globe,
  Play,
  ShieldBan,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react-native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
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

import OnboardingIllustration from "@/components/OnboardingIllustration";
import PermissionSetup from "@/components/PermissionSetup";
import Colors from "@/constants/colors";
import { MODES } from "@/constants/modes";
import { LANGUAGE_META, t, type LanguageCode } from "@/i18n";
import { useLanguage } from "@/providers/LanguageProvider";
import { useLicense } from "@/providers/LicenseProvider";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { useTimer } from "@/providers/TimerProvider";
import type { PermissionState } from "@/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const STEP_COUNT = 8;
const MAX_STEP = 7;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const onboarding = useOnboarding();
  const license = useLicense();
  const settings = useSettings();
  const timer = useTimer();
  const { code: languageCode, setCode: setLanguageCode } = useLanguage();

  const [step, setStep] = useState<number>(0);
  const [selectedModeId, setSelectedModeId] = useState<string>("pomodoro");
  const [inviteCode, setInviteCode] = useState<string>("");
  const [claimResult, setClaimResult] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<boolean>(false);
  const [claimed, setClaimed] = useState<boolean>(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState<boolean>(false);

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
  const slideAnim = useRef(new Animated.Value(24)).current;

  const animateIn = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(24);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 12,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const goNext = useCallback(() => {
    setStep((prev) => Math.min(MAX_STEP, prev + 1));
    animateIn();
  }, [animateIn]);

  const goBack = useCallback(() => {
    setStep((prev) => Math.max(0, prev - 1));
    animateIn();
  }, [animateIn]);

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
      setClaimResult(t("errors.generic"));
    } finally {
      setClaiming(false);
    }
  }, [inviteCode, claiming, license, onboarding]);

  const finishOnboarding = useCallback(() => {
    onboarding.setSelectedModeId(selectedModeId);
    onboarding.complete();
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

  // Step 0: Language picker
  const renderLanguage = () => (
    <View style={styles.centerContent}>
      <OnboardingIllustration scene="welcome" size={180} />
      <Text style={styles.title}>{t("onboarding.language.title")}</Text>
      <Text style={styles.body}>{t("onboarding.language.subtitle")}</Text>

      <TouchableOpacity
        style={styles.languagePicker}
        onPress={() => setShowLanguagePicker(true)}
        activeOpacity={0.8}
      >
        <Globe color={Colors.gold} size={20} />
        <Text style={styles.languagePickerText}>
          {LANGUAGE_META.find((l) => l.code === languageCode)?.flag ?? "🌐"} {" "}
          {LANGUAGE_META.find((l) => l.code === languageCode)?.name ?? "English"}
        </Text>
        <ChevronDown color={Colors.textOnDarkMuted} size={18} />
      </TouchableOpacity>

      {showLanguagePicker && (
        <View style={styles.languageList}>
          <FlatList
            data={LANGUAGE_META}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  item.code === languageCode && styles.languageOptionActive,
                ]}
                onPress={() => {
                  setLanguageCode(item.code);
                  setShowLanguagePicker(false);
                }}
              >
                <Text style={styles.languageOptionFlag}>{item.flag}</Text>
                <Text style={styles.languageOptionName}>{item.name}</Text>
                {item.code === languageCode && (
                  <Check color={Colors.gold} size={18} />
                )}
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 240 }}
          />
        </View>
      )}
    </View>
  );

  // Step 1: Welcome
  const renderWelcome = () => (
    <View style={styles.centerContent}>
      <OnboardingIllustration scene="welcome" size={200} />
      <Text style={styles.title}>{t("onboarding.welcome.title")}</Text>
      <Text style={styles.body}>{t("onboarding.welcome.subtitle")}</Text>
    </View>
  );

  // Step 2: Choose default focus mode
  const renderChooseMode = () => (
    <View style={styles.centerContent}>
      <OnboardingIllustration scene="mode" size={180} />
      <Text style={styles.title}>{t("onboarding.mode.title")}</Text>
      <Text style={styles.body}>{t("onboarding.mode.subtitle")}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.modeList}
      >
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
              {selected && <Check color={Colors.white} size={20} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // Step 3: Blink warning & eye breaks
  const renderEyeHealth = () => (
    <View style={styles.centerContent}>
      <OnboardingIllustration scene="eyeHealth" size={190} />
      <Text style={styles.title}>{t("onboarding.eyeHealth.title")}</Text>
      <Text style={styles.body}>{t("onboarding.eyeHealth.subtitle")}</Text>
      <View style={styles.featureCard}>
        <View style={styles.featureRow}>
          <View style={styles.featureIcon}>
            <Eye color={Colors.goldDeep} size={18} />
          </View>
          <Text style={styles.featureText}>{t("onboarding.eyeHealth.feature1")}</Text>
        </View>
        <View style={styles.featureRow}>
          <View style={styles.featureIcon}>
            <Zap color={Colors.purple} size={18} />
          </View>
          <Text style={styles.featureText}>{t("onboarding.eyeHealth.feature2")}</Text>
        </View>
        <View style={styles.featureRow}>
          <View style={styles.featureIcon}>
            <Check color={Colors.success} size={18} />
          </View>
          <Text style={styles.featureText}>{t("onboarding.eyeHealth.feature3")}</Text>
        </View>
      </View>
    </View>
  );

  // Step 4: Blocking permissions explanation
  const renderBlockingInfo = () => (
    <View style={styles.centerContent}>
      <OnboardingIllustration scene="blocking" size={190} />
      <Text style={styles.title}>{t("onboarding.blocking.title")}</Text>
      <Text style={styles.body}>{t("onboarding.blocking.subtitle")}</Text>
      <View style={styles.featureCard}>
        {Platform.OS === "android" ? (
          <>
            <View style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Sparkles color={Colors.gold} size={18} />
              </View>
              <Text style={styles.featureText}>{t("onboarding.blocking.androidUsage")}</Text>
            </View>
            <View style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <ShieldBan color={Colors.gold} size={18} />
              </View>
              <Text style={styles.featureText}>{t("onboarding.blocking.androidOverlay")}</Text>
            </View>
            <View style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Timer color={Colors.gold} size={18} />
              </View>
              <Text style={styles.featureText}>{t("onboarding.blocking.androidNotifications")}</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Sparkles color={Colors.gold} size={18} />
              </View>
              <Text style={styles.featureText}>{t("onboarding.blocking.iosScreenTime")}</Text>
            </View>
            <View style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Timer color={Colors.gold} size={18} />
              </View>
              <Text style={styles.featureText}>{t("onboarding.blocking.iosNotifications")}</Text>
            </View>
            <View style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <ShieldBan color={Colors.gold} size={18} />
              </View>
              <Text style={styles.featureText}>{t("onboarding.blocking.iosLimitation")}</Text>
            </View>
          </>
        )}
      </View>
      <Text style={styles.bodySmall}>{t("onboarding.blocking.nextHint")}</Text>
    </View>
  );

  // Step 5: Permission setup
  const renderPermissionSetup = () => (
    <View style={{ flex: 1 }}>
      <PermissionSetup
        permissions={permissions}
        onGrantUsageAccess={() => {
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

  // Step 6: Trial explanation + invite code
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
        <View style={styles.centerContent}>
          <OnboardingIllustration scene="trial" size={170} />
          <View style={styles.proBadge}>
            <Crown color={Colors.gold} size={14} />
            <Text style={styles.proBadgeText}>40-DAY PRO</Text>
          </View>
          <Text style={styles.title}>{t("onboarding.trial.title")}</Text>
          <Text style={styles.body}>{t("onboarding.trial.subtitle")}</Text>

          <View style={styles.inviteCard}>
            <View style={styles.inviteHeader}>
              <Gift color={Colors.gold} size={18} />
              <Text style={styles.inviteTitle}>{t("onboarding.trial.inviteTitle")}</Text>
            </View>
            <Text style={styles.inviteSub}>
              {t("onboarding.trial.inviteSubtitle", { demo: "NGUMU-WELCOME", days: 14 })}
            </Text>
            <View style={styles.inviteInputRow}>
              <TextInput
                style={styles.inviteInput}
                placeholder={t("onboarding.trial.placeholder")}
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
                    {claiming ? t("onboarding.trial.claiming") : t("onboarding.trial.claim")}
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

  // Step 7: Start first focus session
  const renderStart = () => {
    const mode = MODES.find((m) => m.id === selectedModeId) ?? MODES[0];
    return (
      <View style={styles.centerContent}>
        <OnboardingIllustration scene="start" size={190} />
        <Text style={styles.title}>{t("onboarding.start.title")}</Text>
        <Text style={styles.body}>{t("onboarding.start.subtitle")}</Text>

        <View style={styles.readyCard}>
          <View style={styles.readyRow}>
            <Timer color={Colors.gold} size={18} />
            <Text style={styles.readyText}>
              {t("onboarding.start.mode", { name: mode.name })}
            </Text>
          </View>
          <View style={styles.readyRow}>
            <Eye color={Colors.gold} size={18} />
            <Text style={styles.readyText}>
              {t("onboarding.start.eyeHealth", { status: mode.eyeHealth ? t("common.enabled") : t("common.standard") })}
            </Text>
          </View>
          <View style={styles.readyRow}>
            <Sparkles color={Colors.gold} size={18} />
            <Text style={styles.readyText}>
              {t("onboarding.start.trial", { days: license.trialDaysTotal })}
              {license.extraTrialDays > 0 && (
                <Text style={styles.readyBonus}>
                  {t("onboarding.start.trialBonus", { days: license.extraTrialDays })}
                </Text>
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
          <Text style={styles.startSessionText}>{t("onboarding.start.cta")}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const steps = [
    renderLanguage,
    renderWelcome,
    renderChooseMode,
    renderEyeHealth,
    renderBlockingInfo,
    renderPermissionSetup,
    renderTrial,
    renderStart,
  ];

  const isPermissionStep = step === 5;
  const isLastStep = step === MAX_STEP;

  const canGoNext = useMemo(() => {
    if (step === 0) return true;
    if (step === 5) return false;
    return true;
  }, [step]);

  const bottomBar = isPermissionStep ? null : (
    <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
      <TouchableOpacity onPress={skipOnboarding} style={styles.skipButton}>
        <Text style={styles.skipText}>{t("common.skip")}</Text>
      </TouchableOpacity>

      <View style={styles.dotsRow}>
        {Array.from({ length: STEP_COUNT }, (_, i) => (
          <View
            key={i}
            style={[styles.dot, i === step && styles.dotActive]}
          />
        ))}
      </View>

      {isLastStep ? (
        <TouchableOpacity
          style={styles.goButton}
          onPress={finishOnboarding}
          activeOpacity={0.8}
        >
          <Text style={styles.goButtonText}>{t("onboarding.start.goToApp")}</Text>
          <ArrowRight color={Colors.maroonDeep} size={18} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.nextButton}
          onPress={canGoNext ? goNext : undefined}
          activeOpacity={0.8}
          disabled={!canGoNext}
        >
          <ArrowRight color={Colors.gold} size={20} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.maroonDeep, Colors.maroon, Colors.maroonDark]}
        style={styles.gradient}
      >
        {!isPermissionStep && (
          <View style={styles.contentWrap}>
            <Animated.View
              style={{
                flex: 1,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              {steps[step]()}
            </Animated.View>
          </View>
        )}
        {isPermissionStep && (
          <View style={{ flex: 1 }}>{steps[step]()}</View>
        )}

        {bottomBar}

        {!isPermissionStep && step > 0 && step < 5 && (
          <TouchableOpacity
            style={[styles.backButton, { top: insets.top + 8 }]}
            onPress={goBack}
            hitSlop={12}
          >
            <ArrowRight
              color={Colors.gold}
              size={20}
              style={{ transform: [{ rotate: "180deg" }] }}
            />
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.maroonDeep },
  gradient: { flex: 1 },
  contentWrap: {
    flex: 1,
    paddingTop: 24,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 14,
  },
  title: {
    color: Colors.textOnDark,
    fontSize: 25,
    fontWeight: "800" as const,
    textAlign: "center",
    letterSpacing: -0.5,
    marginTop: 8,
  },
  body: {
    color: Colors.textOnDarkMuted,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 23,
    maxWidth: 320,
  },
  bodySmall: {
    color: Colors.textOnDarkMuted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 4,
    maxWidth: 320,
  },
  // Language picker
  languagePicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginTop: 8,
    minWidth: 220,
    justifyContent: "space-between",
  },
  languagePickerText: {
    color: Colors.textOnDark,
    fontSize: 16,
    fontWeight: "700" as const,
    flex: 1,
  },
  languageList: {
    width: "100%" as const,
    maxWidth: 300,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    marginTop: 8,
    paddingVertical: 8,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  languageOptionActive: {
    backgroundColor: "rgba(227,168,28,0.15)",
  },
  languageOptionFlag: {
    fontSize: 18,
  },
  languageOptionName: {
    flex: 1,
    color: Colors.textOnDark,
    fontSize: 15,
    fontWeight: "600" as const,
  },
  // Mode selection
  modeList: {
    paddingHorizontal: 24,
    gap: 10,
    marginTop: 8,
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
    minWidth: 150,
  },
  modeOptionLeft: { flex: 1 },
  modeOptionName: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.textOnDark,
  },
  modeOptionNameSelected: { color: Colors.white },
  modeOptionTagline: {
    fontSize: 11,
    color: Colors.textOnDarkMuted,
    marginTop: 2,
  },
  modeOptionTaglineSelected: { color: "rgba(255,255,255,0.8)" },
  // Feature card
  featureCard: {
    width: "100%" as const,
    maxWidth: 340,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 18,
    gap: 14,
    marginTop: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    color: Colors.textOnDark,
    fontSize: 14,
    fontWeight: "500" as const,
    flex: 1,
  },
  // Pro badge
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(227,168,28,0.2)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  proBadgeText: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: "800" as const,
  },
  // Invite code card
  inviteCard: {
    width: "100%" as const,
    maxWidth: 340,
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
  // Ready card
  readyCard: {
    width: "100%" as const,
    maxWidth: 340,
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
  skipText: {
    color: Colors.textOnDarkMuted,
    fontSize: 15,
    fontWeight: "600" as const,
  },
  dotsRow: { flexDirection: "row", gap: 6 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  dotActive: { backgroundColor: Colors.gold, width: 20 },
  nextButton: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  goButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.gold,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 13,
  },
  goButtonText: {
    color: Colors.maroonDeep,
    fontSize: 16,
    fontWeight: "800" as const,
  },
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
