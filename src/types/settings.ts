export type WeightUnit = 'kg' | 'lb';
export type ThemePreference = 'light' | 'dark' | 'system';

export interface AppSettings {
  id: 'app-settings';
  weightUnit: WeightUnit;
  theme: ThemePreference;
  defaultRestSeconds: number;
  showWarmupSets: boolean;
  hasCompletedOnboarding: boolean;
  createdAt: string;
  updatedAt: string;
}
