import { calculateExercisePerformance } from '../../services/workoutCalculations';
import type { WeightUnit } from '../../types/settings';
import type { WorkoutSet } from '../../types/workout';
import { formatShortDate } from '../../utils/date';
import { formatVolume, kilogramsToDisplay } from '../../utils/number';

export function PreviousPerformance({
  sets,
  unit
}: {
  sets: WorkoutSet[];
  unit: WeightUnit;
}) {
  if (!sets.length)
    return <p className="previous-performance">First recorded session</p>;
  const performance = calculateExercisePerformance(sets);
  return (
    <div className="previous-performance">
      <strong>
        Previous · {formatShortDate(sets[0].completedAt ?? sets[0].updatedAt)}
      </strong>
      <span>
        {sets
          .map(
            (set) =>
              `${kilogramsToDisplay(set.weight ?? 0, unit)} × ${set.reps ?? 0}`
          )
          .join(' · ')}
      </span>
      <span>
        {formatVolume(performance.volume, unit)} volume · est.{' '}
        {kilogramsToDisplay(performance.bestEstimatedOneRepMax, unit)} {unit}{' '}
        1RM
      </span>
    </div>
  );
}
