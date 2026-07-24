import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, type ReactNode } from 'react';
import { db } from '../db/database';

export function ThemeManager({ children }: { children: ReactNode }) {
  const theme = useLiveQuery(() =>
    db.settings
      .get('app-settings')
      .then((settings) => settings?.theme ?? 'system')
  );
  useEffect(() => {
    if (!theme) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () =>
      (document.documentElement.dataset.theme =
        theme === 'system' ? (media.matches ? 'dark' : 'light') : theme);
    applyTheme();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [theme]);
  return children;
}
