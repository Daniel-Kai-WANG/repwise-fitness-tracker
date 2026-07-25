import { MoreVertical } from 'lucide-react';
import { formatDuration } from '../../utils/date';
import { Button } from '../common/Button';
import { useI18n } from '../../i18n/useI18n';

interface ActiveWorkoutHeaderProps {
  name: string;
  elapsedSeconds: number;
  onFinish: () => void;
  onCancel: () => void;
}

export function ActiveWorkoutHeader({
  name,
  elapsedSeconds,
  onFinish,
  onCancel
}: ActiveWorkoutHeaderProps) {
  const { t } = useI18n();
  return (
    <header className="workout-header">
      <div>
        <p className="eyebrow">
          {t('Active')} · {formatDuration(elapsedSeconds)}
        </p>
        <h1>{t(name)}</h1>
      </div>
      <div className="workout-header__actions">
        <button
          className="icon-button"
          type="button"
          onClick={onCancel}
          aria-label={t('Cancel workout')}
        >
          <MoreVertical />
        </button>
        <Button type="button" onClick={onFinish}>
          {t('Finish')}
        </Button>
      </div>
    </header>
  );
}
