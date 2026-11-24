import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getCookie, setCookie } from '@/lib/cookies'
import { fa } from './fa'

// Every ./fa-*.ts file contributes a dictionary; no manual registration needed.
const faModules = import.meta.glob<Record<string, Record<string, string>>>(
  './fa-*.ts',
  { eager: true }
)
const faAll: Record<string, string> = Object.assign(
  {},
  fa,
  ...Object.values(faModules).flatMap((m) => Object.values(m))
)

export type Language = 'en' | 'fa'

export const LANGUAGES: {
  code: Language
  label: string
  dir: 'ltr' | 'rtl'
}[] = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'fa', label: 'فارسی', dir: 'rtl' },
]

const LANGUAGE_COOKIE_NAME = 'lang'
const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export function getLanguageDir(lang: string): 'ltr' | 'rtl' {
  return LANGUAGES.find((l) => l.code === lang)?.dir ?? 'ltr'
}

function initialLanguage(): Language {
  const saved = getCookie(LANGUAGE_COOKIE_NAME)
  return LANGUAGES.some((l) => l.code === saved) ? (saved as Language) : 'en'
}

/**
 * English source strings are used as keys, so untranslated strings fall back
 * to English and screens can be migrated to `t()` incrementally.
 */
void i18n.use(initReactI18next).init({
  lng: initialLanguage(),
  fallbackLng: 'en',
  resources: { en: { translation: {} }, fa: { translation: faAll } },
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
  returnEmptyString: false,
})

export function persistLanguage(lang: Language) {
  setCookie(LANGUAGE_COOKIE_NAME, lang, LANGUAGE_COOKIE_MAX_AGE)
}

export default i18n
