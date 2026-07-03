import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const CHANNEL_ID = "ngumu-focus";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

let setupDone = false;

/** Requests permission and configures the Android channel. Returns true when notifications are usable. */
export async function ensureNotificationSetup(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    if (!setupDone && Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: "Focus & Breaks",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
    setupDone = true;
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch (e) {
    console.log("[notifications] setup failed", e);
    return false;
  }
}

/** Schedules a one-off notification at a specific date. Returns the id or null. */
export async function scheduleAt(
  date: Date,
  title: string,
  body: string,
  sound: boolean
): Promise<string | null> {
  if (Platform.OS === "web") return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: sound ? "default" : undefined },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        channelId: Platform.OS === "android" ? CHANNEL_ID : undefined,
      },
    });
  } catch (e) {
    console.log("[notifications] scheduleAt failed", e);
    return null;
  }
}

/** Schedules a repeating daily notification. Returns the id or null. */
export async function scheduleDaily(
  hour: number,
  minute: number,
  title: string,
  body: string
): Promise<string | null> {
  if (Platform.OS === "web") return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: "default" },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: Platform.OS === "android" ? CHANNEL_ID : undefined,
      },
    });
  } catch (e) {
    console.log("[notifications] scheduleDaily failed", e);
    return null;
  }
}

/** Cancels previously scheduled notifications by id. */
export async function cancelNotifications(ids: string[]): Promise<void> {
  if (Platform.OS === "web") return;
  await Promise.all(
    ids.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch((e) =>
        console.log("[notifications] cancel failed", e)
      )
    )
  );
}

/** Fires an immediate notification. */
export async function notifyNow(title: string, body: string, sound: boolean): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: sound ? "default" : undefined },
      trigger: null,
    });
  } catch (e) {
    console.log("[notifications] notifyNow failed", e);
  }
}
