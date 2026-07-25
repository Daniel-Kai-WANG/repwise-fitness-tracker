import { Archive, ChevronRight, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Exercise } from '../../types/exercise';
import { Card } from '../common/Card';
import { useI18n } from '../../i18n/useI18n';
import { translateExerciseName } from '../../i18n/translations';

interface ExerciseCardProps {
  exercise: Exercise;
  onEdit: (exercise: Exercise) => void;
  onToggleArchive: (exercise: Exercise) => void;
}

export function ExerciseCard({
  exercise,
  onEdit,
  onToggleArchive
}: ExerciseCardProps) {
  const { language, t } = useI18n();
  return (
    <Card className="exercise-card">
      <Link className="exercise-card__main" to={`/exercises/${exercise.id}`}>
        <div>
          <h2>{translateExerciseName(language, exercise.name)}</h2>
          <p>
            {t(exercise.category)} · {t(exercise.equipment)}
          </p>
        </div>
        <ChevronRight size={20} aria-hidden="true" />
      </Link>
      <div className="exercise-card__actions">
        {exercise.isCustom && (
          <button type="button" onClick={() => onEdit(exercise)}>
            {t('Edit')}
          </button>
        )}
        <button type="button" onClick={() => onToggleArchive(exercise)}>
          {exercise.isArchived ? (
            <RotateCcw size={16} />
          ) : (
            <Archive size={16} />
          )}
          {t(exercise.isArchived ? 'Restore' : 'Archive')}
        </button>
      </div>
    </Card>
  );
}
