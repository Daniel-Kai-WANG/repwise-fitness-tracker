import { Archive, ChevronRight, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Exercise } from '../../types/exercise';
import { Card } from '../common/Card';

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
  return (
    <Card className="exercise-card">
      <Link className="exercise-card__main" to={`/exercises/${exercise.id}`}>
        <div>
          <h2>{exercise.name}</h2>
          <p>
            {exercise.category} · {exercise.equipment}
          </p>
        </div>
        <ChevronRight size={20} aria-hidden="true" />
      </Link>
      <div className="exercise-card__actions">
        {exercise.isCustom && (
          <button type="button" onClick={() => onEdit(exercise)}>
            Edit
          </button>
        )}
        <button type="button" onClick={() => onToggleArchive(exercise)}>
          {exercise.isArchived ? (
            <RotateCcw size={16} />
          ) : (
            <Archive size={16} />
          )}
          {exercise.isArchived ? 'Restore' : 'Archive'}
        </button>
      </div>
    </Card>
  );
}
