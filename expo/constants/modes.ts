import Colors from "@/constants/colors";
import type { AppSettings, FocusModeDef } from "@/types";

export const MODES: FocusModeDef[] = [
  {
    id: "pomodoro",
    name: "Pomodoro",
    tagline: "25 min focus · 5 min break",
    focusSec: 25 * 60,
    breakSec: 5 * 60,
    pro: false,
    accent: Colors.maroon,
    eyeHealth: false,
  },
  {
    id: "flow52",
    name: "52 / 17",
    tagline: "52 min focus · 17 min break",
    focusSec: 52 * 60,
    breakSec: 17 * 60,
    pro: false,
    accent: Colors.blue,
    eyeHealth: false,
  },
  {
    id: "deep90",
    name: "90 / 20",
    tagline: "90 min deep work · 20 min break",
    focusSec: 90 * 60,
    breakSec: 20 * 60,
    pro: false,
    accent: Colors.purple,
    eyeHealth: false,
  },
  {
    id: "eye202020",
    name: "20-20-20",
    tagline: "Every 20 min · 20 s eye break",
    focusSec: 20 * 60,
    breakSec: 20,
    pro: false,
    accent: Colors.goldDeep,
    eyeHealth: true,
  },
  {
    id: "custom",
    name: "Custom",
    tagline: "Your own focus & break lengths",
    focusSec: 45 * 60,
    breakSec: 10 * 60,
    pro: true,
    accent: Colors.maroonLight,
    eyeHealth: false,
  },
];

/** Resolves a mode id to its definition, applying custom durations from settings. */
export function resolveMode(id: string, settings: AppSettings): FocusModeDef {
  const base = MODES.find((m) => m.id === id) ?? MODES[0];
  if (base.id === "custom") {
    return {
      ...base,
      focusSec: Math.max(1, settings.customFocusMin) * 60,
      breakSec: Math.max(1, settings.customBreakMin) * 60,
      tagline: `${settings.customFocusMin} min focus · ${settings.customBreakMin} min break`,
    };
  }
  return base;
}
