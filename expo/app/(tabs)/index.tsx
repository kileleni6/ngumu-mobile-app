import { useRouter } from "expo-router";
import { Crown, Eye, Pause, Play, RotateCcw, ShieldBan, ShieldCheck, Zap } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BlinkOverlay from "@/components/BlinkOverlay";
import CustomModeSheet from "@/components/CustomModeSheet";
import TimerRing from "@/components/TimerRing";
import Colors from "@/constants/colors";
import { MODES } from "@/constants/modes";
import { useAnalytics } from "@/providers/AnalyticsProvider";
import { useBlocking } from "@/providers/BlockingProvider";
import { useLicense } from "@/providers/LicenseProvider";
import { useTimer } from "@/providers/TimerProvider";
import { formatClock, formatMinutes } from "@/utils/time";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const timer = useTimer();
  const { today } = useAnalytics();
  const license = useLicense();
  const blocking = useBlocking();
  const [customSheetVisible, setCustomSheetVisible] = useState<boolean>(false);

  const phaseLabel = useMemo(() => {
    if (timer.phase === "focus") return timer.running ? "Focusing" : "Paused";
    if (timer.phase === "break") return "On break";
    return "Ready to focus";
  }, [timer.phase, timer.running]);

  const blockingActive =
    timer.phase === "focus" &&
    license.hasPro &&
    (blocking.appBlockingEnabled || blocking.siteBlockingEnabled);

  const blockedCount = blocking.blockedAppIds.length + blocking.sites.length;

  const trialPill = useMemo(() => {
    if (license.tier === "pro") return "PRO";
    if (license.tier === "trial") return `Trial · ${license.trialDaysLeft}d left`;
    return "Free plan";
  }, [license.tier, license.trialDaysLeft]);

  const onPrimaryPress = () => {
    if (timer.phase === "idle") {
      timer.startFocus();
    } else if (timer.running) {
      timer.pause();
    } else {
      timer.resume();
    }
  };

  const primaryLabel =
    timer.phase === "idle" ? "Start Focus" : timer.running ? "Pause" : "Resume";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Eye color={Colors.gold} size={18} />
            </View>
            <Text style={styles.brandName}>NGUMU</Text>
          </View>
          <TouchableOpacity
            style={[styles.trialPill, license.tier === "pro" && styles.trialPillPro]}
            onPress={() => router.push("/paywall")}
            testID="trial-pill"
          >
            <Crown color={license.tier === "pro" ? Colors.maroonDeep : Colors.gold} size={13} />
            <Text
              style={[styles.trialPillText, license.tier === "pro" && styles.trialPillTextPro]}
            >
              {trialPill}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timerSection}>
          <TimerRing
            size={264}
            strokeWidth={14}
            progress={timer.phase === "idle" ? 0 : timer.progress}
            color={timer.phase === "break" ? Colors.gold : timer.mode.accent}
          >
            <Text style={styles.phaseLabel}>{phaseLabel}</Text>
            <Text style={styles.clock} testID="timer-clock">
              {formatClock(timer.remainingMs)}
            </Text>
            <View style={styles.modeBadge}>
              {timer.mode.eyeHealth ? (
                <Eye color={Colors.goldDeep} size={13} />
              ) : (
                <Zap color={timer.mode.accent} size={13} />
              )}
              <Text style={[styles.modeBadgeText, { color: timer.mode.accent }]}>
                {timer.mode.name}
              </Text>
            </View>
          </TimerRing>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modesRow}
          style={styles.modesScroll}
        >
          {MODES.map((m) => {
            const selected = timer.modeId === m.id;
            const locked = m.pro && !license.hasPro;
            const disabled = timer.phase !== "idle";
            return (
              <TouchableOpacity
                key={m.id}
                testID={`mode-${m.id}`}
                style={[
                  styles.modeChip,
                  selected && { backgroundColor: m.accent, borderColor: m.accent },
                  disabled && !selected && styles.modeChipDisabled,
                ]}
                onPress={() => {
                  if (disabled) return;
                  if (m.id === "custom") {
                    if (locked) {
                      router.push("/paywall");
                      return;
                    }
                    setCustomSheetVisible(true);
                    return;
                  }
                  if (locked) {
                    router.push("/paywall");
                    return;
                  }
                  timer.setModeId(m.id);
                }}
              >
                <Text style={[styles.modeChipName, selected && styles.modeChipNameSelected]}>
                  {m.name}
                  {locked ? "  🔒" : ""}
                </Text>
                <Text
                  style={[styles.modeChipTagline, selected && styles.modeChipTaglineSelected]}
                >
                  {m.tagline}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={timer.reset}
            disabled={timer.phase === "idle"}
            testID="reset-button"
          >
            <RotateCcw
              color={timer.phase === "idle" ? Colors.border : Colors.textSecondary}
              size={22}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onPrimaryPress}
            testID="primary-button"
          >
            {timer.running ? (
              <Pause color={Colors.white} size={26} fill={Colors.white} />
            ) : (
              <Play color={Colors.white} size={26} fill={Colors.white} />
            )}
            <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
          </TouchableOpacity>
          <View style={styles.resetButton} />
        </View>

        <View style={styles.cardsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statCardLabel}>Today&apos;s focus</Text>
            <Text style={styles.statCardValue}>{formatMinutes(today.focusMinutes)}</Text>
            <Text style={styles.statCardSub}>
              {today.sessions} session{today.sessions === 1 ? "" : "s"} completed
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statCardLabel}>Breaks</Text>
            <Text style={styles.statCardValue}>{today.breaksTaken}</Text>
            <Text style={styles.statCardSub}>{today.breaksSkipped} skipped</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.blockingCard, blockingActive && styles.blockingCardActive]}
          onPress={() => router.push("/(tabs)/blocking")}
          testID="blocking-card"
        >
          <View
            style={[styles.blockingIcon, blockingActive && styles.blockingIconActive]}
          >
            {blockingActive ? (
              <ShieldCheck color={Colors.white} size={20} />
            ) : (
              <ShieldBan color={Colors.textSecondary} size={20} />
            )}
          </View>
          <View style={styles.blockingTextWrap}>
            <Text style={[styles.blockingTitle, blockingActive && styles.blockingTitleActive]}>
              {blockingActive ? "Distraction shield active" : "Distraction shield off"}
            </Text>
            <Text
              style={[styles.blockingSub, blockingActive && styles.blockingSubActive]}
              numberOfLines={1}
            >
              {blockedCount > 0
                ? `${blocking.blockedAppIds.length} apps · ${blocking.sites.length} sites on your list`
                : "Set up your app & website blocklist"}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <BlinkOverlay visible={timer.blinkImminent} blinks={2} />

      <CustomModeSheet
        visible={customSheetVisible}
        onClose={() => setCustomSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 120 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.maroon,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: Colors.maroon,
    letterSpacing: 2,
  },
  trialPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.maroon,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  trialPillPro: { backgroundColor: Colors.gold },
  trialPillText: { color: Colors.goldSoft, fontSize: 12, fontWeight: "700" as const },
  trialPillTextPro: { color: Colors.maroonDeep },
  timerSection: { alignItems: "center", marginTop: 20 },
  phaseLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 1.5,
  },
  clock: {
    fontSize: 58,
    fontWeight: "800" as const,
    color: Colors.text,
    fontVariant: ["tabular-nums"],
    marginVertical: 2,
  },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  modeBadgeText: { fontSize: 12, fontWeight: "700" as const },
  modesScroll: { marginTop: 24 },
  modesRow: { paddingHorizontal: 20, gap: 10 },
  modeChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 130,
  },
  modeChipDisabled: { opacity: 0.5 },
  modeChipName: { fontSize: 14, fontWeight: "700" as const, color: Colors.text },
  modeChipNameSelected: { color: Colors.white },
  modeChipTagline: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  modeChipTaglineSelected: { color: "rgba(255,255,255,0.8)" },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginTop: 26,
    paddingHorizontal: 20,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.maroon,
    paddingHorizontal: 34,
    paddingVertical: 17,
    borderRadius: 999,
    shadowColor: Colors.maroon,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  primaryButtonText: { color: Colors.white, fontSize: 17, fontWeight: "800" as const },
  resetButton: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cardsRow: { flexDirection: "row", gap: 12, paddingHorizontal: 20, marginTop: 26 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statCardLabel: { fontSize: 12, fontWeight: "600" as const, color: Colors.textSecondary },
  statCardValue: {
    fontSize: 26,
    fontWeight: "800" as const,
    color: Colors.maroon,
    marginTop: 4,
  },
  statCardSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  blockingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  blockingCardActive: { backgroundColor: Colors.maroon, borderColor: Colors.maroon },
  blockingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  blockingIconActive: { backgroundColor: Colors.maroonLight },
  blockingTextWrap: { flex: 1 },
  blockingTitle: { fontSize: 15, fontWeight: "700" as const, color: Colors.text },
  blockingTitleActive: { color: Colors.white },
  blockingSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  blockingSubActive: { color: Colors.textOnDarkMuted },
});
