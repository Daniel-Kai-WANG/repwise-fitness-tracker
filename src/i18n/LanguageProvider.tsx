import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, type ReactNode } from 'react';
import { db } from '../db/database';
import { I18nContext, type I18nContextValue } from './context';
import { translate, type AppLanguage } from './translations';

function getSystemLanguage(): AppLanguage {
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const preference =
    useLiveQuery(() =>
      db.settings
        .get('app-settings')
        .then((settings) => settings?.language ?? 'system')
    ) ?? 'system';
  const language = preference === 'system' ? getSystemLanguage() : preference;

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  }, [language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      preference,
      t: (key, values) => translate(language, key, values)
    }),
    [language, preference]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
