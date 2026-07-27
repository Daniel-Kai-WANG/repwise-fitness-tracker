import type {
  BackupMergeCounts,
  BackupMergePreview,
  BackupSummary,
  FitnessTrackerBackup
} from '../types/backup';
import { equipmentTypes, exerciseCategories } from '../types/exercise';
import { nowIso } from '../utils/date';
import { db, type FitnessDatabase } from '../db/database';

const schemaVersion = 1;
const tableNames = [
  'exercises',
  'templates',
  'workouts',
  'workoutExercises',
  'workoutSets',
  'settings'
] as const;
const trackingTypes = ['weight-reps', 'reps-only', 'duration'];
const workoutStatuses = ['active', 'completed', 'cancelled'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasStringId(value: unknown) {
  return isRecord(value) && typeof value.id === 'string' && value.id.length > 0;
}

function hasValidTimestamp(value: unknown, field: string) {
  return (
    isRecord(value) &&
    typeof value[field] === 'string' &&
    Number.isFinite(Date.parse(value[field]))
  );
}

function hasOptionalTimestamp(value: Record<string, unknown>, field: string) {
  return value[field] === undefined || hasValidTimestamp(value, field);
}

function isOptionalNonNegativeNumber(value: unknown) {
  return (
    value === undefined ||
    (typeof value === 'number' && Number.isFinite(value) && value >= 0)
  );
}

function isTemplateExercise(value: unknown) {
  if (!isRecord(value)) return false;
  return (
    typeof value.exerciseId === 'string' &&
    Number.isInteger(value.order) &&
    isOptionalNonNegativeNumber(value.targetSets) &&
    isOptionalNonNegativeNumber(value.targetRepsMin) &&
    isOptionalNonNegativeNumber(value.targetRepsMax) &&
    isOptionalNonNegativeNumber(value.targetWeight) &&
    isOptionalNonNegativeNumber(value.restSeconds)
  );
}

function hasRequiredFields(
  tableName: (typeof tableNames)[number],
  value: unknown
) {
  if (
    !hasStringId(value) ||
    !hasValidTimestamp(value, 'createdAt') ||
    !hasValidTimestamp(value, 'updatedAt')
  ) {
    return false;
  }
  if (!isRecord(value)) return false;
  switch (tableName) {
    case 'exercises':
      return (
        typeof value.name === 'string' &&
        exerciseCategories.includes(value.category as never) &&
        equipmentTypes.includes(value.equipment as never) &&
        trackingTypes.includes(String(value.trackingType)) &&
        typeof value.isArchived === 'boolean' &&
        typeof value.isCustom === 'boolean'
      );
    case 'templates':
      return (
        typeof value.name === 'string' &&
        Array.isArray(value.exercises) &&
        value.exercises.every(isTemplateExercise)
      );
    case 'workouts':
      return (
        typeof value.name === 'string' &&
        workoutStatuses.includes(String(value.status)) &&
        hasValidTimestamp(value, 'startedAt') &&
        hasOptionalTimestamp(value, 'completedAt') &&
        hasOptionalTimestamp(value, 'restTimerEndsAt') &&
        isOptionalNonNegativeNumber(value.durationSeconds)
      );
    case 'workoutExercises':
      return (
        typeof value.workoutId === 'string' &&
        typeof value.exerciseId === 'string' &&
        Number.isInteger(value.order) &&
        Number(value.order) >= 0
      );
    case 'workoutSets':
      return (
        typeof value.workoutId === 'string' &&
        typeof value.workoutExerciseId === 'string' &&
        typeof value.exerciseId === 'string' &&
        Number.isInteger(value.setNumber) &&
        Number(value.setNumber) >= 1 &&
        isOptionalNonNegativeNumber(value.weight) &&
        isOptionalNonNegativeNumber(value.reps) &&
        isOptionalNonNegativeNumber(value.durationSeconds) &&
        typeof value.isWarmup === 'boolean' &&
        typeof value.isCompleted === 'boolean' &&
        hasOptionalTimestamp(value, 'completedAt')
      );
    case 'settings':
      return (
        value.id === 'app-settings' &&
        (value.weightUnit === 'kg' || value.weightUnit === 'lb') &&
        (value.theme === 'light' ||
          value.theme === 'dark' ||
          value.theme === 'system') &&
        (value.language === undefined ||
          value.language === 'system' ||
          value.language === 'en' ||
          value.language === 'zh') &&
        (value.autoRestEnabled === undefined ||
          typeof value.autoRestEnabled === 'boolean') &&
        Number.isInteger(value.defaultRestSeconds) &&
        Number(value.defaultRestSeconds) >= 0 &&
        Number(value.defaultRestSeconds) <= 3600 &&
        typeof value.showWarmupSets === 'boolean' &&
        typeof value.hasCompletedOnboarding === 'boolean'
      );
  }
}

function validateRelationships(backup: FitnessTrackerBackup) {
  const issues: string[] = [];
  const exerciseIds = new Set(backup.data.exercises.map((record) => record.id));
  const workoutIds = new Set(backup.data.workouts.map((record) => record.id));
  const workoutExercises = new Map(
    backup.data.workoutExercises.map((record) => [record.id, record])
  );
  for (const template of backup.data.templates) {
    if (template.exercises.some((item) => !exerciseIds.has(item.exerciseId))) {
      issues.push(`Template ${template.id} references a missing exercise.`);
    }
  }
  for (const workoutExercise of backup.data.workoutExercises) {
    if (!workoutIds.has(workoutExercise.workoutId)) {
      issues.push(`Workout exercise ${workoutExercise.id} has no workout.`);
    }
    if (!exerciseIds.has(workoutExercise.exerciseId)) {
      issues.push(`Workout exercise ${workoutExercise.id} has no exercise.`);
    }
  }
  for (const set of backup.data.workoutSets) {
    const workoutExercise = workoutExercises.get(set.workoutExerciseId);
    if (
      !workoutIds.has(set.workoutId) ||
      !exerciseIds.has(set.exerciseId) ||
      !workoutExercise ||
      workoutExercise.workoutId !== set.workoutId ||
      workoutExercise.exerciseId !== set.exerciseId
    ) {
      issues.push(`Workout set ${set.id} has an invalid relationship.`);
    }
  }
  if (issues.length) throw new Error(issues.join(' '));
}

function canonicalise(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalise).join(',')}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalise(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

type MergeTableName = (typeof tableNames)[number];
type MergePlan = Record<MergeTableName, unknown[]>;

async function buildMergePlan(
  backup: FitnessTrackerBackup,
  database: FitnessDatabase
) {
  const counts: BackupMergeCounts = {
    add: 0,
    update: 0,
    conflicts: 0,
    invalid: 0,
    skipped: 0
  };
  const plan: MergePlan = {
    exercises: [],
    templates: [],
    workouts: [],
    workoutExercises: [],
    workoutSets: [],
    settings: []
  };
  const issues: string[] = [];
  for (const tableName of tableNames) {
    const incomingRecords = backup.data[tableName];
    const existingRecords = await database
      .table(tableName)
      .bulkGet(incomingRecords.map((record) => record.id));
    incomingRecords.forEach((incoming, index) => {
      const existing = existingRecords[index] as
        Record<string, unknown> | undefined;
      if (!existing) {
        counts.add += 1;
        plan[tableName].push(incoming);
        return;
      }
      const incomingTime = Date.parse(incoming.updatedAt);
      const existingTime = Date.parse(String(existing.updatedAt));
      if (incomingTime > existingTime) {
        counts.update += 1;
        plan[tableName].push(incoming);
      } else if (
        incomingTime < existingTime ||
        canonicalise(incoming) === canonicalise(existing)
      ) {
        counts.skipped += 1;
      } else {
        counts.conflicts += 1;
        issues.push(
          `${tableName} record ${incoming.id} has an equal-timestamp conflict.`
        );
      }
    });
  }
  return { counts, plan, issues };
}

export async function createBackup(
  appVersion: string,
  database: FitnessDatabase = db
): Promise<FitnessTrackerBackup> {
  const [
    exercises,
    templates,
    workouts,
    workoutExercises,
    workoutSets,
    settings
  ] = await Promise.all([
    database.exercises.toArray(),
    database.templates.toArray(),
    database.workouts.toArray(),
    database.workoutExercises.toArray(),
    database.workoutSets.toArray(),
    database.settings.toArray()
  ]);
  return {
    schemaVersion,
    appVersion,
    exportedAt: nowIso(),
    data: {
      exercises,
      templates,
      workouts,
      workoutExercises,
      workoutSets,
      settings
    }
  };
}

export function validateBackup(value: unknown): FitnessTrackerBackup {
  if (!isRecord(value))
    throw new Error('The selected file is not a valid Repwise backup.');
  if (value.schemaVersion !== schemaVersion)
    throw new Error(
      `Unsupported backup schema. This app supports schema version ${schemaVersion}.`
    );
  if (
    typeof value.appVersion !== 'string' ||
    typeof value.exportedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.exportedAt)) ||
    !isRecord(value.data)
  )
    throw new Error('The backup metadata is incomplete.');
  for (const tableName of tableNames) {
    const records = value.data[tableName];
    if (
      !Array.isArray(records) ||
      !records.every((record) => hasRequiredFields(tableName, record))
    )
      throw new Error(`The backup contains invalid ${tableName} records.`);
    if (new Set(records.map((record) => record.id)).size !== records.length)
      throw new Error(`The backup contains duplicate ${tableName} IDs.`);
  }
  const backup = value as unknown as FitnessTrackerBackup;
  validateRelationships(backup);
  return backup;
}

