import type { WorkoutBundle } from '../types/workout';
import type {
  CompletedWorkoutEditDraft,
  CompletedWorkoutExerciseDraft
} from '../types/workoutEdit';
import {
  fieldLimits,
  validateName,
  validateRepetitions,
  validateWeight
} from './validation';

export function createCompletedWorkoutDraft(
  bundle: WorkoutBundle
): CompletedWorkoutEditDraft {
  if (bundle.workout.status !== 'completed' || !bundle.workout.completedAt) {
    throw new Error('Only completed workouts can be edited.');
  }
  return {
    workoutId: bundle.workout.id,
    name: bundle.workout.name,
    notes: bundle.workout.notes,
    startedAt: bundle.workout.startedAt,
    completedAt: bundle.workout.completedAt,
    exercises: bundle.exercises.map((exercise) => ({
      ...exercise,
      sets: bundle.sets
        .filter((set) => set.workoutExerciseId === exercise.id)
        .sort((a, b) => a.setNumber - b.setNumber)
        .map((set) => ({ ...set }))
    }))
  };
}

export function moveCompletedWorkoutToDate(
  draft: CompletedWorkoutEditDraft,
  localDate: string
) {
  const [year, month, day] = localDate.split('-').map(Number);
  if (!year || !month || !day) return draft;
  const currentCompleted = new Date(draft.completedAt);
  const nextCompleted = new Date(currentCompleted);
  nextCompleted.setFullYear(year, month - 1, day);
  const shiftMilliseconds =
    nextCompleted.getTime() - currentCompleted.getTime();
  return {
    ...draft,
    startedAt: new Date(
      new Date(draft.startedAt).getTime() + shiftMilliseconds
    ).toISOString(),
    completedAt: nextCompleted.toISOString()
  };
}

export function normaliseCompletedWorkoutDraft(
  draft: CompletedWorkoutEditDraft
): CompletedWorkoutEditDraft {
  return {
    ...draft,
    name: draft.name.trim(),
    notes: draft.notes?.trim() || undefined,
    exercises: draft.exercises.map(
      (exercise, order): CompletedWorkoutExerciseDraft => ({
        ...exercise,
        order,
        sets: exercise.sets.map((set, index) => ({
          ...set,
          setNumber: index + 1,
          isCompleted: true
        }))
      })
    )
  };
}

export function validateCompletedWorkoutDraft(
  draft: CompletedWorkoutEditDraft
) {
  const nameError = validateName(draft.name);
  if (nameError) throw new Error(nameError);
  if (!draft.exercises.length) throw new Error('Keep at least one exercise.');
  if (!Number.isFinite(new Date(draft.startedAt).getTime())) {
    throw new Error('The workout start date is invalid.');
  }
  if (!Number.isFinite(new Date(draft.completedAt).getTime())) {
    throw new Error('The workout completion date is invalid.');
  }
  if (new Date(draft.completedAt) < new Date(draft.startedAt)) {
    throw new Error('The workout completion date cannot precede its start.');
  }
  const exerciseIds = new Set<string>();
  const setIds = new Set<string>();
  for (const exercise of draft.exercises) {
    if (exerciseIds.has(exercise.id)) {
      throw new Error('Duplicate workout exercise IDs are not allowed.');
    }
    exerciseIds.add(exercise.id);
    for (const set of exercise.sets) {
      if (setIds.has(set.id)) {
        throw new Error('Duplicate workout set IDs are not allowed.');
      }
      setIds.add(set.id);
      if (set.weight !== undefined) {
        const error = validateWeight(set.weight);
        if (error) throw new Error(error);
      }
      if (set.reps !== undefined) {
        const error = validateRepetitions(set.reps);
        if (error) throw new Error(error);
      }
      if (
        set.durationSeconds !== undefined &&
        (!Number.isInteger(set.durationSeconds) ||
          set.durationSeconds < 0 ||
          set.durationSeconds > fieldLimits.durationSeconds)
      ) {
        throw new Error(
          'Set duration must be a valid whole number of seconds.'
        );
      }
    }
  }
}
