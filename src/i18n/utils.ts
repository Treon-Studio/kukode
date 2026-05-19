import { ui, defaultLang } from './translations';

export type SupportedLanguages = keyof typeof ui;
export type TranslationKeys = keyof (typeof ui)[typeof defaultLang];

/**
 * Returns the current active language from Astro.locals, falling back to defaultLang
 */
export function getLangFromLocals(locals: any): SupportedLanguages {
  if (locals && locals.lang && locals.lang in ui) {
    return locals.lang as SupportedLanguages;
  }
  return defaultLang;
}

/**
 * Hook to translate keys using the selected language dictionary
 */
export function useTranslations(lang: SupportedLanguages) {
  return function t(key: TranslationKeys): string {
    const translations = ui[lang];
    if (key in translations) {
      return translations[key as keyof typeof translations];
    }
    // Fallback to default language if key doesn't exist in target language
    const fallbackTranslations = ui[defaultLang];
    return fallbackTranslations[key as keyof typeof fallbackTranslations] || String(key);
  };
}
