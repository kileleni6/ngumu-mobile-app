import createContextHook from "@nkzw/create-context-hook";

import { useLanguage as useLanguageInternal } from "@/i18n";

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  return useLanguageInternal();
});
