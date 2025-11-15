"use client";

/**
 * Calculates the total XP required to reach the next level.
 * Uses an exponential growth curve: 100 * (1.5 ^ (level - 1)).
 * @param currentLevel The user's current level (must be >= 1).
 * @returns The total XP required for the next level.
 */
export const calculateMaxXpForLevel = (currentLevel: number): number => {
  const BASE_XP = 100;
  const GROWTH_FACTOR = 1.5;

  if (currentLevel <= 1) {
    return BASE_XP;
  }

  // Formula: BASE_XP * (GROWTH_FACTOR ^ (currentLevel - 1))
  // We round to the nearest integer for cleaner display.
  return Math.round(BASE_XP * Math.pow(GROWTH_FACTOR, currentLevel - 1));
};

/**
 * Checks if the user has enough XP to level up and returns the new profile state.
 * Handles multiple level ups in one go.
 * @param currentLevel Current level.
 * @param currentXp Current XP accumulated in the current level (including newly added XP).
 * @param maxXp Max XP for the current level.
 * @returns An object containing the new level, new currentXp, and new maxXp.
 */
export const checkAndApplyLevelUp = (currentLevel: number, currentXp: number, maxXp: number) => {
  let newLevel = currentLevel;
  let newCurrentXp = currentXp;
  let newMaxXp = maxXp;

  while (newCurrentXp >= newMaxXp) {
    newCurrentXp -= newMaxXp;
    newLevel += 1;
    newMaxXp = calculateMaxXpForLevel(newLevel);
  }

  return { newLevel, newCurrentXp, newMaxXp };
};