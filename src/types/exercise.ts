export const exerciseCategories = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'legs',
  'core',
  'cardio',
  'other'
] as const;

export const equipmentTypes = [
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'bodyweight',
  'smith-machine',
  'other'
] as const;

export type ExerciseCategory = (typeof exerciseCategories)[number];
export type Equipment = (typeof equipmentTypes)[number];
export type TrackingType = 'weight-reps' | 'reps-only' | 'duration';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  equipment: Equipment;
  trackingType: TrackingType;
  notes?: string;
  isArchived: boolean;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ExerciseDraft = Pick<
  Exercise,
  'name' | 'category' | 'equipment' | 'trackingType' | 'notes'
>;
