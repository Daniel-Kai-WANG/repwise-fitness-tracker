import { useEffect, useState, type ReactNode } from 'react';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import { seedDatabase } from '../db/seed';
import { useI18n } from '../i18n/useI18n';

export function DatabaseGate({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading'
  );
  useEffect(() => {
    seedDatabase()
      .then(() => setStatus('ready'))
      .catch((error) => {
        if (import.meta.env.DEV)
          console.error('Unable to initialise IndexedDB', error);
        setStatus('error');
      });
  }, []);
  if (status === 'loading')
    return <LoadingState label={t('Opening local workout data')} />;
  if (status === 'error')
    return (
      <main className="app-content">
        <EmptyState
          title={t('Local storage is unavailable')}
          description={t(
            'Repwise needs browser storage to protect your workout records. Check private browsing or storage permissions, then reload.'
          )}
        />
      </main>
    );
  return children;
}
