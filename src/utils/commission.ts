"use client";

/**
 * Calculates the dynamic commission rate based on the user's level.
 * Aligning with the piecewise leveling strategy:
 * - Levels 1-5: "Hook Phase" - High fee (11.32%), small drops.
 * - Levels 5-25: "Grind Phase" - Aggressive fee reduction to reward the harder grind.
 * @param level The user's current level (must be >= 1).
 * @returns The commission rate as a decimal (e.g., 0.1132 for 11.32%).
 */
export const calculateCommissionRate = (level: number): number => {
  const START_RATE = 0.1132; // 11.32% Base Fee
  const MIN_RATE = 0.0537;   // 5.37% Minimum Fee (Elite Status)
  
  // PHASE 1: Hook Phase (Levels 1-4)
  // Users level up fast here, so we only give a tiny discount.
  // Drop 0.1% per level.
  if (level < 5) {
    const TINY_DROP = 0.001; // 0.1% drop
    return START_RATE - ((level - 1) * TINY_DROP);
  }

  // PHASE 2: Grind Phase (Levels 5-25)
  // Leveling is much harder now, so every level gives a BIGGER discount.
  const MAX_LEVEL_FOR_MIN_RATE = 25;

  if (level >= MAX_LEVEL_FOR_MIN_RATE) {
    return MIN_RATE;
  }

  // Calculate the remaining drop needed after Level 4
  const rateAtLevel4 = START_RATE - (3 * 0.001); // Rate just before Phase 2 starts (~11.02%)
  const totalDropNeeded = rateAtLevel4 - MIN_RATE;
  const levelsInPhase2 = MAX_LEVEL_FOR_MIN_RATE - 5; // 20 levels to spread the drop
  
  const dropPerLevelPhase2 = totalDropNeeded / levelsInPhase2;

  // Formula: Rate at L4 - (Levels gained in Phase 2 * Big Drop)
  return rateAtLevel4 - ((level - 4) * dropPerLevelPhase2);
};

/**
 * Formats the commission rate as a percentage string (e.g., '11.32%').
 * @param rate The commission rate (e.g., 0.1132).
 * @returns Formatted string.
 */
export const formatCommissionRate = (rate: number): string => {
  return (rate * 100).toFixed(2) + '%';
};