import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FitnessDatabase } from '../db/database';
import { createDefaultSettings } from '../db/seed';
import {
  createBackupMergePreview,
  createBackup,
  mergeBackup,
  replaceWithBackup,
  validateBackup
} from './backupService';

let database: FitnessDatabase;
beforeEach(() => {
  database = new FitnessDatabase(`backup-test-${crypto.randomUUID()}`);
});
afterEach(async () => {
  await database.delete();
});

describe('backup service', () => {
  const exercise = (name: string, updatedAt: string) => ({
    id: 'shared-exercise',
    name,
    category: 'chest' as const,
    equipment: 'barbell' as const,
    trackingType: 'weight-reps' as const,
    isArchived: false,
    isCustom: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt
  });

  it('rejects corrupt and unsupported files before changing data', () => {
    expect(() => validateBackup({ schemaVersion: 99 })).toThrow(
      'Unsupported backup schema'
    );
    expect(() =>
      validateBackup({
        schemaVersion: 1,
        appVersion: '1',
        exportedAt: '2026-01-01T00:00:00.000Z',
        data: {}
      })
    ).toThrow('invalid exercises');
  });

  it('rejects invalid metadata and record values', async () => {
    const backup = await createBackup('1.0.0', database);
    expect(() => validateBackup({ ...backup, exportedAt: 'today' })).toThrow(
      'metadata is incomplete'
    );
    backup.data.exercises.push({
      ...exercise('Invalid category', '2026-02-01T00:00:00.000Z'),
      category: 'unknown' as never
    });
    expect(() => validateBackup(backup)).toThrow('invalid exercises');
  });

  it('exports and transactionally restores every table', async () => {
    await database.settings.add(createDefaultSettings());
    const backup = await createBackup('0.1.0', database);
    delete backup.data.settings[0].autoRestEnabled;
    await database.settings.clear();
    await replaceWithBackup(backup, database);
    expect(await database.settings.get('app-settings')).toMatchObject({
      weightUnit: 'kg'
    });
  });

  it('does not erase current data when validation fails', async () => {
    await database.settings.add(createDefaultSettings());
    await expect(
      replaceWithBackup({ schemaVersion: 2 } as never, database)
    ).rejects.toThrow();
    expect(await database.settings.count()).toBe(1);
  });

  it('previews and merges additions, newer updates, and older skips', async () => {
    const source = new FitnessDatabase(`backup-source-${crypto.randomUUID()}`);
    await source.exercises.bulkAdd([
      exercise('Remote newer', '2026-03-01T00:00:00.000Z'),
      {
        ...exercise('Remote older', '2026-01-01T00:00:00.000Z'),
        id: 'older-exercise'
      },
      {
        ...exercise('Remote addition', '2026-02-01T00:00:00.000Z'),
        id: 'new-exercise'
      }
    ]);
    const backup = await createBackup('1.0.0', source);
    await source.delete();
    await database.exercises.bulkAdd([
      exercise('Local older', '2026-02-01T00:00:00.000Z'),
      {
        ...exercise('Local newer', '2026-04-01T00:00:00.000Z'),
        id: 'older-exercise'
      },
      {
        ...exercise('Local only', '2026-02-01T00:00:00.000Z'),
        id: 'local-exercise'
      }
    ]);

    const preview = await createBackupMergePreview(backup, database);
    expect(preview.canMerge).toBe(true);
    expect(preview.counts).toMatchObject({ add: 1, update: 1, skipped: 1 });
    await mergeBackup(backup, database);

    expect(await database.exercises.get('shared-exercise')).toMatchObject({
      name: 'Remote newer'
    });
    expect(await database.exercises.get('older-exercise')).toMatchObject({
      name: 'Local newer'
    });
    expect(await database.exercises.get('new-exercise')).toBeTruthy();
    expect(await database.exercises.get('local-exercise')).toBeTruthy();
  });

  it('blocks equal-timestamp conflicts and rolls back all planned additions', async () => {
    const source = new FitnessDatabase(`backup-source-${crypto.randomUUID()}`);
    await source.exercises.bulkAdd([
      exercise('Remote conflict', '2026-02-01T00:00:00.000Z'),
      {
        ...exercise('New record', '2026-02-01T00:00:00.000Z'),
        id: 'new-exercise'
      }
    ]);
    const backup = await createBackup('1.0.0', source);
    await source.delete();
    await database.exercises.add(
      exercise('Local conflict', '2026-02-01T00:00:00.000Z')
    );

    const preview = await createBackupMergePreview(backup, database);
    expect(preview.canMerge).toBe(false);
    expect(preview.counts.conflicts).toBe(1);
    await expect(mergeBackup(backup, database)).rejects.toThrow(
      'equal-timestamp conflict'
    );
    expect(await database.exercises.get('shared-exercise')).toMatchObject({
      name: 'Local conflict'
    });
    expect(await database.exercises.get('new-exercise')).toBeUndefined();
  });

  it('reports orphaned relationships as invalid before import', async () => {
    const backup = await createBackup('1.0.0', database);
    backup.data.workoutExercises.push({
      id: 'orphan',
      workoutId: 'missing-workout',
      exerciseId: 'missing-exercise',
      order: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    });

    const preview = await createBackupMergePreview(backup, database);
    expect(preview.canMerge).toBe(false);
    expect(preview.counts.invalid).toBe(1);
    expect(preview.issues.join(' ')).toContain('has no workout');
  });
});
