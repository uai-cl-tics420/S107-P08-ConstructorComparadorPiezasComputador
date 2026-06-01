/**
 * i18n configuration — i18next + react-i18next
 *
 * Locale files live in ./locales/<lang>.json.
 * The active language is driven by ConfigContext (persisted in localStorage),
 * so all language changes go through setConfig({ language }) and this module
 * just reacts to them via the `changeLanguage` call in frontend.tsx.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';

export const SUPPORTED_LANGUAGES = ['en', 'es'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const savedLanguage = localStorage.getItem('language');
const browserLanguage = navigator.language.split('-')[0];
const defaultLanguage: SupportedLanguage =
  SUPPORTED_LANGUAGES.find((l) => l === savedLanguage) ||
  SUPPORTED_LANGUAGES.find((l) => l === browserLanguage) ||
  'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: defaultLanguage,
  fallbackLng: 'en',
  interpolation: {
    // React already escapes values — no need for i18next to do it too
    escapeValue: false,
  },
});

export default i18n;
