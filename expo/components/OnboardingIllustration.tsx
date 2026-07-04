import { Eye, Gift, Play, Shield, Sparkles, Timer, Zap } from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/colors";

export type IllustrationScene = "welcome" | "mode" | "eyeHealth" | "blocking" | "permissions" | "trial" | "start";

interface OnboardingIllustrationProps {
  scene: IllustrationScene;
  size?: number;
}

/**
 * Cartoon-style vector illustration scenes for onboarding.
 * Built from simple shapes and icons so it looks friendly and welcoming
 * without requiring external image assets.
 */
export default function OnboardingIllustration({ scene, size = 220 }: OnboardingIllustrationProps) {
  const ringSize = size;
  const ballSize = size * 0.52;

  const commonRing = (
    <View
      style={[
        styles.ring,
        { width: ringSize, height: ringSize, borderRadius: ringSize / 2 },
      ]}
    />
  );

  const centerBall = (backgroundColor: string, icon: React.ReactNode) => (
    <View
      style={[
        styles.centerBall,
        {
          width: ballSize,
          height: ballSize,
          borderRadius: ballSize / 2,
          backgroundColor,
        },
      ]}
    >
      {icon}
    </View>
  );

  switch (scene) {
    case "welcome":
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          {commonRing}
          <View style={[styles.cloud, { top: size * 0.12, left: size * 0.12 }]}>
            <Sparkles color={Colors.gold} size={size * 0.16} />
          </View>
          <View style={[styles.cloud, { top: size * 0.22, right: size * 0.18 }]}>
            <Zap color={Colors.gold} size={size * 0.14} />
          </View>
          {centerBall(
            Colors.maroon,
            <Eye color={Colors.gold} size={size * 0.28} />
          )}
          <View style={[styles.face, { bottom: size * 0.22 }]}>
            <View style={[styles.eyeDot, { left: size * 0.06 }]} />
            <View style={[styles.eyeDot, { right: size * 0.06 }]} />
            <View
              style={[
                styles.smile,
                {
                  width: size * 0.12,
                  borderBottomLeftRadius: size * 0.06,
                  borderBottomRightRadius: size * 0.06,
                },
              ]}
            />
          </View>
        </View>
      );

    case "mode":
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          {commonRing}
          {centerBall(
            Colors.blue,
            <Timer color={Colors.white} size={size * 0.26} />
          )}
          <View style={[styles.bubble, { top: size * 0.12, left: size * 0.08, backgroundColor: Colors.goldSoft }]}>
            <Text style={styles.bubbleText}>25</Text>
          </View>
          <View style={[styles.bubble, { top: size * 0.18, right: size * 0.06, backgroundColor: Colors.purpleSoft }]}>
            <Text style={styles.bubbleText}>52</Text>
          </View>
          <View style={[styles.bubble, { bottom: size * 0.16, left: size * 0.12, backgroundColor: Colors.successSoft }]}>
            <Text style={styles.bubbleText}>20</Text>
          </View>
          <View style={[styles.bubble, { bottom: size * 0.22, right: size * 0.14, backgroundColor: Colors.dangerSoft }]}>
            <Text style={styles.bubbleText}>90</Text>
          </View>
        </View>
      );

    case "eyeHealth":
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          {commonRing}
          {centerBall(
            Colors.goldSoft,
            <Eye color={Colors.goldDeep} size={size * 0.28} />
          )}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const distance = size * 0.36;
            const left = size / 2 + distance * Math.sin(rad) - 2;
            const top = size / 2 - distance * Math.cos(rad) - 7;
            return (
              <View
                key={i}
                style={[
                  styles.ray,
                  {
                    left,
                    top,
                    transform: [{ rotate: `${deg}deg` }],
                  },
                ]}
              />
            );
          })}
        </View>
      );

    case "blocking":
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          {commonRing}
          {centerBall(
            Colors.maroon,
            <Shield color={Colors.gold} size={size * 0.28} />
          )}
          <View style={[styles.miniApp, { top: size * 0.16, left: size * 0.14, backgroundColor: Colors.blue }]}>
            <Text style={styles.miniAppText}>in</Text>
          </View>
          <View style={[styles.miniApp, { top: size * 0.2, right: size * 0.12, backgroundColor: Colors.purple }]}>
            <Text style={styles.miniAppText}>X</Text>
          </View>
          <View style={[styles.miniApp, { bottom: size * 0.18, left: size * 0.2, backgroundColor: Colors.danger }]}>
            <Text style={styles.miniAppText}>TK</Text>
          </View>
          <View style={[styles.miniApp, { bottom: size * 0.24, right: size * 0.18, backgroundColor: Colors.success }]}>
            <Text style={styles.miniAppText}>IG</Text>
          </View>
        </View>
      );

    case "permissions":
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          {commonRing}
          {centerBall(
            Colors.success,
            <Sparkles color={Colors.white} size={size * 0.26} />
          )}
          <View style={[styles.checkItem, { top: size * 0.22, left: size * 0.1 }]}>
            <View style={styles.checkDot} />
          </View>
          <View style={[styles.checkItem, { top: size * 0.42, right: size * 0.1 }]}>
            <View style={styles.checkDot} />
          </View>
          <View style={[styles.checkItem, { bottom: size * 0.22, left: size * 0.16 }]}>
            <View style={styles.checkDot} />
          </View>
        </View>
      );

    case "trial":
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          {commonRing}
          <View
            style={[
              styles.giftBox,
              {
                width: size * 0.54,
                height: size * 0.44,
                borderRadius: size * 0.06,
              },
            ]}
          >
            <View style={[styles.giftRibbon, { width: size * 0.1, height: size * 0.44 }]} />
            <View style={[styles.giftBow, { width: size * 0.22, height: size * 0.14, borderRadius: size * 0.07 }]} />
          </View>
          <View style={{ position: "absolute", bottom: size * 0.18 }}>
            <Gift color={Colors.gold} size={size * 0.24} />
          </View>
        </View>
      );

    case "start":
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          {commonRing}
          {centerBall(
            Colors.gold,
            <Play color={Colors.maroonDeep} size={size * 0.26} fill={Colors.maroonDeep} />
          )}
          <View style={[styles.confetti, { top: size * 0.1, left: size * 0.2, backgroundColor: Colors.blue }]} />
          <View style={[styles.confetti, { top: size * 0.16, right: size * 0.22, backgroundColor: Colors.purple }]} />
          <View style={[styles.confetti, { bottom: size * 0.2, left: size * 0.18, backgroundColor: Colors.success }]} />
          <View style={[styles.confetti, { bottom: size * 0.14, right: size * 0.2, backgroundColor: Colors.danger }]} />
        </View>
      );

    default:
      return null;
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "rgba(227,168,28,0.25)",
    backgroundColor: "rgba(227,168,28,0.06)",
  },
  centerBall: {
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 6 },
    }) ?? {}),
  },
  cloud: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  face: {
    position: "absolute",
    width: 80,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  eyeDot: {
    position: "absolute",
    top: 0,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gold,
  },
  smile: {
    position: "absolute",
    bottom: 0,
    height: 6,
    borderBottomWidth: 2,
    borderColor: Colors.gold,
  },
  bubble: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  bubbleText: {
    fontSize: 14,
    fontWeight: "800" as const,
    color: Colors.text,
  },
  ray: {
    position: "absolute",
    width: 4,
    height: 14,
    borderRadius: 2,
    backgroundColor: Colors.gold,
    opacity: 0.6,
  },
  miniApp: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  miniAppText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: "800" as const,
  },
  checkItem: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.success,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  checkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
  giftBox: {
    backgroundColor: Colors.maroonLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  giftRibbon: {
    position: "absolute",
    backgroundColor: Colors.gold,
  },
  giftBow: {
    position: "absolute",
    top: -10,
    backgroundColor: Colors.gold,
  },
  confetti: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 3,
  },
});
