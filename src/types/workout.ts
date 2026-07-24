export type WorkoutStatus = 'active' | 'completed' | 'cancelled';

export interface WorkoutSession {
  id: string;
  templateId?: string;
  name: string;
  status: WorkoutStatus;
  startedAt: string;
  completedAt?: string;
  notes?: string;
  durationSeconds?: number;
  restTimerEndsAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  order: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSet {
  id: string;
  workoutId: string;
  workoutExerciseId: string;
  exerciseId: string;
  setNumber: number;
  weight?: number;
  reps?: number;
  durationSeconds?: number;
  isWarmup: boolean;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutBundle {
  workout: WorkoutSession;
  exercises: WorkoutExercise[];
  sets: WorkoutSet[];
}

export interface ExercisePerformance {
  bestWeight: number;
  bestEstimatedOneRepMax: number;
  volume: number;
  completedSets: number;
  totalReps: number;
}

export interface PersonalRecords {
  highestWeight: number;
  highestEstimatedOneRepMax: number;
  highestSingleSetVolume: number;
  highestExerciseVolume: number;
  highestRepsByWeight: Record<string, number>;
}
