import { useI18n } from '../../i18n/useI18n';

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div className="loading-state" role="status">
      <span className="loading-state__spinner" aria-hidden="true" />
      <span>{t(label)}</span>
    </div>
  );
}
