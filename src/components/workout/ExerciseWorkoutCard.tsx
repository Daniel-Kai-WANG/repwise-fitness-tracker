import { ArrowDown, ArrowUp, MoreHorizontal, Plus } from 'lucide-react';
import { useState } from 'react';
import {
  addSet,
  deleteWorkoutSet,
  removeWorkoutExercise,
  reorderWorkoutExercise,
  updateWorkoutExercise,
  updateWorkoutSet
} from '../../db/repositories/workoutRepository';
import type { Exercise } from '../../types/exercise';
import type { WeightUnit } from '../../types/settings';
import type { WorkoutExercise, WorkoutSet } from '../../types/workout';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { PreviousPerformance } from './PreviousPerformance';
import { SetRow } from './SetRow';

interface ExerciseWorkoutCardProps {
  workoutExercise: WorkoutExercise;
  exercise: Exercise;
  sets: WorkoutSet[];
  previousSets: WorkoutSet[];
  unit: WeightUnit;
  canMoveUp: boolean;
  canMoveDown: boolean;
  showWarmupSets: boolean;
  onReplace: () => void;
  onSetCompleted: (set: WorkoutSet, previousSets: WorkoutSet[]) => void;
}

export function ExerciseWorkoutCard({
  workoutExercise,
  exercise,
  sets,
  previousSets,
  unit,
  canMoveUp,
  canMoveDown,
  showWarmupSets,
  onReplace,
  onSetCompleted
}: ExerciseWorkoutCardProps) {
  const [showActions, setShowActions] = useState(false);
  const handleAddSet = async () => {
    const lastCurrent = sets.at(-1);
    const correspondingPrevious = previousSets[sets.length];
    const source = lastCurrent ?? correspondingPrevious;
    await addSet(
      workoutExercise,
      undefined,
      source
        ? {
            weight: source.weight,
            reps: source.reps,
            durationSeconds: source.durationSeconds
          }
        : {}
    );
  };
  return (
    <Card className="workout-exercise-card">
      <div className="workout-exercise-card__header">
        <div>
          <h2>{exercise.name}</h2>
          {workoutExercise.notes && <p>{workoutExercise.notes}</p>}
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={() => setShowActions((value) => !value)}
          aria-label={`${exercise.name} actions`}
          aria-expanded={showActions}
        >
          <MoreHorizontal />
        </button>
      </div>
      {showActions && (
        <div className="exercise-action-bar">
          <button
            type="button"
            disabled={!canMoveUp}
            onClick={() =>
              reorderWorkoutExercise(
                workoutExercise.workoutId,
                workoutExercise.id,
                -1
              )
            }
          >
            <ArrowUp size={16} /> Up
          </button>
          <button
            type="button"
            disabled={!canMoveDown}
            onClick={() =>
              reorderWorkoutExercise(
                workoutExercise.workoutId,
                workoutExercise.id,
                1
              )
            }
          >
            <ArrowDown size={16} /> Down
          </button>
          <button
            type="button"
            onClick={() => {
              const notes = window.prompt(
                'Exercise notes',
                workoutExercise.notes ?? ''
              );
              if (notes !== null)
                updateWorkoutExercise(workoutExercise.id, { notes });
            }}
          >
            Note
          </button>
          <button type="button" onClick={onReplace}>
            Replace
          </button>
          <button
            type="button"
            onClick={() =>
              window.confirm(`Remove ${exercise.name} from this workout?`) &&
              removeWorkoutExercise(workoutExercise.id)
            }
          >
            Remove
          </button>
        </div>
      )}
      <PreviousPerformance sets={previousSets} unit={unit} />
      <div className="set-table-header">
        <span>Set</span>
        <span>Previous</span>
        <span>
          {exercise.trackingType === 'duration'
            ? 'Seconds'
            : exercise.trackingType === 'reps-only'
              ? 'Reps'
              : unit.toUpperCase()}
        </span>
        {exercise.trackingType === 'weight-reps' && <span>Reps</span>}
        <span>Done</span>
        <span />
      </div>
      <div className="set-list">
        {sets
          .filter((set) => showWarmupSets || !set.isWarmup)
          .map((set) => {
            const index = sets.findIndex((item) => item.id === set.id);
            return (
              <div className="set-row-wrap" key={set.id}>
                <SetRow
                  set={set}
                  previous={previousSets[index]}
                  trackingType={exercise.trackingType}
                  unit={unit}
                  onDelete={() =>
                    window.confirm(`Delete set ${set.setNumber}?`) &&
                    deleteWorkoutSet(set.id)
                  }
                  onCompleted={(completedSet) =>
                    onSetCompleted(completedSet, previousSets)
                  }
                />
                <button
                  className={
                    set.isWarmup ? 'warmup-toggle is-active' : 'warmup-toggle'
                  }
                  type="button"
                  onClick={() =>
                    updateWorkoutSet(set.id, { isWarmup: !set.isWarmup })
                  }
                  aria-pressed={set.isWarmup}
                >
                  {set.isWarmup ? 'Warm-up' : 'Mark warm-up'}
                </button>
              </div>
            );
          })}
      </div>
      <Button
        type="button"
        variant="secondary"
        fullWidth
        onClick={handleAddSet}
      >
        <Plus size={18} /> Add set
      </Button>
    </Card>
  );
}
