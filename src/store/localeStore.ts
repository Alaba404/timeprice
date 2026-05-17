import { create } from 'zustand';
import { setLocale as i18nSetLocale } from '../i18n';
import * as Localization from 'expo-localization';
import type { Locale } from '../types';

type LocaleState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const systemLocale = (Localization.getLocales()[0]?.languageCode ?? 'fr') as Locale;
const initial: Locale = systemLocale === 'en' ? 'en' : 'fr';

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: initial,
  setLocale: (locale) => {
    i18nSetLocale(locale);
    set({ locale });
  },
}));
