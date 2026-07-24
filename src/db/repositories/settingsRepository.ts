import type { AppSettings } from '../../types/settings';
import { nowIso } from '../../utils/date';
import { db, type FitnessDatabase } from '../database';
import { createDefaultSettings } from '../seed';

export async function getSettings(database: FitnessDatabase = db) {
  const settings = await database.settings.get('app-settings');
  if (settings) return settings;
  const defaults = createDefaultSettings();
  await database.settings.put(defaults);
  return defaults;
}

export async function updateSettings(
  changes: Partial<Omit<AppSettings, 'id' | 'createdAt'>>,
  database: FitnessDatabase = db
) {
  await database.settings.update('app-settings', {
    ...changes,
    updatedAt: nowIso()
  });
  return getSettings(database);
}
