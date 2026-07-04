import { useRouter } from "expo-router";
import { Download, Flame, Lock, ShieldBan, SkipForward, Coffee, Trophy, BarChart3 } from "lucide-react-native";
import React, { useMemo } from "react";
import { Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import EmptyState from "@/components/EmptyState";
import TimerRing from "@/components/TimerRing";
import Colors from "@/constants/colors";
import { useAnalytics } from "@/providers/AnalyticsProvider";
import { useLicense } from "@/providers/LicenseProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { formatMinutes, weekdayLabel, dayKey } from "@/utils/time";

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { today, week, streak, focusScore, toCSV, hydrated } = useAnalytics();
  const { settings } = useSettings();
  const { hasPro } = useLicense();

  const weekTotal = useMemo(
    () => week.reduce((sum, d) => sum + d.focusMinutes, 0),
    [week]
  );
  const maxDay = useMemo(
    () => Math.max(30, ...week.map((d) => d.focusMinutes)),
    [week]
  );

  const hasData = hydrated && (today.focusMinutes > 0 || today.sessions > 0 || weekTotal > 0);

  const onExport = async () => {
    if (!hasPro) {
      router.push("/paywall");
      return;
    }
    try {
      const csv = toCSV();
      await Share.share({ message: csv, title: "NGUMU focus report (CSV)" });
    } catch (e) {
      Alert.alert("Export failed", e instanceof Error ? e.message : "Please try again.");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 140 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Insights</Text>

        {!hasData ? (
          <EmptyState
            icon={<BarChart3 color={Colors.textSecondary} size={32} />}
            title="No focus data yet"
            message="Start your first focus session to see your stats, streaks, and focus score here."
          />
        ) : (
          <>
            <View style={styles.scoreCard}>
              <TimerRing
                size={128}
                strokeWidth={10}
                progress={focusScore / 100}
                color={Colors.gold}
                trackColor={Colors.maroonLight}
              >
                <Text style={styles.scoreValue}>{focusScore}</Text>
                <Text style={styles.scoreLabel}>score</Text>
              </TimerRing>
              <View style={styles.scoreInfo}>
                <View style={styles.streakRow}>
                  <Flame color={Colors.gold} size={20} />
                  <Text style={styles.streakValue}>{streak} day streak</Text>
                </View>
                <Text style={styles.scoreDetail}>
                  {formatMinutes(today.focusMinutes)} of {formatMinutes(settings.dailyGoalMin)} daily
                  goal
                </Text>
                <Text style={styles.scoreDetail}>
                  {today.sessions} session{today.sessions === 1 ? "" : "s"} today
                </Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>This week</Text>
              <Text style={styles.sectionValue}>{formatMinutes(weekTotal)}</Text>
            </View>
            <View style={styles.chartCard}>
              <View style={styles.chart}>
                {week.map((d) => {
                  const h = Math.max(6, Math.round((d.focusMinutes / maxDay) * 110));
                  const isToday = d.date === dayKey();
                  return (
                    <View key={d.date} style={styles.barCol}>
                      <Text style={styles.barValue}>
                        {d.focusMinutes > 0 ? d.focusMinutes : ""}
                      </Text>
                      <View
                        style={[
                          styles.bar,
                          { height: h },
                          isToday ? styles.barToday : undefined,
                        ]}
                      />
                      <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>
                        {weekdayLabel(d.date)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <Text style={[styles.sectionTitle, styles.gridTitle]}>Today</Text>
            <View style={styles.grid}>
              <View style={styles.gridCard}>
                <Trophy color={Colors.blue} size={20} />
                <Text style={styles.gridValue}>{today.sessions}</Text>
                <Text style={styles.gridLabel}>Sessions</Text>
              </View>
              <View style={styles.gridCard}>
                <Coffee color={Colors.purple} size={20} />
                <Text style={styles.gridValue}>{today.breaksTaken}</Text>
                <Text style={styles.gridLabel}>Breaks taken</Text>
              </View>
              <View style={styles.gridCard}>
                <SkipForward color={Colors.goldDeep} size={20} />
                <Text style={styles.gridValue}>{today.breaksSkipped}</Text>
                <Text style={styles.gridLabel}>Breaks skipped</Text>
              </View>
              <View style={styles.gridCard}>
                <ShieldBan color={Colors.maroon} size={20} />
                <Text style={styles.gridValue}>{today.blockedAttempts}</Text>
                <Text style={styles.gridLabel}>Blocked attempts</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.exportButton} onPress={onExport} testID="export-csv">
              {hasPro ? (
                <Download color={Colors.white} size={18} />
              ) : (
                <Lock color={Colors.white} size={18} />
              )}
              <Text style={styles.exportText}>
                {hasPro ? "Export CSV report" : "Export CSV report (Pro)"}
              </Text>
            </TouchableOpacity>
          </>
        )}
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
  scoreCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    backgroundColor: Colors.maroon,
    borderRadius: 22,
    padding: 20,
  },
  scoreValue: { color: Colors.white, fontSize: 34, fontWeight: "800" as const },
  scoreLabel: { color: Colors.textOnDarkMuted, fontSize: 12, marginTop: -2 },
  scoreInfo: { flex: 1, gap: 6 },
  streakRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  streakValue: { color: Colors.white, fontSize: 18, fontWeight: "800" as const },
  scoreDetail: { color: Colors.textOnDarkMuted, fontSize: 13 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  gridTitle: { marginTop: 24, marginBottom: 10 },
  sectionValue: { fontSize: 16, fontWeight: "800" as const, color: Colors.maroon },
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  barCol: { alignItems: "center", flex: 1, gap: 6 },
  barValue: { fontSize: 10, color: Colors.textSecondary, height: 14 },
  bar: {
    width: 20,
    borderRadius: 6,
    backgroundColor: Colors.purpleSoft,
  },
  barToday: { backgroundColor: Colors.maroon },
  barLabel: { fontSize: 11, color: Colors.textSecondary },
  barLabelToday: { color: Colors.maroon, fontWeight: "700" as const },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gridCard: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 6,
  },
  gridValue: { fontSize: 24, fontWeight: "800" as const, color: Colors.text },
  gridLabel: { fontSize: 12, color: Colors.textSecondary },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.maroon,
    borderRadius: 999,
    paddingVertical: 15,
    marginTop: 24,
  },
  exportText: { color: Colors.white, fontSize: 15, fontWeight: "700" as const },
});
