import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Eye, GlassWater, PersonStanding, SkipForward } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BlinkOverlay from "@/components/BlinkOverlay";
import TimerRing from "@/components/TimerRing";
import Colors from "@/constants/colors";
import { useLicense } from "@/providers/LicenseProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { useTimer } from "@/providers/TimerProvider";
import { formatClock } from "@/utils/time";

export default function BreakScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const timer = useTimer();
  const { settings } = useSettings();
  const { hasPro } = useLicense();
  const [showBlink, setShowBlink] = useState<boolean>(true);

  // Play the eyelid blink animation once when the break begins.
  useEffect(() => {
    const t = setTimeout(() => setShowBlink(false), 2600);
    return () => clearTimeout(t);
  }, []);

  // Leave the screen when the break finishes or is skipped.
  useEffect(() => {
    if (timer.phase !== "break") {
      if (router.canGoBack()) router.back();
    }
  }, [timer.phase, router]);

  const strict = settings.strictBreaks && hasPro;

  return (
    <LinearGradient
      colors={[Colors.maroonDeep, Colors.maroon, Colors.maroonDark]}
      style={styles.container}
    >
      <View style={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.kicker}>BREAK TIME</Text>
        <Text style={styles.title}>
          {timer.mode.eyeHealth ? "Rest your eyes" : "Step away for a moment"}
        </Text>

        <View style={styles.ringWrap}>
          <TimerRing
            size={230}
            strokeWidth={12}
            progress={timer.progress}
            color={Colors.gold}
            trackColor="rgba(255,255,255,0.12)"
          >
            <Text style={styles.clock} testID="break-clock">
              {formatClock(timer.remainingMs)}
            </Text>
            <Text style={styles.clockSub}>until focus resumes</Text>
          </TimerRing>
        </View>

        <View style={styles.tips}>
          <View style={styles.tipRow}>
            <Eye color={Colors.gold} size={20} />
            <Text style={styles.tipText}>
              Look at something 20 feet (6 m) away for 20 seconds
            </Text>
          </View>
          {!timer.mode.eyeHealth && (
            <>
              <View style={styles.tipRow}>
                <PersonStanding color={Colors.gold} size={20} />
                <Text style={styles.tipText}>Stand up, stretch your neck and shoulders</Text>
              </View>
              <View style={styles.tipRow}>
                <GlassWater color={Colors.gold} size={20} />
                <Text style={styles.tipText}>Drink some water and breathe deeply</Text>
              </View>
            </>
          )}
        </View>

        {strict ? (
          <View style={styles.strictBadge}>
            <Text style={styles.strictText}>Strict break mode — hang in there</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.skipButton} onPress={timer.skipBreak} testID="skip-break">
            <SkipForward color={Colors.textOnDarkMuted} size={16} />
            <Text style={styles.skipText}>Skip break</Text>
          </TouchableOpacity>
        )}
      </View>

      <BlinkOverlay visible={showBlink} blinks={2} message="Blink slowly..." />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  kicker: {
    color: Colors.gold,
    fontSize: 13,
    fontWeight: "800" as const,
    letterSpacing: 4,
  },
  title: {
    color: Colors.textOnDark,
    fontSize: 28,
    fontWeight: "800" as const,
    textAlign: "center",
    marginTop: -40,
  },
  ringWrap: { alignItems: "center" },
  clock: {
    color: Colors.white,
    fontSize: 48,
    fontWeight: "800" as const,
    fontVariant: ["tabular-nums"],
  },
  clockSub: { color: Colors.textOnDarkMuted, fontSize: 13, marginTop: 2 },
  tips: { gap: 14, alignSelf: "stretch", paddingHorizontal: 8 },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  tipText: { color: Colors.textOnDark, fontSize: 15, flex: 1, lineHeight: 21 },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipText: { color: Colors.textOnDarkMuted, fontSize: 15, fontWeight: "600" as const },
  strictBadge: {
    backgroundColor: "rgba(227,168,28,0.15)",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  strictText: { color: Colors.gold, fontSize: 14, fontWeight: "700" as const },
});
