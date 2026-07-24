import { MoreVertical } from 'lucide-react';
import { formatDuration } from '../../utils/date';
import { Button } from '../common/Button';

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
  return (
    <header className="workout-header">
      <div>
        <p className="eyebrow">Active · {formatDuration(elapsedSeconds)}</p>
        <h1>{name}</h1>
      </div>
      <div className="workout-header__actions">
        <button
          className="icon-button"
          type="button"
          onClick={onCancel}
          aria-label="Cancel workout"
        >
          <MoreVertical />
        </button>
        <Button type="button" onClick={onFinish}>
          Finish
        </Button>
      </div>
    </header>
  );
}