export async function createBackupMergePreview(
  value: unknown,
  database: FitnessDatabase = db
): Promise<BackupMergePreview> {
  try {
    const backup = validateBackup(value);
    const { counts, issues } = await buildMergePlan(backup, database);
    return {
      backup,
      counts,
      issues,
      canMerge: counts.conflicts === 0
    };
  } catch (error) {
    return {
      counts: { add: 0, update: 0, conflicts: 0, invalid: 1, skipped: 0 },
      issues: [
        error instanceof Error ? error.message : 'The backup is invalid.'
      ],
      canMerge: false
    };
  }
}

export async function mergeBackup(
  backup: FitnessTrackerBackup,
  database: FitnessDatabase = db
) {
  const validated = validateBackup(backup);
  return database.transaction(
    'rw',
    tableNames.map((tableName) => database.table(tableName)),
    async () => {
      const { counts, plan, issues } = await buildMergePlan(
        validated,
        database
      );
      if (issues.length) throw new Error(issues.join(' '));
      for (const tableName of tableNames) {
        if (plan[tableName].length) {
          await database.table(tableName).bulkPut(plan[tableName]);
        }
      }
      return counts;
    }
  );
}

export function summariseBackup(backup: FitnessTrackerBackup): BackupSummary {
  return {
    exercises: backup.data.exercises.length,
    templates: backup.data.templates.length,
    workouts: backup.data.workouts.length,
    sets: backup.data.workoutSets.length,
    exportedAt: backup.exportedAt
  };
}

