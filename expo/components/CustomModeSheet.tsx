import { X, Eye, Play } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PickerWheel from "@/components/PickerWheel";
import Colors from "@/constants/colors";
import { useLicense } from "@/providers/LicenseProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { useTimer } from "@/providers/TimerProvider";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const FOCUS_VALUES = Array.from({ length: 36 }, (_, i) => (i + 5) * 5); // 5–180 step 5
const BREAK_VALUES = Array.from({ length: 60 }, (_, i) => i + 1); // 1–60 step 1

interface CustomModeSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Bottom sheet modal for configuring Custom mode durations with picker wheels.
 * Matches the provided design: dark overlay, drag handle, segmented header,
 * dual picker wheels, 20-20-20 eye health toggle, and "Save & Start" CTA.
 */
export default function CustomModeSheet({ visible, onClose }: CustomModeSheetProps) {
  const insets = useSafeAreaInsets();
  const { settings, update } = useSettings();
  const license = useLicense();
  const timer = useTimer();

  const [tab, setTab] = useState<"presets" | "custom">("custom");
  const [focusMin, setFocusMin] = useState<number>(settings.customFocusMin);
  const [breakMin, setBreakMin] = useState<number>(settings.customBreakMin);
  const [eyeHealth, setEyeHealth] = useState<boolean>(settings.customEyeHealth);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Sync local state when sheet opens.
  useEffect(() => {
    if (visible) {
      setFocusMin(settings.customFocusMin);
      setBreakMin(settings.customBreakMin);
      setEyeHealth(settings.customEyeHealth);
      setTab("custom");
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 12,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, settings.customFocusMin, settings.customBreakMin, settings.customEyeHealth, fadeAnim, slideAnim]);

  // Android back button closes sheet.
  useEffect(() => {
    if (!visible) return;
    const handler = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => handler.remove();
  }, [visible, onClose]);

  const locked = !license.hasPro;

  const handleSaveAndStart = useCallback(() => {
    if (locked) return;
    update({ customFocusMin: focusMin, customBreakMin: breakMin, customEyeHealth: eyeHealth });
    // Select custom mode and start focus after a brief delay for settings to propagate.
    setTimeout(() => {
      timer.setModeId("custom");
      setTimeout(() => timer.startFocus(), 80);
    }, 60);
    onClose();
  }, [locked, focusMin, breakMin, eyeHealth, update, timer, onClose]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[styles.backdrop, { opacity: fadeAnim }]}
          onTouchStart={onClose}
        />

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + 16,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Drag handle */}
          <View style={styles.dragHandleWrap}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Focus Mode</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={8}>
              <X color={Colors.textSecondary} size={18} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Segmented control */}
          <View style={styles.segmentWrap}>
            <View style={styles.segmentContainer}>
              <TouchableOpacity
                style={[styles.segmentOption, tab === "presets" && styles.segmentOptionInactive]}
                onPress={() => setTab("presets")}
              >
                <Text style={[styles.segmentText, tab === "presets" ? styles.segmentTextActive : styles.segmentTextInactive]}>
                  Presets
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentOption, tab === "custom" && styles.segmentOptionActiveCustom]}
                onPress={() => setTab("custom")}
              >
                <Text style={[styles.segmentText, tab === "custom" ? styles.segmentTextWhite : styles.segmentTextInactive]}>
                  Custom
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {tab === "presets" ? (
            <ScrollView style={styles.presetsScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.presetsHint}>
                Use the mode chips on the Focus screen to pick a preset. Switch to{" "}
                <Text style={styles.presetsHintBold}>Custom</Text> to fine-tune durations.
              </Text>
            </ScrollView>
          ) : (
            <>
              {locked && (
                <View style={styles.lockedBanner}>
                  <Text style={styles.lockedBannerText}>
                    Custom mode is a Pro feature. You{"\u2019"}re on a free plan.
                  </Text>
                </View>
              )}

              {/* Picker wheels */}
              <View style={styles.pickersRow}>
                <View style={styles.pickerColumn}>
                  <PickerWheel
                    label="Focus (Min)"
                    values={FOCUS_VALUES}
                    selected={focusMin}
                    onValueChange={setFocusMin}
                    accentColor={Colors.maroon}
                  />
                </View>
                <View style={styles.pickerColumn}>
                  <PickerWheel
                    label="Break (Min)"
                    values={BREAK_VALUES}
                    selected={breakMin}
                    onValueChange={setBreakMin}
                    accentColor={Colors.maroon}
                  />
                </View>
              </View>

              {/* Eye health toggle */}
              <View style={styles.toggleCard}>
                <View style={styles.toggleLeft}>
                  <View style={styles.toggleIconWrap}>
                    <Eye color={Colors.maroon} size={20} />
                  </View>
                  <View style={styles.toggleTextWrap}>
                    <Text style={styles.toggleTitle}>20/20/20 Rule</Text>
                    <Text style={styles.toggleSub}>Look 20ft away for 20s every 20m</Text>
                  </View>
                </View>
                <Switch
                  value={eyeHealth}
                  onValueChange={setEyeHealth}
                  trackColor={{ false: Colors.border, true: Colors.maroon }}
                  thumbColor={Colors.white}
                  disabled={locked}
                />
              </View>
            </>
          )}

          {/* Primary CTA */}
          <View style={styles.ctaWrap}>
            <TouchableOpacity
              style={[styles.saveButton, locked && styles.saveButtonLocked]}
              onPress={handleSaveAndStart}
              disabled={locked}
              activeOpacity={0.92}
            >
              <Play color={Colors.white} size={18} fill={Colors.white} />
              <Text style={styles.saveButtonText}>
                {locked ? "Pro Required" : "Save & Start"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(24, 24, 27, 0.45)",
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 8,
    ...(Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: -8 },
      },
      android: { elevation: 16 },
    }) ?? {}),
  },
  dragHandleWrap: {
    width: "100%" as const,
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 16,
  },
  dragHandle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E4E4E7",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: "#18181B",
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "#F4F4F5",
    alignItems: "center",
    justifyContent: "center",
  },
  segmentWrap: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  segmentContainer: {
    flexDirection: "row",
    padding: 4,
    backgroundColor: "rgba(244, 244, 245, 0.8)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(228, 228, 231, 0.5)",
  },
  segmentOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  segmentOptionInactive: {},
  segmentOptionActiveCustom: {
    backgroundColor: Colors.maroon,
    ...(Platform.select({
      ios: { shadowColor: Colors.maroon, shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
      android: { elevation: 2 },
    }) ?? {}),
  },
  segmentText: {
    fontSize: 15,
  },
  segmentTextActive: {
    fontWeight: "600" as const,
    color: Colors.maroon,
  },
  segmentTextInactive: {
    fontWeight: "500" as const,
    color: "#A1A1AA",
  },
  segmentTextWhite: {
    fontWeight: "700" as const,
    color: Colors.white,
  },
  lockedBanner: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: Colors.maroonSoft,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  lockedBannerText: {
    fontSize: 13,
    color: Colors.maroon,
    fontWeight: "600" as const,
  },
  presetsScroll: {
    paddingHorizontal: 24,
    maxHeight: 240,
  },
  presetsHint: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  presetsHintBold: {
    fontWeight: "700" as const,
    color: Colors.maroon,
  },
  pickersRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 24,
  },
  pickerColumn: { flex: 1 },
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    ...(Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }) ?? {}),
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flexShrink: 1,
  },
  toggleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(92, 10, 30, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleTextWrap: {
    flexShrink: 1,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#18181B",
  },
  toggleSub: {
    fontSize: 13,
    color: "#71717A",
    marginTop: 2,
  },
  ctaWrap: {
    paddingHorizontal: 24,
    marginTop: "auto" as const,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: Colors.maroon,
  },
  saveButtonLocked: {
    opacity: 0.4,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.white,
  },
});
