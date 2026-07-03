import AsyncStorage from "@react-native-async-storage/async-storage";

/** Reads and parses a JSON value from AsyncStorage, returning a fallback on failure. */
export async function getJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.log(`[storage] failed to read ${key}`, e);
    return fallback;
  }
}

/** Serializes and stores a JSON value in AsyncStorage. */
export async function setJSON<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.log(`[storage] failed to write ${key}`, e);
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.log(`[storage] failed to remove ${key}`, e);
  }
}