export async function replaceWithBackup(
  backup: FitnessTrackerBackup,
  database: FitnessDatabase = db
) {
  const validated = validateBackup(backup);
  await database.transaction(
    'rw',
    [
      database.exercises,
      database.templates,
      database.workouts,
      database.workoutExercises,
      database.workoutSets,
      database.settings
    ],
    async () => {
      await Promise.all([
        database.exercises.clear(),
        database.templates.clear(),
        database.workouts.clear(),
        database.workoutExercises.clear(),
        database.workoutSets.clear(),
        database.settings.clear()
      ]);
      await database.exercises.bulkAdd(validated.data.exercises);
      await database.templates.bulkAdd(validated.data.templates);
      await database.workouts.bulkAdd(validated.data.workouts);
      await database.workoutExercises.bulkAdd(validated.data.workoutExercises);
      await database.workoutSets.bulkAdd(validated.data.workoutSets);
      await database.settings.bulkAdd(validated.data.settings);
    }
  );
}

export async function deleteAllLocalData(database: FitnessDatabase = db) {
  await database.transaction(
    'rw',
    [
      database.exercises,
      database.templates,
      database.workouts,
      database.workoutExercises,
      database.workoutSets,
      database.settings
    ],
    async () => {
      await Promise.all([
        database.exercises.clear(),
        database.templates.clear(),
        database.workouts.clear(),
        database.workoutExercises.clear(),
        database.workoutSets.clear(),
        database.settings.clear()
      ]);
    }
  );
}
