import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  Bell,
  Check,
  Eye,
  ShieldBan,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useOnboarding } from "@/providers/OnboardingProvider";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Slide {
  icon: React.ReactNode;
  title: string;
  body: string;
  accent: string;
}

const SLIDES: Slide[] = [
  {
    icon: <Sparkles color={Colors.gold} size={36} />,
    title: "Welcome to NGUMU",
    body: "Focus better, protect your eyes, and take control of your screen time. Your first 40 days are on us — full Pro access, no card needed.",
    accent: Colors.maroon,
  },
  {
    icon: <Timer color={Colors.gold} size={36} />,
    title: "Focus that works for you",
    body: "Choose Pomodoro, 52/17, 90/20, or 20-20-20 eye-health mode. NGUMU times your focus blocks and reminds you to take meaningful breaks.",
    accent: Colors.blue,
  },
  {
    icon: <ShieldBan color={Colors.gold} size={36} />,
    title: "Block distractions",
    body: "Shield distracting apps and websites during focus sessions. NGUMU keeps you accountable so you stay on task.",
    accent: Colors.purple,
  },
  {
    icon: <Eye color={Colors.gold} size={36} />,
    title: "Protect your eyes",
    body: "The 20-20-20 rule and blink warnings keep your eyes healthy during long sessions. NGUMU reminds you to look away and blink.",
    accent: Colors.goldDeep,
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { complete, skip } = useOnboarding();
  const [step, setStep] = useState<number>(0);
  const [notifGranted, setNotifGranted] = useState<boolean>(false);
  const [notifRequested, setNotifRequested] = useState<boolean>(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  const isLastSlide = step === SLIDES.length;
  const isNotifStep = step === SLIDES.length;

  const goNext = () => {
    if (step < SLIDES.length) {
      const next = step + 1;
      setStep(next);
      scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
    }
  };

  const requestNotifications = async () => {
    setNotifRequested(true);
    try {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("ngumu-focus", {
          name: "Focus & Breaks",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
        });
      }
      const { granted } = await Notifications.requestPermissionsAsync();
      setNotifGranted(granted);
    } catch {
      setNotifGranted(false);
    }
  };

  const finishOnboarding = () => {
    complete();
    router.replace("/(tabs)");
  };

  const skipOnboarding = () => {
    skip();
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.maroonDeep, Colors.maroon, Colors.maroonDark]}
        style={styles.gradient}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
          })}
          scrollEventThrottle={16}
        >
          {/* Feature slides */}
          {SLIDES.map((slide, idx) => (
            <View key={idx} style={styles.slide}>
              <View style={[styles.slideIconWrap, { backgroundColor: `${slide.accent}30` }]}>
                {slide.icon}
              </View>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideBody}>{slide.body}</Text>
            </View>
          ))}

          {/* Notification permission slide */}
          <View style={styles.slide}>
            <View style={[styles.slideIconWrap, { backgroundColor: `${Colors.gold}30` }]}>
              <Bell color={Colors.gold} size={36} />
            </View>
            <Text style={styles.slideTitle}>Stay on track with notifications</Text>
            <Text style={styles.slideBody}>
              NGUMU sends gentle reminders when your focus block ends, when it&apos;s time for a
              break, and when your trial is ending soon. We&apos;ll never spam you.
            </Text>

            {!notifRequested ? (
              <TouchableOpacity
                style={styles.notifButton}
                onPress={requestNotifications}
                activeOpacity={0.8}
              >
                <Bell color={Colors.maroonDeep} size={18} />
                <Text style={styles.notifButtonText}>Allow notifications</Text>
              </TouchableOpacity>
            ) : notifGranted ? (
              <View style={styles.notifGrantedCard}>
                <Check color={Colors.success} size={20} />
                <Text style={styles.notifGrantedText}>Notifications enabled</Text>
              </View>
            ) : (
              <View style={styles.notifGrantedCard}>
                <Zap color={Colors.gold} size={20} />
                <Text style={styles.notifGrantedText}>
                  No problem — you can enable them later in Settings
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom controls */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity onPress={skipOnboarding} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          <View style={styles.dotsRow}>
            {[...SLIDES, "notif"].map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === step && styles.dotActive]}
              />
            ))}
          </View>

          {isNotifStep ? (
            <TouchableOpacity
              style={styles.startButton}
              onPress={finishOnboarding}
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonText}>Get started</Text>
              <ArrowRight color={Colors.maroonDeep} size={18} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextButton} onPress={goNext} activeOpacity={0.8}>
              <ArrowRight color={Colors.gold} size={20} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.maroonDeep },
  gradient: { flex: 1 },
  slide: {
    width: SCREEN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  slideIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  slideTitle: {
    color: Colors.textOnDark,
    fontSize: 24,
    fontWeight: "800" as const,
    textAlign: "center",
  },
  slideBody: {
    color: Colors.textOnDarkMuted,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  notifButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.gold,
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 15,
    marginTop: 12,
  },
  notifButtonText: { color: Colors.maroonDeep, fontSize: 16, fontWeight: "800" as const },
  notifGrantedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginTop: 12,
  },
  notifGrantedText: { color: Colors.textOnDark, fontSize: 14, fontWeight: "600" as const, flex: 1 },
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
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.gold,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 13,
  },
  startButtonText: { color: Colors.maroonDeep, fontSize: 16, fontWeight: "800" as const },
});
