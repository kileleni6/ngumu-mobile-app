import { getLocales } from "expo-localization";
import { I18n } from "i18n-js";
import { useCallback, useEffect, useState } from "react";

import { getJSON, setJSON } from "@/services/storage";

import ar from "./translations/ar.json";
import cs from "./translations/cs.json";
import da from "./translations/da.json";
import de from "./translations/de.json";
import el from "./translations/el.json";
import en from "./translations/en.json";
import es from "./translations/es.json";
import fi from "./translations/fi.json";
import fr from "./translations/fr.json";
import he from "./translations/he.json";
import hi from "./translations/hi.json";
import id from "./translations/id.json";
import it from "./translations/it.json";
import ja from "./translations/ja.json";
import ko from "./translations/ko.json";
import nl from "./translations/nl.json";
import no from "./translations/no.json";
import pl from "./translations/pl.json";
import pt from "./translations/pt.json";
import ru from "./translations/ru.json";
import sv from "./translations/sv.json";
import th from "./translations/th.json";
import tr from "./translations/tr.json";
import uk from "./translations/uk.json";
import vi from "./translations/vi.json";
import zh from "./translations/zh.json";

export const TRANSLATIONS = {
  en,
  es,
  fr,
  de,
  it,
  pt,
  ru,
  zh,
  ja,
  ko,
  ar,
  hi,
  nl,
  pl,
  tr,
  vi,
  id,
  sv,
  da,
  no,
  fi,
  cs,
  el,
  he,
  uk,
  th,
};

export type LanguageCode = keyof typeof TRANSLATIONS;

export const LANGUAGE_META: { code: LanguageCode; name: string; flag: string }[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "zh", name: "简体中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "nl", name: "Nederlands", flag: "🇳🇱" },
  { code: "pl", name: "Polski", flag: "🇵🇱" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
  { code: "id", name: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "sv", name: "Svenska", flag: "🇸🇪" },
  { code: "da", name: "Dansk", flag: "🇩🇰" },
  { code: "no", name: "Norsk", flag: "🇳🇴" },
  { code: "fi", name: "Suomi", flag: "🇫🇮" },
  { code: "cs", name: "Čeština", flag: "🇨🇿" },
  { code: "el", name: "Ελληνικά", flag: "🇬🇷" },
  { code: "he", name: "עברית", flag: "🇮🇱" },
  { code: "uk", name: "Українська", flag: "🇺🇦" },
  { code: "th", name: "ไทย", flag: "🇹🇭" },
];

export const DEFAULT_LANGUAGE: LanguageCode = "en";

const LANGUAGE_KEY = "ngumu.language.v1";

const i18n = new I18n(TRANSLATIONS);
i18n.defaultLocale = DEFAULT_LANGUAGE;
i18n.locale = DEFAULT_LANGUAGE;
i18n.enableFallback = true;

export type TranslateFunction = typeof i18n.translate;
export type I18nScope = Parameters<TranslateFunction>[1];

/** The global translation function. */
export const t = (key: string, options?: Record<string, unknown>): string => i18n.translate(key, options);

/** Returns a language code that we actually support. */
export function resolveLanguageCode(raw?: string | null): LanguageCode {
  if (!raw) return DEFAULT_LANGUAGE;
  const code = raw.split("-")[0].toLowerCase() as LanguageCode;
  return TRANSLATIONS[code] ? code : DEFAULT_LANGUAGE;
}

/** Returns the best initial language code based on device locale or saved preference. */
export function getInitialLanguageCode(saved?: string | null): LanguageCode {
  if (saved && TRANSLATIONS[saved as LanguageCode]) return saved as LanguageCode;
  const deviceLocale = getLocales()[0]?.languageCode;
  return resolveLanguageCode(deviceLocale);
}

export function setI18nLocale(code: LanguageCode): void {
  i18n.locale = code;
}

export interface UseLanguageResult {
  code: LanguageCode;
  setCode: (code: LanguageCode) => void;
  hydrated: boolean;
}

/** Hook that loads/saves the selected language. */
export function useLanguage(): UseLanguageResult {
  const [code, setCodeState] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [hydrated, setHydrated] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const saved = await getJSON<string | null>(LANGUAGE_KEY, null);
      const initial = getInitialLanguageCode(saved);
      setCodeState(initial);
      setI18nLocale(initial);
      setHydrated(true);
    })();
  }, []);

  const setCode = useCallback((next: LanguageCode) => {
    setCodeState(next);
    setI18nLocale(next);
    setJSON(LANGUAGE_KEY, next).catch(() => {});
  }, []);

  return { code, setCode, hydrated };
}
