export type WeightUnit = 'kg' | 'lb';
export type ThemePreference = 'light' | 'dark' | 'system';
export type LanguagePreference = 'system' | 'en' | 'zh';

export interface AppSettings {
  id: 'app-settings';
  weightUnit: WeightUnit;
  theme: ThemePreference;
  language?: LanguagePreference;
  defaultRestSeconds: number;
  showWarmupSets: boolean;
  hasCompletedOnboarding: boolean;
  createdAt: string;
  updatedAt: string;
}
