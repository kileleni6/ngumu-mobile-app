import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import Colors from "@/constants/colors";

interface BlinkOverlayProps {
  visible: boolean;
  /** How many times the eyelids close (1-2). */
  blinks?: number;
  message?: string;
}

/**
 * Full-screen "eyelids" animation: shaded lids sweep in from the top and bottom
 * and close 1-2 times, mimicking a blink before a break starts.
 */
export default function BlinkOverlay({
  visible,
  blinks = 2,
  message = "Blink... break is coming",
}: BlinkOverlayProps) {
  const { height } = useWindowDimensions();
  const lid = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      lid.setValue(0);
      return;
    }
    const closeOnce = [
      Animated.timing(lid, { toValue: 1, duration: 550, useNativeDriver: false }),
      Animated.timing(lid, { toValue: 0.12, duration: 450, useNativeDriver: false }),
    ];
    const sequence: Animated.CompositeAnimation[] = [];
    for (let i = 0; i < Math.max(1, blinks); i++) {
      sequence.push(...closeOnce);
    }
    sequence.push(Animated.timing(lid, { toValue: 1, duration: 600, useNativeDriver: false }));
    const anim = Animated.sequence(sequence);
    anim.start();
    return () => anim.stop();
  }, [visible, blinks, lid]);

  if (!visible) return null;

  const lidHeight = lid.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height / 2 + 2],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" testID="blink-overlay">
      <Animated.View style={[styles.lid, styles.topLid, { height: lidHeight }]} />
      <Animated.View style={[styles.lid, styles.bottomLid, { height: lidHeight }]} />
      <View style={styles.messageWrap}>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lid: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: Colors.maroonDeep,
  },
  topLid: {
    top: 0,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
  },
  bottomLid: {
    bottom: 0,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  messageWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    color: Colors.gold,
    fontSize: 18,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
});
