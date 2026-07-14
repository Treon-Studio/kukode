import { defaultLang, supportedLangCodes, ui } from './translations';

export type SupportedLanguages = keyof typeof ui;
export type TranslationKeys = keyof (typeof ui)[typeof defaultLang];

/**
 * Returns the current active language from Astro.locals, falling back to defaultLang.
 * Accepts any string but normalizes unknown values to `defaultLang`.
 */
export function getLangFromLocals(locals: any): SupportedLanguages {
  if (locals && typeof locals.lang === 'string' && supportedLangCodes.includes(locals.lang as SupportedLanguages)) {
    return locals.lang as SupportedLanguages;
  }
  return defaultLang;
}

/**
 * Hook to translate keys using the selected language dictionary.
 * Falls back to `defaultLang` (English) when a key is missing in the target language,
 * then to the key string itself as a last resort.
 */
export function useTranslations(lang: SupportedLanguages) {
  const tr = (key: TranslationKeys, vars?: Record<string, string | number>): string => {
    const translations = ui[lang];
    let str: string;
    if (key in translations) {
      str = translations[key as keyof typeof translations];
    } else {
      const fallbackTranslations = ui[defaultLang];
      str = fallbackTranslations[key as keyof typeof fallbackTranslations] || String(key);
    }
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return str;
  };
  return tr;
}

/**
 * Returns the active language's dictionary for client-side scripts.
 * Use with `<script define:vars={{ lang, dict: getClientDict(lang) }}>` so client-side
 * confirm modals, toasts, etc. can call `dict['key']` directly.
 */
export function getClientDict(lang: SupportedLanguages): Record<string, string> {
  return ui[lang] ?? ui[defaultLang];
}

/**
 * Inline translator for one-off strings outside the `ui` dictionary.
 * Pass an object keyed by language code (use `defaultLang` as the fallback).
 *
 * @example
 *   const tr = (l: any) => translate(l, { en: 'Hello', id: 'Halo' });
 */
export function translate(
  lang: SupportedLanguages,
  translations: Partial<Record<SupportedLanguages, string>>
): string {
  return translations[lang] ?? translations[defaultLang] ?? Object.values(translations)[0] ?? '';
}