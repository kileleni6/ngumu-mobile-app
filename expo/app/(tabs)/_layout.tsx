import { Tabs } from "expo-router";
import { BarChart3, Settings, ShieldBan, Timer } from "lucide-react-native";
import { Platform } from "react-native";

import Colors from "@/constants/colors";

/**
 * Floating bottom tab bar.
 * marginBottom: 28 on iOS (home indicator), 16 on Android (navigation bar).
 */
export default function TabLayout() {
  const marginBottom = Platform.OS === "ios" ? 28 : 16;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          position: "absolute",
          bottom: marginBottom,
          left: 20,
          right: 20,
          backgroundColor: Colors.maroon,
          borderRadius: 22,
          borderTopColor: "transparent",
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: Colors.maroonDeep,
          shadowOpacity: 0.35,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          paddingHorizontal: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600" as const,
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Focus",
          tabBarIcon: ({ color, size }) => <Timer color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Insights",
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="blocking"
        options={{
          title: "Blocking",
          tabBarIcon: ({ color, size }) => <ShieldBan color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
