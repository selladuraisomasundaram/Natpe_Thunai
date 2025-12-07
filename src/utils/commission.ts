// src/utils/commission.ts

/**
 * Calculates the dynamic commission rate based on the user's level.
 * Commission starts at 11.32% (Level 1) and decreases gradually based on defined breakpoints.
 * @param level The user's current level (must be >= 1).
 * @returns The commission rate as a percentage (e.g., 0.1132 for 11.32%).
 */
export const calculateCommissionRate = (level: number): number => {
  const START_RATE = 0.1132; // 11.32% at Level 1
  const MIN_RATE = 0.0537; // 5.37% at Level 10
  const MAX_LEVEL_FOR_MIN_RATE = 10; // Minimum rate is reached at Level 10

  if (level <= 1) {
    return START_RATE;
  }
  if (level >= MAX_LEVEL_FOR_MIN_RATE) {
    return MIN_RATE;
  }

  // Linear interpolation between Level 1 and MAX_LEVEL_FOR_MIN_RATE
  const levelRange = MAX_LEVEL_FOR_MIN_RATE - 1;
  const rateRange = START_RATE - MIN_RATE;
  const reductionPerLevel = rateRange / levelRange;
  
  return START_RATE - (level - 1) * reductionPerLevel;
};

/**
 * Formats the commission rate as a percentage string (e.g., '11.32%').
 * @param rate The commission rate (e.g., 0.1132).
 * @returns Formatted string.
 */
export const formatCommissionRate = (rate: number): string => {
  return (rate * 100).toFixed(2) + '%';
};