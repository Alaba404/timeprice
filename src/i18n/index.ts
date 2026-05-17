import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import fr from './fr';
import en from './en';

const i18n = new I18n({ fr, en });

i18n.locale = Localization.getLocales()[0]?.languageCode ?? 'fr';
i18n.enableFallback = true;
i18n.defaultLocale = 'fr';

export default i18n;

export function t(scope: string, options?: Record<string, unknown>): string {
  return i18n.t(scope, options);
}

export function setLocale(locale: 'fr' | 'en'): void {
  i18n.locale = locale;
}
