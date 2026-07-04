import { useRouter } from "expo-router";
import {
  Bell,
  BellRing,
  ChevronRight,
  Crown,
  Eye,
  Globe,
  Lock,
  Minus,
  Plus,
  RefreshCcw,
  Share2,
  Target,
  Vibrate,
  Volume2,
} from "lucide-react-native";
import React from "react";
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { LANGUAGE_META, t } from "@/i18n";
import { useLanguage } from "@/providers/LanguageProvider";
import { useLicense } from "@/providers/LicenseProvider";
import { useSettings } from "@/providers/SettingsProvider";

interface StepperProps {
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  locked: boolean;
  onChange: (next: number) => void;
  onLockedPress: () => void;
  testID?: string;
}

function Stepper({ value, min, max, step, unit, locked, onChange, onLockedPress, testID }: StepperProps) {
  const change = (delta: number) => {
    if (locked) {
      onLockedPress();
      return;
    }
    onChange(Math.min(max, Math.max(min, value + delta)));
  };
  return (
    <View style={styles.stepper} testID={testID}>
      <TouchableOpacity style={styles.stepperButton} onPress={() => change(-step)} hitSlop={6}>
        <Minus color={Colors.maroon} size={16} />
      </TouchableOpacity>
      <Text style={styles.stepperValue}>
        {value}
        {unit}
      </Text>
      <TouchableOpacity style={styles.stepperButton} onPress={() => change(step)} hitSlop={6}>
        <Plus color={Colors.maroon} size={16} />
      </TouchableOpacity>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { settings, update } = useSettings();
  const license = useLicense();
  const { code: languageCode, setCode: setLanguageCode } = useLanguage();

  const goPaywall = () => router.push("/paywall");

  const onRestore = async () => {
    try {
      const ok = await license.restorePurchase();
      if (ok) {
        Alert.alert(t("paywall.restored"), t("paywall.restoredBody"));
      } else {
        Alert.alert(t("paywall.noPurchases"), t("paywall.noPurchasesBody"));
      }
    } catch {
      Alert.alert(t("paywall.restoreFailed"), t("paywall.restoreFailedBody"));
    }
  };

  const onShareSupportId = async () => {
    try {
      await Share.share({
        message: `${t("settings.deviceId")}: ${license.deviceId}`,
      });
    } catch (e) {
      Alert.alert(t("errors.generic"), e instanceof Error ? e.message : "Please try again.");
    }
  };

  const showLanguagePicker = () => {
    Alert.alert(
      t("settings.language"),
      "",
      [
        ...LANGUAGE_META.map((lang) => ({
          text: `${lang.flag} ${lang.name}`,
          onPress: () => setLanguageCode(lang.code),
        })),
        { text: t("common.cancel"), style: "cancel" as const },
      ]
    );
  };

  const statusLabel =
    license.tier === "pro"
      ? `${t("common.pro")} · ${license.license?.plan ?? ""}`
      : license.tier === "trial"
        ? t("settings.trialDaysLeft", { count: license.trialDaysLeft, total: license.trialDaysTotal })
        : t("dashboard.freePlan");

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 140 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>{t("settings.title")}</Text>

        <TouchableOpacity style={styles.accountCard} onPress={goPaywall} testID="account-card">
          <View style={styles.accountIcon}>
            <Crown color={Colors.gold} size={22} />
          </View>
          <View style={styles.accountTextWrap}>
            <Text style={styles.accountStatus}>{statusLabel}</Text>
            <Text style={styles.accountSub}>
              {license.tier === "pro"
                ? license.license?.expirationDate
                  ? `${t("paywall.renews")} ${new Date(license.license.expirationDate).toLocaleDateString()}`
                  : t("paywall.lifetimeDetail")
                : t("paywall.viewPlans")}
            </Text>
          </View>
          <ChevronRight color={Colors.textOnDarkMuted} size={20} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>{t("settings.customMode")}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t("settings.focusLength")}</Text>
            <Stepper
              value={settings.customFocusMin}
              min={1}
              max={200}
              step={1}
              unit="m"
              locked={!license.hasPro}
              onChange={(v) => update({ customFocusMin: v })}
              onLockedPress={goPaywall}
              testID="custom-focus-stepper"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t("settings.breakLength")}</Text>
            <Stepper
              value={settings.customBreakMin}
              min={1}
              max={120}
              step={1}
              unit="m"
              locked={!license.hasPro}
              onChange={(v) => update({ customBreakMin: v })}
              onLockedPress={goPaywall}
              testID="custom-break-stepper"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowLabelWrap}>
              <Target color={Colors.blue} size={17} />
              <Text style={styles.rowLabel}>{t("settings.dailyGoal")}</Text>
            </View>
            <Stepper
              value={settings.dailyGoalMin}
              min={30}
              max={600}
              step={30}
              unit="m"
              locked={false}
              onChange={(v) => update({ dailyGoalMin: v })}
              onLockedPress={goPaywall}
              testID="daily-goal-stepper"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t("settings.break")} & {t("settings.eyeHealth")}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLabelWrap}>
              <Eye color={Colors.goldDeep} size={17} />
              <Text style={styles.rowLabel}>{t("settings.blink")}</Text>
            </View>
            <Switch
              value={settings.blinkWarningEnabled}
              onValueChange={(v) => update({ blinkWarningEnabled: v })}
              trackColor={{ false: Colors.border, true: Colors.maroon }}
              thumbColor={Colors.white}
              testID="blink-switch"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t("settings.blinkDuration", { seconds: settings.blinkSeconds })}</Text>
            <View style={styles.segment}>
              {([3, 5] as const).map((sec) => (
                <TouchableOpacity
                  key={sec}
                  style={[
                    styles.segmentOption,
                    settings.blinkSeconds === sec && styles.segmentOptionActive,
                  ]}
                  onPress={() => {
                    if (!license.hasPro) {
                      goPaywall();
                      return;
                    }
                    update({ blinkSeconds: sec });
                  }}
                  testID={`blink-${sec}s`}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      settings.blinkSeconds === sec && styles.segmentTextActive,
                    ]}
                  >
                    {sec}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowLabelWrap}>
              <Lock color={Colors.purple} size={17} />
              <Text style={styles.rowLabel}>{t("settings.strictBreaks")}</Text>
            </View>
            <Switch
              value={settings.strictBreaks && license.hasPro}
              onValueChange={(v) => {
                if (!license.hasPro) {
                  goPaywall();
                  return;
                }
                update({ strictBreaks: v });
              }}
              trackColor={{ false: Colors.border, true: Colors.purple }}
              thumbColor={Colors.white}
              testID="strict-switch"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t("settings.notifications")}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLabelWrap}>
              <Bell color={Colors.maroon} size={17} />
              <Text style={styles.rowLabel}>{t("settings.notifications")}</Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(v) => update({ notificationsEnabled: v })}
              trackColor={{ false: Colors.border, true: Colors.maroon }}
              thumbColor={Colors.white}
              testID="notifications-switch"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowLabelWrap}>
              <BellRing color={Colors.blue} size={17} />
              <Text style={styles.rowLabel}>{t("settings.dailyReminder")} (9:00)</Text>
            </View>
            <Switch
              value={settings.dailyReminderEnabled}
              onValueChange={(v) => update({ dailyReminderEnabled: v })}
              trackColor={{ false: Colors.border, true: Colors.blue }}
              thumbColor={Colors.white}
              testID="daily-reminder-switch"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowLabelWrap}>
              <Volume2 color={Colors.goldDeep} size={17} />
              <Text style={styles.rowLabel}>{t("settings.sound")}</Text>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={(v) => update({ soundEnabled: v })}
              trackColor={{ false: Colors.border, true: Colors.goldDeep }}
              thumbColor={Colors.white}
              testID="sound-switch"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowLabelWrap}>
              <Vibrate color={Colors.purple} size={17} />
              <Text style={styles.rowLabel}>{t("settings.vibration")}</Text>
            </View>
            <Switch
              value={settings.vibrationEnabled}
              onValueChange={(v) => update({ vibrationEnabled: v })}
              trackColor={{ false: Colors.border, true: Colors.purple }}
              thumbColor={Colors.white}
              testID="vibration-switch"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t("settings.trialStatus")}</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={showLanguagePicker} testID="language-row">
            <View style={styles.rowLabelWrap}>
              <Globe color={Colors.maroon} size={17} />
              <View>
                <Text style={styles.rowLabel}>{t("settings.language")}</Text>
                <Text style={styles.rowSub}>
                  {LANGUAGE_META.find((l) => l.code === languageCode)?.name ?? "English"}
                </Text>
              </View>
            </View>
            <ChevronRight color={Colors.textSecondary} size={18} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={onRestore} testID="restore-row">
            <View style={styles.rowLabelWrap}>
              <RefreshCcw color={Colors.blue} size={17} />
              <Text style={styles.rowLabel}>{t("settings.restore")}</Text>
            </View>
            <ChevronRight color={Colors.textSecondary} size={18} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={goPaywall} testID="manage-sub-row">
            <View style={styles.rowLabelWrap}>
              <Crown color={Colors.gold} size={17} />
              <Text style={styles.rowLabel}>{t("paywall.title")}</Text>
            </View>
            <ChevronRight color={Colors.textSecondary} size={18} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={onShareSupportId} testID="support-id-row">
            <View style={styles.rowLabelWrap}>
              <Share2 color={Colors.maroon} size={17} />
              <View>
                <Text style={styles.rowLabel}>{t("settings.deviceId")}</Text>
                <Text style={styles.rowSub}>{license.deviceId}</Text>
              </View>
            </View>
            <ChevronRight color={Colors.textSecondary} size={18} />
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>
          NGUMU: Screen Time Control · {t("onboarding.welcome.subtitle")}{"\n"}
          {t("paywall.priceNote")}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 20, paddingBottom: 140 },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: Colors.text,
    marginTop: 12,
    marginBottom: 16,
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.maroon,
    borderRadius: 18,
    padding: 16,
    marginBottom: 8,
  },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(227,168,28,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  accountTextWrap: { flex: 1 },
  accountStatus: { color: Colors.white, fontSize: 16, fontWeight: "800" as const },
  accountSub: { color: Colors.textOnDarkMuted, fontSize: 12, marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginTop: 22,
    marginBottom: 10,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    gap: 12,
  },
  rowLabelWrap: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 },
  rowLabel: { fontSize: 14.5, fontWeight: "600" as const, color: Colors.text },
  rowSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.border },
  stepper: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepperButton: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: Colors.maroonSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.text,
    minWidth: 44,
    textAlign: "center",
  },
  segment: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 9,
    padding: 3,
  },
  segmentOption: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 7 },
  segmentOptionActive: { backgroundColor: Colors.maroon },
  segmentText: { fontSize: 13, fontWeight: "700" as const, color: Colors.textSecondary },
  segmentTextActive: { color: Colors.white },
  footerNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 28,
    lineHeight: 18,
  },
});
