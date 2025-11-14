// src/utils/commission.ts

/**
 * Calculates the dynamic commission rate based on the user's level.
 * Commission starts at 11.32% (Level 1) and decreases linearly to 6.4% (Level 10).
 * Levels above 10 maintain the minimum rate.
 * @param level The user's current level (must be >= 1).
 * @returns The commission rate as a percentage (e.g., 0.1132 for 11.32%).
 */
export const calculateCommissionRate = (level: number): number => {
  const MAX_LEVEL_FOR_REDUCTION = 10;
  const START_RATE = 0.1132; // 11.32%
  const MIN_RATE = 0.0640; // 6.40%
  const RATE_DIFFERENCE = START_RATE - MIN_RATE;
  const LEVEL_RANGE = MAX_LEVEL_FOR_REDUCTION - 1;

  if (level >= MAX_LEVEL_FOR_REDUCTION) {
    return MIN_RATE;
  }
  if (level <= 1) {
    return START_RATE;
  }

  // Linear reduction per level
  const reductionPerLevel = RATE_DIFFERENCE / LEVEL_RANGE;
  const currentReduction = (level - 1) * reductionPerLevel;
  
  return START_RATE - currentReduction;
};

/**
 * Formats the commission rate as a percentage string (e.g., '11.32%').
 * @param rate The commission rate (e.g., 0.1132).
 * @returns Formatted string.
 */
export const formatCommissionRate = (rate: number): string => {
  return (rate * 100).toFixed(2) + '%';
};