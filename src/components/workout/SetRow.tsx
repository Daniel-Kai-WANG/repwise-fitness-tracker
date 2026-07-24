import { Check, Flame, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { updateWorkoutSet } from '../../db/repositories/workoutRepository';
import {
  validateDuration,
  validateRepetitions,
  validateWeight
} from '../../services/validation';
import type { TrackingType } from '../../types/exercise';
import type { WeightUnit } from '../../types/settings';
import type { WorkoutSet } from '../../types/workout';
import { displayToKilograms, kilogramsToDisplay } from '../../utils/number';

interface SetRowProps {
  set: WorkoutSet;
  previous?: WorkoutSet;
  trackingType: TrackingType;
  unit: WeightUnit;
  onDelete: () => void;
  onCompleted: (set: WorkoutSet) => void;
}

function optionalNumber(value: string) {
  return value.trim() === '' ? undefined : Number(value);
}

export function SetRow({
  set,
  previous,
  trackingType,
  unit,
  onDelete,
  onCompleted
}: SetRowProps) {
  const [weight, setWeight] = useState(
    set.weight === undefined ? '' : String(kilogramsToDisplay(set.weight, unit))
  );
  const [reps, setReps] = useState(
    set.reps === undefined ? '' : String(set.reps)
  );
  const [duration, setDuration] = useState(
    set.durationSeconds === undefined ? '' : String(set.durationSeconds)
  );
  const [error, setError] = useState<string>();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const displayWeight = optionalNumber(weight);
      updateWorkoutSet(set.id, {
        weight:
          displayWeight === undefined
            ? undefined
            : displayToKilograms(displayWeight, unit),
        reps: optionalNumber(reps),
        durationSeconds: optionalNumber(duration)
      }).catch(() => setError('Could not save this set.'));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [duration, reps, set.id, unit, weight]);

  const handleComplete = async () => {
    const displayWeight = optionalNumber(weight);
    const weightKg =
      displayWeight === undefined
        ? undefined
        : displayToKilograms(displayWeight, unit);
    const repetitionCount = optionalNumber(reps);
    const durationSeconds = optionalNumber(duration);
    const validationError =
      trackingType === 'duration'
        ? validateDuration(durationSeconds)
        : trackingType === 'reps-only'
          ? validateRepetitions(repetitionCount)
          : (validateWeight(weightKg) ?? validateRepetitions(repetitionCount));
    if (validationError) return setError(validationError);
    const completed = {
      ...set,
      weight: weightKg,
      reps: repetitionCount,
      durationSeconds,
      isCompleted: !set.isCompleted
    };
    await updateWorkoutSet(set.id, {
      weight: weightKg,
      reps: repetitionCount,
      durationSeconds,
      isCompleted: completed.isCompleted
    });
    setError(undefined);
    if (completed.isCompleted) onCompleted(completed);
  };

  const previousLabel = previous
    ? trackingType === 'duration'
      ? `${previous.durationSeconds ?? 0}s`
      : trackingType === 'reps-only'
        ? `${previous.reps ?? 0} reps`
        : `${kilogramsToDisplay(previous.weight ?? 0, unit)} × ${previous.reps ?? 0}`
    : '—';

  return (
    <div className={set.isCompleted ? 'set-row is-complete' : 'set-row'}>
      <span className="set-row__number">
        {set.isWarmup ? (
          <Flame size={15} aria-label="Warm-up" />
        ) : (
          set.setNumber
        )}
      </span>
      <span className="set-row__previous">{previousLabel}</span>
      {trackingType === 'weight-reps' && (
        <input
          aria-label={`Set ${set.setNumber} weight`}
          inputMode="decimal"
          type="number"
          min="0"
          step="0.1"
          value={weight}
          onChange={(event) => setWeight(event.target.value)}
        />
      )}
      {trackingType !== 'duration' && (
        <input
          aria-label={`Set ${set.setNumber} repetitions`}
          inputMode="numeric"
          type="number"
          min="0"
          step="1"
          value={reps}
          onChange={(event) => setReps(event.target.value)}
        />
      )}
      {trackingType === 'duration' && (
        <input
          className="set-row__wide-input"
          aria-label={`Set ${set.setNumber} duration seconds`}
          inputMode="numeric"
          type="number"
          min="0"
          step="1"
          value={duration}
          onChange={(event) => setDuration(event.target.value)}
        />
      )}
      <button
        className="set-row__complete"
        type="button"
        onClick={handleComplete}
        aria-label={
          set.isCompleted
            ? `Mark set ${set.setNumber} incomplete`
            : `Complete set ${set.setNumber}`
        }
        aria-pressed={set.isCompleted}
      >
        <Check size={20} />
      </button>
      <button
        className="set-row__delete"
        type="button"
        onClick={onDelete}
        aria-label={`Delete set ${set.setNumber}`}
      >
        <Trash2 size={17} />
      </button>
      {error && (
        <p className="set-row__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
