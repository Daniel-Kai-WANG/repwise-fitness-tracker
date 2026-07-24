import type { Exercise, ExerciseDraft } from '../../types/exercise';
import { nowIso } from '../../utils/date';
import { createId } from '../../utils/ids';
import { db, type FitnessDatabase } from '../database';

export async function createExercise(
  draft: ExerciseDraft,
  database: FitnessDatabase = db
) {
  const duplicate = await database.exercises
    .filter(
      (exercise) =>
        exercise.name.toLowerCase() === draft.name.trim().toLowerCase()
    )
    .first();
  if (duplicate) throw new Error('An exercise with this name already exists.');
  const timestamp = nowIso();
  const exercise: Exercise = {
    ...draft,
    id: createId(),
    name: draft.name.trim(),
    notes: draft.notes?.trim() || undefined,
    isArchived: false,
    isCustom: true,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  await database.exercises.add(exercise);
  return exercise;
}

export async function updateExercise(
  id: string,
  changes: Partial<ExerciseDraft>,
  database: FitnessDatabase = db
) {
  await database.exercises.update(id, { ...changes, updatedAt: nowIso() });
}

export async function setExerciseArchived(
  id: string,
  isArchived: boolean,
  database: FitnessDatabase = db
) {
  await database.exercises.update(id, { isArchived, updatedAt: nowIso() });
}
