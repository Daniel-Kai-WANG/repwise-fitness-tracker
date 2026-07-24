import { Award } from 'lucide-react';
import { calculateExercisePerformance } from '../../services/workoutCalculations';
import { createWorkoutSummary } from '../../services/workoutSummary';
import type { Exercise } from '../../types/exercise';
import type { WeightUnit } from '../../types/settings';
import type { WorkoutBundle } from '../../types/workout';
import { formatDuration, formatShortDate } from '../../utils/date';
import { formatVolume, kilogramsToDisplay } from '../../utils/number';
import { Card } from '../common/Card';

interface WorkoutSummaryProps {
  bundle: WorkoutBundle;
  exercises: Exercise[];
  unit: WeightUnit;
  records?: Map<string, string[]>;
  comparisons?: Map<string, string>;
}

export function WorkoutSummary({
  bundle,
  exercises,
  unit,
  records = new Map(),
  comparisons = new Map()
}: WorkoutSummaryProps) {
  const exerciseMap = new Map(
    exercises.map((exercise) => [exercise.id, exercise])
  );
  const summary = createWorkoutSummary(bundle.exercises, bundle.sets);
  return (
    <div className="page-stack">
      <div className="summary-hero">
        <p className="eyebrow">
          {formatShortDate(
            bundle.workout.completedAt ?? bundle.workout.startedAt
          )}
        </p>
        <h1>{bundle.workout.name}</h1>
        <p>{formatDuration(bundle.workout.durationSeconds)} training time</p>
      </div>
      <div className="stats-grid">
        <div>
          <strong>{formatVolume(summary.volume, unit)}</strong>
          <span>Volume</span>
        </div>
        <div>
          <strong>{summary.completedSets}</strong>
          <span>Sets</span>
        </div>
        <div>
          <strong>{summary.totalRepetitions}</strong>
          <span>Reps</span>
        </div>
        <div>
          <strong>{summary.exerciseCount}</strong>
          <span>Exercises</span>
        </div>
      </div>
      {bundle.exercises.map((workoutExercise) => {
        const exercise = exerciseMap.get(workoutExercise.exerciseId);
        const sets = bundle.sets.filter(
          (set) =>
            set.workoutExerciseId === workoutExercise.id && set.isCompleted
        );
        const performance = calculateExercisePerformance(sets);
        const earned = records.get(workoutExercise.exerciseId) ?? [];
        const comparison = comparisons.get(workoutExercise.exerciseId);
        return (
          <Card className="summary-exercise" key={workoutExercise.id}>
            <div className="summary-exercise__header">
              <h2>{exercise?.name ?? 'Missing exercise'}</h2>
              <strong>{formatVolume(performance.volume, unit)}</strong>
            </div>
            <div className="set-breakdown">
              {sets.map((set) => (
                <span key={set.id}>
                  {set.isWarmup && 'W · '}
                  {exercise?.trackingType === 'duration'
                    ? `${set.durationSeconds ?? 0}s`
                    : exercise?.trackingType === 'reps-only'
                      ? `${set.reps ?? 0} reps`
                      : `${kilogramsToDisplay(set.weight ?? 0, unit)} ${unit} × ${set.reps ?? 0}`}
                </span>
              ))}
            </div>
            <div className="metric-line">
              <span>
                Best weight{' '}
                <strong>
                  {kilogramsToDisplay(performance.bestWeight, unit)} {unit}
                </strong>
              </span>
              <span>
                Est. 1RM{' '}
                <strong>
                  {kilogramsToDisplay(performance.bestEstimatedOneRepMax, unit)}{' '}
                  {unit}
                </strong>
              </span>
            </div>
            {comparison && <p className="comparison-line">{comparison}</p>}
            {earned.length > 0 && (
              <div className="record-list">
                <Award size={17} /> {earned.join(' · ')}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
