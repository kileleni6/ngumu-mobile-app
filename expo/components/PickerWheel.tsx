import React, { useCallback, useEffect, useRef, useState } from "react";
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
const BAND_HEIGHT = ITEM_HEIGHT;
const BAND_TOP = (PICKER_HEIGHT - BAND_HEIGHT) / 2;

interface PickerWheelProps {
  values: number[];
  selected: number;
  label: string;
  unit?: string;
  onValueChange: (value: number) => void;
  accentColor?: string;
}

/**
 * Stable iOS-style scroll picker wheel.
 * Render order is critical: ScrollView first, then the absolute highlight band
 * and fade masks on top so they are not hidden by the scrolling items.
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
  const [layoutReady, setLayoutReady] = useState(false);
  const selectedIndex = values.indexOf(selected);
  const safeIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const scrollToIndex = useCallback((index: number, animated: boolean) => {
    const y = Math.max(0, Math.min(values.length - 1, index)) * ITEM_HEIGHT;
    scrollRef.current?.scrollTo({ y, animated });
  }, [values.length]);

  // Center the selected value whenever the sheet opens or the value changes externally.
  useEffect(() => {
    if (!layoutReady) return;
    const t = setTimeout(() => scrollToIndex(safeIndex, false), 50);
    return () => clearTimeout(t);
  }, [safeIndex, layoutReady, scrollToIndex]);

  const handleMomentumScrollEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      const y = e.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(values.length - 1, index));
      const next = values[clamped];
      if (next !== selected) {
        onValueChange(next);
      }
    },
    [values, selected, onValueChange]
  );

  const handleScrollEndDrag = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      const y = e.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(values.length - 1, index));
      const next = values[clamped];
      if (next !== selected) {
        onValueChange(next);
      }
      scrollToIndex(clamped, true);
    },
    [values, selected, onValueChange, scrollToIndex]
  );

  const topPad = BAND_TOP;

  return (
    <View style={styles.column}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={styles.pickerBox}
        onLayout={() => setLayoutReady(true)}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate={0.92}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          onScrollEndDrag={handleScrollEndDrag}
          contentContainerStyle={{
            paddingTop: topPad,
            paddingBottom: topPad,
          }}
        >
          {values.map((val) => {
            const isSelected = val === selected;
            const distance = Math.abs(val - selected);
            return (
              <View key={val} style={styles.item}>
                <Text
                  style={[
                    styles.itemText,
                    !isSelected && styles.itemTextMuted,
                    distance >= 2 && styles.itemTextFaint,
                    isSelected && { color: accentColor, fontSize: 30 },
                  ]}
                  numberOfLines={1}
                >
                  {val}
                  {unit}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Highlight band rendered ON TOP of the scroll content */}
        <View
          style={[
            styles.highlightBand,
            { borderColor: accentColor },
          ]}
          pointerEvents="none"
        />

        {/* Top fade mask */}
        <View
          style={[styles.fadeMask, styles.fadeTop]}
          pointerEvents="none"
        />
        {/* Bottom fade mask */}
        <View
          style={[styles.fadeMask, styles.fadeBottom]}
          pointerEvents="none"
        />
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
  item: {
    height: ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#71717A",
    fontVariant: ["tabular-nums"],
  },
  itemTextMuted: {
    color: "#A1A1AA",
  },
  itemTextFaint: {
    color: "#D4D4D8",
    fontSize: 18,
  },
  highlightBand: {
    position: "absolute" as const,
    top: BAND_TOP,
    left: 10,
    right: 10,
    height: BAND_HEIGHT,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.maroon,
    zIndex: 10,
    ...(Platform.select<ViewStyle>({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }) ?? {}),
  },
  fadeMask: {
    position: "absolute" as const,
    left: 0,
    right: 0,
    height: BAND_TOP + ITEM_HEIGHT / 2,
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
