import type { WeightUnit } from '../types/settings';

const poundsPerKilogram = 2.2046226218;

export function roundTo(value: number, decimals = 1) {
  const multiplier = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

export function kilogramsToDisplay(valueKg: number, unit: WeightUnit) {
  return unit === 'lb'
    ? roundTo(valueKg * poundsPerKilogram)
    : roundTo(valueKg);
}

export function displayToKilograms(value: number, unit: WeightUnit) {
  return unit === 'lb' ? roundTo(value / poundsPerKilogram, 3) : value;
}

export function formatWeight(valueKg: number, unit: WeightUnit) {
  return `${kilogramsToDisplay(valueKg, unit)} ${unit}`;
}

export function formatVolume(valueKg: number, unit: WeightUnit) {
  return formatWeight(Math.round(valueKg), unit);
}
