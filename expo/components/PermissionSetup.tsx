import { Bell, Check, ShieldCheck, Layers, ArrowRight } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { t } from "@/i18n";
import type { PermissionState } from "@/types";

const MAROON = "#5A1846";

interface PermissionCardProps {
  icon: React.ReactNode;
  title: string;
  badge: "required" | "optional";
  description: string;
  state: PermissionState;
  onGrant: () => void;
}

function PermissionCard({ icon, title, badge, description, state, onGrant }: PermissionCardProps) {
  const isGranted = state === "granted";

  return (
    <View
      style={[
        styles.card,
        isGranted ? styles.cardGranted : styles.cardPending,
      ]}
    >
      {isGranted && <View style={styles.grantedStripe} />}

      <View
        style={[
          styles.cardIcon,
          isGranted ? styles.cardIconGranted : styles.cardIconPending,
        ]}
      >
        {icon}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{title}</Text>
          <View
            style={[
              styles.badge,
              badge === "required"
                ? isGranted
                  ? styles.badgeRequiredNeutral
                  : styles.badgeRequired
                : styles.badgeOptional,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                badge === "required" && !isGranted
                  ? styles.badgeTextRequired
                  : styles.badgeTextNeutral,
              ]}
            >
              {badge === "required" ? t("common.required") : t("common.optional")}
            </Text>
          </View>
        </View>
        <Text style={styles.cardDesc}>{description}</Text>
      </View>

      <View style={styles.cardAction}>
        {isGranted ? (
          <View style={styles.grantedPill}>
            <Check color="#059669" size={16} />
            <Text style={styles.grantedPillText}>{t("common.granted")}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.grantButton}
            onPress={onGrant}
            activeOpacity={0.7}
          >
            <Text style={styles.grantButtonText}>{t("common.grant")}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

interface PermissionSetupProps {
  permissions: {
    usageAccess: PermissionState;
    overlay: PermissionState;
    notifications: PermissionState;
  };
  onGrantUsageAccess: () => void;
  onGrantOverlay: () => void;
  onGrantNotifications: () => void;
  onContinue: () => void;
  onSkip?: () => void;
}

/**
 * Permission setup screen matching the provided design exactly.
 * Shows Usage Access, Display Over Apps, and Notifications cards
 * with granted/pending states and a sticky bottom continue bar.
 */
export default function PermissionSetup({
  permissions,
  onGrantUsageAccess,
  onGrantOverlay,
  onGrantNotifications,
  onContinue,
  onSkip,
}: PermissionSetupProps) {
  const insets = useSafeAreaInsets();

  const requiredGranted =
    (permissions.usageAccess === "granted" ? 1 : 0) +
    (permissions.overlay === "granted" ? 1 : 0);
  const requiredTotal = Platform.OS === "ios" ? 1 : 2;
  const canContinue = requiredGranted >= requiredTotal;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 48 }]}>
          <View style={styles.headerIcon}>
            <ShieldCheck color={MAROON} size={32} strokeWidth={1.5} />
          </View>
          <Text style={styles.headerTitle}>{t("onboarding.permissions.title")}</Text>
          <Text style={styles.headerDesc}>
            {t("onboarding.permissions.subtitle")}
          </Text>
        </View>

        {/* Permission cards */}
        <View style={styles.cardsContainer}>
          {Platform.OS === "android" && (
            <>
              <PermissionCard
                icon={<ShieldCheck color={permissions.usageAccess === "granted" ? "#059669" : "#52525B"} size={24} strokeWidth={1.5} />}
                title={t("onboarding.permissions.usageAccess")}
                badge="required"
                description={t("onboarding.permissions.usageAccessDesc")}
                state={permissions.usageAccess}
                onGrant={onGrantUsageAccess}
              />
              <PermissionCard
                icon={<Layers color="#52525B" size={24} strokeWidth={1.5} />}
                title={t("onboarding.permissions.overlay")}
                badge="required"
                description={t("onboarding.permissions.overlayDesc")}
                state={permissions.overlay}
                onGrant={onGrantOverlay}
              />
            </>
          )}

          {Platform.OS === "ios" && (
            <PermissionCard
              icon={<ShieldCheck color={permissions.usageAccess === "granted" ? "#059669" : "#52525B"} size={24} strokeWidth={1.5} />}
              title={t("onboarding.permissions.screenTime")}
              badge="required"
              description={t("onboarding.permissions.screenTimeDesc")}
              state={permissions.usageAccess}
              onGrant={onGrantUsageAccess}
            />
          )}

          <PermissionCard
            icon={<Bell color="#52525B" size={24} strokeWidth={1.5} />}
            title={t("onboarding.permissions.notifications")}
            badge="optional"
            description={t("onboarding.permissions.notificationsDesc")}
            state={permissions.notifications}
            onGrant={onGrantNotifications}
          />
        </View>

        {Platform.OS === "ios" && (
          <View style={styles.iosNote}>
            <Text style={styles.iosNoteText}>
              {t("onboarding.permissions.iosNote")}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.bottomBarCount}>
          {t("onboarding.permissions.progress", { count: requiredGranted, total: requiredTotal })}
        </Text>
        <TouchableOpacity
          style={[styles.continueButton, canContinue ? styles.continueButtonActive : styles.continueButtonDisabled]}
          onPress={canContinue ? onContinue : onSkip}
          disabled={!canContinue && !onSkip}
          activeOpacity={0.85}
        >
          <Text style={styles.continueButtonText}>
            {canContinue ? t("onboarding.permissions.continue") : t("onboarding.permissions.grantRequired")}
          </Text>
          {canContinue && <ArrowRight color="#FFFFFF" size={20} />}
        </TouchableOpacity>
        {!canContinue && onSkip && (
          <TouchableOpacity onPress={onSkip} style={styles.skipRow} hitSlop={8}>
            <Text style={styles.skipText}>{t("onboarding.permissions.skipForNow")}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scroll: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(90, 24, 70, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(90, 24, 70, 0.05)",
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "800" as const,
    color: "#18181B",
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  headerDesc: {
    fontSize: 16,
    color: "#71717A",
    lineHeight: 24,
  },
  cardsContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    position: "relative",
    overflow: "hidden",
  },
  cardGranted: {
    borderColor: "#D1FAE5",
  },
  cardPending: {
    borderColor: "#E4E4E7",
  },
  grantedStripe: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: 4,
    height: "100%" as const,
    backgroundColor: "#10B981",
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardIconGranted: {
    backgroundColor: "#ECFDF5",
  },
  cardIconPending: {
    backgroundColor: "#F4F4F5",
  },
  cardBody: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#18181B",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeRequired: {
    backgroundColor: "rgba(90, 24, 70, 0.1)",
  },
  badgeRequiredNeutral: {
    backgroundColor: "#F4F4F5",
  },
  badgeOptional: {
    backgroundColor: "#F4F4F5",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  badgeTextRequired: {
    color: MAROON,
  },
  badgeTextNeutral: {
    color: "#A1A1AA",
  },
  cardDesc: {
    fontSize: 14,
    color: "#71717A",
    marginTop: 4,
    lineHeight: 18,
  },
  cardAction: {
    flexShrink: 0,
  },
  grantedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  grantedPillText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#047857",
  },
  grantButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F4F4F5",
  },
  grantButtonText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#3F3F46",
  },
  iosNote: {
    marginHorizontal: 24,
    marginTop: 16,
    padding: 16,
    backgroundColor: "rgba(90, 24, 70, 0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(90, 24, 70, 0.1)",
  },
  iosNoteText: {
    fontSize: 13,
    color: "#71717A",
    lineHeight: 19,
  },
  bottomBar: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopWidth: 1,
    borderTopColor: "#E4E4E7",
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  bottomBarCount: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#71717A",
    marginBottom: 12,
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  continueButtonActive: {
    backgroundColor: MAROON,
  },
  continueButtonDisabled: {
    backgroundColor: MAROON,
    opacity: 0.4,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  skipRow: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#A1A1AA",
  },
});
