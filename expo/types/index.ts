export type TimerPhase = "idle" | "focus" | "break";

export interface FocusModeDef {
  id: string;
  name: string;
  tagline: string;
  focusSec: number;
  breakSec: number;
  pro: boolean;
  accent: string;
  eyeHealth: boolean;
}

export interface DayStats {
  date: string;
  focusMinutes: number;
  sessions: number;
  breaksTaken: number;
  breaksSkipped: number;
  blockedAttempts: number;
}

export interface LicenseRecord {
  plan: string;
  activatedAt: number;
  expirationDate: number | null;
}

/** trial = full Pro access during free trial, free = trial expired, pro = paid */
export type AccessTier = "trial" | "free" | "pro";

export interface AppSettings {
  blinkWarningEnabled: boolean;
  blinkSeconds: 3 | 5;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  strictBreaks: boolean;
  notificationsEnabled: boolean;
  dailyReminderEnabled: boolean;
  customFocusMin: number;
  customBreakMin: number;
  dailyGoalMin: number;
  /** When true, the custom mode inserts a 20-second eye break every 20 minutes. */
  customEyeHealth: boolean;
}

export interface CatalogApp {
  id: string;
  name: string;
  category: string;
}

export type SiteListMode = "blocklist" | "allowlist";

/** Permission states tracked during onboarding and runtime. */
export type PermissionState = "pending" | "granted" | "denied";

/** Invite code validation result from Convex (or local offline fallback). */
export interface InviteCodeResult {
  valid: boolean;
  extraDays: number;
  message: string;
}

/** Onboarding completion state persisted to storage. */
export interface OnboardingState {
  completed: boolean;
  skippedAt: number | null;
  selectedModeId: string | null;
  inviteCode: string | null;
  trialExtendedDays: number;
  notificationsGranted: boolean;
}
