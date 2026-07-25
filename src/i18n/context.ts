import { createContext } from 'react';
import type { LanguagePreference } from '../types/settings';
import { translate, type AppLanguage } from './translations';

export interface I18nContextValue {
  language: AppLanguage;
  preference: LanguagePreference;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export const I18nContext = createContext<I18nContextValue>({
  language: 'en',
  preference: 'system',
  t: (key, values) => translate('en', key, values)
});
