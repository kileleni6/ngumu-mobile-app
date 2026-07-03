import { useRouter } from "expo-router";
import {
  Check,
  Globe,
  Info,
  Lock,
  Plus,
  Smartphone,
  X,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { APP_CATALOG, SUGGESTED_SITES } from "@/constants/apps";
import EmptyState from "@/components/EmptyState";
import { useBlocking } from "@/providers/BlockingProvider";
import { useLicense } from "@/providers/LicenseProvider";

export default function BlockingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const blocking = useBlocking();
  const { hasPro } = useLicense();
  const [siteInput, setSiteInput] = useState<string>("");

  const suggestions = useMemo(
    () => SUGGESTED_SITES.filter((s) => !blocking.sites.includes(s)).slice(0, 4),
    [blocking.sites]
  );

  const requirePro = (): boolean => {
    if (hasPro) return false;
    router.push("/paywall");
    return true;
  };

  const onAddSite = () => {
    if (requirePro()) return;
    if (!siteInput.trim()) return;
    const ok = blocking.addSite(siteInput);
    if (!ok) {
      Alert.alert("Invalid domain", "Enter a domain like example.com");
      return;
    }
    setSiteInput("");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.screenTitle}>Blocking</Text>
        {!hasPro && (
          <TouchableOpacity style={styles.proBanner} onPress={() => router.push("/paywall")}>
            <Lock color={Colors.gold} size={18} />
            <Text style={styles.proBannerText}>
              Blocking is a Pro feature — unlock it or start your trial
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.sectionCard}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <View style={styles.toggleTitleRow}>
                <Smartphone color={Colors.maroon} size={18} />
                <Text style={styles.toggleTitle}>Block apps during focus</Text>
              </View>
              <Text style={styles.toggleSub}>
                Selected apps are shielded while a focus session runs
              </Text>
            </View>
            <Switch
              value={blocking.appBlockingEnabled && hasPro}
              onValueChange={(v) => {
                if (requirePro()) return;
                blocking.setAppBlockingEnabled(v);
              }}
              trackColor={{ false: Colors.border, true: Colors.maroon }}
              thumbColor={Colors.white}
              testID="app-blocking-switch"
            />
          </View>
          <View style={styles.appList}>
            {APP_CATALOG.map((app) => {
              const selected = blocking.blockedAppIds.includes(app.id);
              return (
                <TouchableOpacity
                  key={app.id}
                  style={[styles.appRow, selected && styles.appRowSelected]}
                  onPress={() => {
                    if (requirePro()) return;
                    blocking.toggleApp(app.id);
                  }}
                  testID={`app-${app.id}`}
                >
                  <View style={[styles.appAvatar, selected && styles.appAvatarSelected]}>
                    <Text
                      style={[styles.appAvatarText, selected && styles.appAvatarTextSelected]}
                    >
                      {app.name[0]}
                    </Text>
                  </View>
                  <View style={styles.appTextWrap}>
                    <Text style={styles.appName}>{app.name}</Text>
                    <Text style={styles.appCategory}>{app.category}</Text>
                  </View>
                  {selected && <Check color={Colors.maroon} size={20} />}
                </TouchableOpacity>
              );
            })}
          </View>
          {blocking.blockedAppIds.length === 0 && (
            <EmptyState
              icon={<Smartphone color={Colors.textSecondary} size={28} />}
              title="No apps blocked yet"
              message="Tap apps above to add them to your blocklist. They'll be shielded during focus sessions."
            />
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <View style={styles.toggleTitleRow}>
                <Globe color={Colors.blue} size={18} />
                <Text style={styles.toggleTitle}>Block websites during focus</Text>
              </View>
              <Text style={styles.toggleSub}>Domains on your list are off-limits</Text>
            </View>
            <Switch
              value={blocking.siteBlockingEnabled && hasPro}
              onValueChange={(v) => {
                if (requirePro()) return;
                blocking.setSiteBlockingEnabled(v);
              }}
              trackColor={{ false: Colors.border, true: Colors.blue }}
              thumbColor={Colors.white}
              testID="site-blocking-switch"
            />
          </View>

          <View style={styles.modeToggle}>
            {(["blocklist", "allowlist"] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.modeOption, blocking.siteListMode === m && styles.modeOptionActive]}
                onPress={() => {
                  if (requirePro()) return;
                  blocking.setSiteListMode(m);
                }}
              >
                <Text
                  style={[
                    styles.modeOptionText,
                    blocking.siteListMode === m && styles.modeOptionTextActive,
                  ]}
                >
                  {m === "blocklist" ? "Blacklist" : "Allowlist"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.siteInputRow}>
            <TextInput
              style={styles.siteInput}
              placeholder="Add a domain (e.g. reddit.com)"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              value={siteInput}
              onChangeText={setSiteInput}
              onSubmitEditing={onAddSite}
              testID="site-input"
            />
            <TouchableOpacity style={styles.addButton} onPress={onAddSite} testID="add-site">
              <Plus color={Colors.white} size={20} />
            </TouchableOpacity>
          </View>

          {suggestions.length > 0 && (
            <View style={styles.suggestionsRow}>
              {suggestions.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.suggestionChip}
                  onPress={() => {
                    if (requirePro()) return;
                    blocking.addSite(s);
                  }}
                >
                  <Plus color={Colors.textSecondary} size={12} />
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {blocking.sites.length > 0 && (
            <View style={styles.sitesList}>
              {blocking.sites.map((s) => (
                <View key={s} style={styles.siteChip}>
                  <Text style={styles.siteChipText}>{s}</Text>
                  <TouchableOpacity onPress={() => blocking.removeSite(s)} hitSlop={8}>
                    <X color={Colors.maroon} size={14} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          {blocking.sites.length === 0 && (
            <EmptyState
              icon={<Globe color={Colors.textSecondary} size={28} />}
              title="No websites blocked yet"
              message="Add domains above or tap a suggestion to start your blocklist."
            />
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Info color={Colors.blue} size={16} />
            <Text style={styles.infoTitle}>How enforcement works</Text>
          </View>
          <Text style={styles.infoText}>
            In this build, NGUMU enforces your blocklist with reminder-based shielding:
            notifications, focus status and in-app accountability tracking.
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.infoBold}>Android:</Text> full enforcement (foreground-app
            detection with a blocking screen) requires Usage Access and the optional
            Accessibility Service, available in a native development build — not in this
            preview.
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.infoBold}>iOS:</Text> Apple only allows true app shielding
            through the Screen Time (FamilyControls) APIs in a native app with special
            entitlements. NGUMU never promises system-level blocking iOS doesn&apos;t allow —
            it falls back to reminders and focus guidance.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: Colors.text,
    marginTop: 12,
    marginBottom: 16,
  },
  proBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.maroon,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  proBannerText: { color: Colors.goldSoft, fontSize: 13, fontWeight: "600" as const, flex: 1 },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 16,
  },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  toggleTextWrap: { flex: 1 },
  toggleTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  toggleTitle: { fontSize: 15, fontWeight: "700" as const, color: Colors.text },
  toggleSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  appList: { marginTop: 12 },
  appRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 9,
  },
  appRowSelected: {},
  appAvatar: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  appAvatarSelected: { backgroundColor: Colors.maroonSoft },
  appAvatarText: { fontSize: 15, fontWeight: "800" as const, color: Colors.textSecondary },
  appAvatarTextSelected: { color: Colors.maroon },
  appTextWrap: { flex: 1 },
  appName: { fontSize: 14, fontWeight: "600" as const, color: Colors.text },
  appCategory: { fontSize: 11, color: Colors.textSecondary },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    padding: 3,
    marginTop: 14,
  },
  modeOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  modeOptionActive: { backgroundColor: Colors.surface },
  modeOptionText: { fontSize: 13, fontWeight: "600" as const, color: Colors.textSecondary },
  modeOptionTextActive: { color: Colors.blue },
  siteInputRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  siteInput: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.text,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  suggestionText: { fontSize: 12, color: Colors.textSecondary },
  sitesList: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  siteChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.maroonSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  siteChipText: { fontSize: 13, fontWeight: "600" as const, color: Colors.maroon },
  infoCard: {
    backgroundColor: Colors.blueSoft,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  infoHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoTitle: { fontSize: 14, fontWeight: "700" as const, color: Colors.blue },
  infoText: { fontSize: 12.5, color: Colors.text, lineHeight: 18 },
  infoBold: { fontWeight: "700" as const },
});
