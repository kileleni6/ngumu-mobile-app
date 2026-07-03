import React, { useCallback, useEffect, useRef } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import Colors from "@/constants/colors";

const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;

interface PickerWheelProps {
  values: number[];
  selected: number;
  label: string;
  unit?: string;
  onValueChange: (value: number) => void;
  accentColor?: string;
}

/**
 * iOS-style scroll picker wheel with a highlighted selection band and
 * gradient fade masks. Works on both iOS and Android using a centered
 * ScrollView with snapping.
 */
export default function PickerWheel({
  values,
  selected,
  label,
  unit = "",
  onValueChange,
  accentColor = Colors.maroon,
}: PickerWheelProps) {
  const scrollRef = useRef<ScrollView>(null);
  const selectedIndex = values.indexOf(selected);
  const safeIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const scrollToIndex = useCallback((index: number, animated: boolean) => {
    scrollRef.current?.scrollTo({
      y: index * ITEM_HEIGHT,
      animated,
    });
  }, []);

  useEffect(() => {
    // Re-center when selected changes externally.
    const t = setTimeout(() => scrollToIndex(safeIndex, false), 50);
    return () => clearTimeout(t);
  }, [safeIndex, scrollToIndex]);

  const handleScrollEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      const y = e.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(values.length - 1, index));
      if (values[clamped] !== selected) {
        onValueChange(values[clamped]);
      }
    },
    [values, selected, onValueChange]
  );

  const topPad = (PICKER_HEIGHT - ITEM_HEIGHT) / 2;

  return (
    <View style={styles.column}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerBox}>
        {/* Highlight band */}
        <View
          style={styles.highlightBand}
          pointerEvents="none"
        />

        {/* Top fade */}
        <View style={[styles.fadeMask, styles.fadeTop]} pointerEvents="none" />
        {/* Bottom fade */}
        <View style={[styles.fadeMask, styles.fadeBottom]} pointerEvents="none" />

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={handleScrollEnd}
          contentContainerStyle={{
            paddingTop: topPad,
            paddingBottom: topPad,
          }}
        >
          {values.map((val, idx) => {
            const isSelected = val === selected;
            const distance = Math.abs(idx - safeIndex);
            return (
              <View key={val} style={styles.item}>
                <Text
                  style={[
                    styles.itemText,
                    !isSelected && styles.itemTextMuted,
                    distance >= 2 && styles.itemTextFaint,
                    isSelected && { color: accentColor, fontSize: 30 },
                  ]}
                >
                  {val}
                  {unit}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { flex: 1, flexDirection: "column" },
  label: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: "800" as const,
    color: "#A1A1AA",
    textTransform: "uppercase" as const,
    letterSpacing: 2,
    marginBottom: 12,
  },
  pickerBox: {
    height: PICKER_HEIGHT,
    backgroundColor: "#FAFAF9",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F4F4F5",
    overflow: "hidden",
  },
  highlightBand: {
    position: "absolute" as const,
    top: (PICKER_HEIGHT - ITEM_HEIGHT) / 2,
    left: 12,
    right: 12,
    height: ITEM_HEIGHT,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F4F4F5",
    zIndex: 10,
    ...(Platform.select<ViewStyle>({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }) ?? {}),
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#71717A",
  },
  itemTextMuted: {
    color: "#A1A1AA",
  },
  itemTextFaint: {
    color: "#D4D4D8",
    fontSize: 18,
  },
  fadeMask: {
    position: "absolute" as const,
    left: 0,
    right: 0,
    height: 56,
    zIndex: 20,
  },
  fadeTop: {
    top: 0,
    backgroundColor: "#FAFAF9",
  },
  fadeBottom: {
    bottom: 0,
    backgroundColor: "#FAFAF9",
  },
});
