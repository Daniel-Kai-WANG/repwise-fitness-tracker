import type {
  WorkoutTemplate,
  WorkoutTemplateDraft
} from '../../types/template';
import { nowIso } from '../../utils/date';
import { createId } from '../../utils/ids';
import { db, type FitnessDatabase } from '../database';

export async function saveTemplate(
  draft: WorkoutTemplateDraft,
  id?: string,
  database: FitnessDatabase = db
) {
  const existing = id ? await database.templates.get(id) : undefined;
  const timestamp = nowIso();
  const template: WorkoutTemplate = {
    id: id ?? createId(),
    name: draft.name.trim(),
    description: draft.description?.trim() || undefined,
    exercises: draft.exercises.map((exercise, order) => ({
      ...exercise,
      order
    })),
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp
  };
  await database.templates.put(template);
  return template;
}

export async function deleteTemplate(
  id: string,
  database: FitnessDatabase = db
) {
  await database.templates.delete(id);
}
