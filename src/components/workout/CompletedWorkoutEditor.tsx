import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { saveCompletedWorkoutEdit } from '../../db/repositories/workoutRepository';
import {
  createCompletedWorkoutDraft,
  moveCompletedWorkoutToDate
} from '../../services/completedWorkoutEditing';
import type { Exercise } from '../../types/exercise';
import type { WeightUnit } from '../../types/settings';
import type { WorkoutBundle, WorkoutSet } from '../../types/workout';
import type { CompletedWorkoutExerciseDraft } from '../../types/workoutEdit';
import { getLocalDateKey, nowIso } from '../../utils/date';
import { createId } from '../../utils/ids';
import { displayToKilograms, kilogramsToDisplay } from '../../utils/number';
import { Button } from '../common/Button';

interface CompletedWorkoutEditorProps {
  bundle: WorkoutBundle;
  exercises: Exercise[];
  unit: WeightUnit;
  onCancel: () => void;
  onSaved: () => void;
}

function optionalNumber(value: string) {
  return value.trim() === '' ? undefined : Number(value);
}

export function CompletedWorkoutEditor({
  bundle,
  exercises,
  unit,
  onCancel,
  onSaved
}: CompletedWorkoutEditorProps) {
  const [draft, setDraft] = useState(() => createCompletedWorkoutDraft(bundle));
  const [error, setError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const exerciseMap = new Map(
    exercises.map((exercise) => [exercise.id, exercise])
  );

  const updateExercise = (
    exerciseId: string,
    updater: (
      exercise: CompletedWorkoutExerciseDraft
    ) => CompletedWorkoutExerciseDraft
  ) => {
    setDraft((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) =>
        exercise.id === exerciseId ? updater(exercise) : exercise
      )
    }));
  };

  const updateSet = (
    exerciseId: string,
    setId: string,
    changes: Partial<WorkoutSet>
  ) => {
    updateExercise(exerciseId, (exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) =>
        set.id === setId ? { ...set, ...changes } : set
      )
    }));
  };

  const moveExercise = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= draft.exercises.length) return;
    const next = [...draft.exercises];
    [next[index], next[destination]] = [next[destination], next[index]];
    setDraft({ ...draft, exercises: next });
  };

  const addSet = (exercise: CompletedWorkoutExerciseDraft) => {
    const source = exercise.sets.at(-1);
    const timestamp = nowIso();
    const set: WorkoutSet = {
      id: createId(),
      workoutId: draft.workoutId,
      workoutExerciseId: exercise.id,
      exerciseId: exercise.exerciseId,
      setNumber: exercise.sets.length + 1,
      weight: source?.weight,
      reps: source?.reps,
      durationSeconds: source?.durationSeconds,
      isWarmup: false,
      isCompleted: true,
      completedAt: draft.completedAt,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    updateExercise(exercise.id, (current) => ({
      ...current,
      sets: [...current.sets, set]
    }));
  };

  const handleSave = async () => {
    setError(undefined);
    setIsSaving(true);
    try {
      await saveCompletedWorkoutEdit(draft);
      onSaved();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'The workout could not be saved.'
      );
      setIsSaving(false);
    }
  };

  return (
    <div className="completed-workout-editor page-stack">
      <div className="edit-warning" role="note">
        Editing completed data recalculates workout analytics, personal records,
        previous-session comparisons, and progress charts.
      </div>
      <div className="field-grid">
        <label className="field">
          <span>Workout name</span>
          <input
            value={draft.name}
            maxLength={80}
            onChange={(event) =>
              setDraft({ ...draft, name: event.target.value })
            }
          />
        </label>
        <label className="field">
          <span>Workout date</span>
          <input
            type="date"
            value={getLocalDateKey(draft.completedAt)}
            onChange={(event) =>
              setDraft(moveCompletedWorkoutToDate(draft, event.target.value))
            }
          />
        </label>
      </div>
      <label className="field">
        <span>Workout notes</span>
        <textarea
          rows={3}
          value={draft.notes ?? ''}
          onChange={(event) =>
            setDraft({ ...draft, notes: event.target.value })
          }
        />
      </label>
      {draft.exercises.map((workoutExercise, exerciseIndex) => {
        const exercise = exerciseMap.get(workoutExercise.exerciseId);
        return (
          <article className="completed-edit-exercise" key={workoutExercise.id}>
            <div className="completed-edit-exercise__header">
              <h2>{exercise?.name ?? 'Missing exercise'}</h2>
              <div className="compact-actions">
                <button
                  type="button"
                  disabled={exerciseIndex === 0}
                  onClick={() => moveExercise(exerciseIndex, -1)}
                  aria-label={`Move ${exercise?.name ?? 'exercise'} up`}
                >
                  <ArrowUp size={17} />
                </button>
                <button
                  type="button"
                  disabled={exerciseIndex === draft.exercises.length - 1}
                  onClick={() => moveExercise(exerciseIndex, 1)}
                  aria-label={`Move ${exercise?.name ?? 'exercise'} down`}
                >
                  <ArrowDown size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Remove ${exercise?.name ?? 'this exercise'} and all of its sets?`
                      )
                    ) {
                      setDraft({
                        ...draft,
                        exercises: draft.exercises.filter(
                          (item) => item.id !== workoutExercise.id
                        )
                      });
                    }
                  }}
                  aria-label={`Remove ${exercise?.name ?? 'exercise'}`}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
            <div className="completed-edit-sets">
              {workoutExercise.sets.map((set) => (
                <div className="completed-edit-set" key={set.id}>
                  <strong>{set.setNumber}</strong>
                  {exercise?.trackingType === 'weight-reps' && (
                    <label>
                      <span>{unit.toUpperCase()}</span>
                      <input
                        aria-label={`${exercise.name} set ${set.setNumber} weight`}
                        inputMode="decimal"
                        type="number"
                        min="0"
                        step="0.1"
                        value={
                          set.weight === undefined
                            ? ''
                            : kilogramsToDisplay(set.weight, unit)
                        }
                        onChange={(event) => {
                          const value = optionalNumber(event.target.value);
                          updateSet(workoutExercise.id, set.id, {
                            weight:
                              value === undefined
                                ? undefined
                                : displayToKilograms(value, unit)
                          });
                        }}
                      />
                    </label>
                  )}
                  {exercise?.trackingType !== 'duration' && (
                    <label>
                      <span>Reps</span>
                      <input
                        aria-label={`${exercise?.name ?? 'Exercise'} set ${set.setNumber} repetitions`}
                        inputMode="numeric"
                        type="number"
                        min="0"
                        step="1"
                        value={set.reps ?? ''}
                        onChange={(event) =>
                          updateSet(workoutExercise.id, set.id, {
                            reps: optionalNumber(event.target.value)
                          })
                        }
                      />
                    </label>
                  )}
                  {exercise?.trackingType === 'duration' && (
                    <label className="completed-edit-set__duration">
                      <span>Seconds</span>
                      <input
                        aria-label={`${exercise.name} set ${set.setNumber} duration`}
                        inputMode="numeric"
                        type="number"
                        min="0"
                        step="1"
                        value={set.durationSeconds ?? ''}
                        onChange={(event) =>
                          updateSet(workoutExercise.id, set.id, {
                            durationSeconds: optionalNumber(event.target.value)
                          })
                        }
                      />
                    </label>
                  )}
                  <label className="completed-edit-set__warmup">
                    <input
                      type="checkbox"
                      checked={set.isWarmup}
                      onChange={(event) =>
                        updateSet(workoutExercise.id, set.id, {
                          isWarmup: event.target.checked
                        })
                      }
                    />
                    <span>Warm-up</span>
                  </label>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() =>
                      updateExercise(workoutExercise.id, (current) => ({
                        ...current,
                        sets: current.sets.filter((item) => item.id !== set.id)
                      }))
                    }
                    aria-label={`Remove set ${set.setNumber} from ${exercise?.name ?? 'exercise'}`}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => addSet(workoutExercise)}
            >
              <Plus size={17} /> Add set
            </Button>
          </article>
        );
      })}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="edit-workout-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel editing
        </Button>
        <Button type="button" disabled={isSaving} onClick={handleSave}>
          {isSaving ? 'Saving…' : 'Save workout'}
        </Button>
      </div>
    </div>
  );
}
