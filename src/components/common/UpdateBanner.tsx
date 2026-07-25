import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from './Button';
import { useI18n } from '../../i18n/useI18n';

export function UpdateBanner() {
  const { t } = useI18n();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    immediate: true,
    onRegisterError(error) {
      if (import.meta.env.DEV)
        console.error('Service worker registration failed', error);
    }
  });
  if (!needRefresh) return null;
  return (
    <div className="update-banner" role="status">
      <span>{t('A new version is available.')}</span>
      <Button onClick={() => updateServiceWorker(true)}>{t('Update')}</Button>
      <button
        type="button"
        onClick={() => setNeedRefresh(false)}
        aria-label={t('Dismiss update')}
      >
        {t('Later')}
      </button>
    </div>
  );
}
