export const fieldLimits = {
  nameLength: 80,
  weight: 1500,
  repetitions: 1000,
  durationSeconds: 86400
};

export function validateName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return 'Name is required.';
  if (trimmed.length > fieldLimits.nameLength)
    return `Use ${fieldLimits.nameLength} characters or fewer.`;
  return null;
}

export function validateWeight(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) return 'Enter a weight.';
  if (value < 0) return 'Weight cannot be negative.';
  if (value > fieldLimits.weight)
    return `Weight must be ${fieldLimits.weight} kg or less.`;
  return null;
}

export function validateRepetitions(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) return 'Enter repetitions.';
  if (!Number.isInteger(value) || value < 0)
    return 'Repetitions must be a whole number.';
  if (value > fieldLimits.repetitions)
    return `Repetitions must be ${fieldLimits.repetitions} or fewer.`;
  return null;
}

export function validateDuration(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) return 'Enter a duration.';
  if (!Number.isInteger(value) || value < 0)
    return 'Duration must be a whole number of seconds.';
  if (value > fieldLimits.durationSeconds)
    return 'Duration must be 24 hours or less.';
  return null;
}
