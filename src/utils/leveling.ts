"use client";

/**
 * Calculates the total XP required to reach the next level.
 * * STRATEGY:
 * - Levels 1-5: "Hook Phase" - Low XP requirements to let users level up fast.
 * - Levels 5+: "Grind Phase" - Requirements jump significantly to stabilize the economy/commissions.
 * * @param currentLevel The user's current level (must be >= 1).
 * @returns The total XP required for the next level.
 */
export const calculateMaxXpForLevel = (currentLevel: number): number => {
  // PHASE 1: EARLY GAME (Levels 1-4)
  // Very fast progression.
  // Level 1 Req: 50
  // Level 2 Req: 75
  // Level 3 Req: 100
  // Level 4 Req: 125
  if (currentLevel < 5) {
    const EARLY_BASE_XP = 50;
    const EARLY_INCREMENT = 25;
    return EARLY_BASE_XP + (currentLevel - 1) * EARLY_INCREMENT;
  }

  // PHASE 2: MID/LATE GAME (Level 5+)
  // Significant jump in difficulty to slow down leveling.
  // Level 5 Req: 300 (Big jump from 125)
  // Level 6 Req: 450
  // Level 7 Req: 600
  const LATE_BASE_XP = 300; 
  const LATE_INCREMENT = 150; // Much steeper climb

  return LATE_BASE_XP + (currentLevel - 5) * LATE_INCREMENT;
};

/**
 * Checks if the user has enough XP to level up and returns the new profile state.
 * Handles multiple level ups in one go.
 * @param currentLevel Current level.
 * @param currentXp Current XP accumulated in the current level.
 * @param maxXp Max XP for the current level (optional, will recalculate if not provided).
 * @returns An object containing the new level, new currentXp, and new maxXp.
 */
export const checkAndApplyLevelUp = (currentLevel: number, currentXp: number, maxXp?: number) => {
  let newLevel = currentLevel;
  let newCurrentXp = currentXp;
  
  // Ensure we have the correct max XP for the start
  let newMaxXp = maxXp || calculateMaxXpForLevel(newLevel);

  // Loop to handle multi-level jumps (e.g., getting 1000 XP at level 1)
  while (newCurrentXp >= newMaxXp) {
    newCurrentXp -= newMaxXp;
    newLevel += 1;
    // Recalculate max XP for the *next* level
    newMaxXp = calculateMaxXpForLevel(newLevel);
  }

  return { newLevel, newCurrentXp, newMaxXp };
};