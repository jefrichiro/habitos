import { isNextDay } from "./dates.js";

export const DEFAULT_HABIT_XP = 10;
export const COINS_PER_CHECKIN = 2;
export const QUEST_COMPLETE_COINS = 10;

export function xpForCheckin(streak, baseXp = DEFAULT_HABIT_XP) {
  return baseXp + Math.min(Math.floor(streak / 7), 3) * 5;
}

export function cumulativeXpForLevel(level) {
  return (100 * (level - 1) * level) / 2;
}

export function levelFromXp(totalXp) {
  let level = 1;
  while (cumulativeXpForLevel(level + 1) <= totalXp) {
    level += 1;
  }
  return level;
}

export function levelProgress(totalXp) {
  const level = levelFromXp(totalXp);
  const levelSpan = cumulativeXpForLevel(level + 1) - cumulativeXpForLevel(level);
  const intoLevel = totalXp - cumulativeXpForLevel(level);
  const pct = intoLevel / levelSpan;
  return { level, intoLevel, levelSpan, pct };
}

export function avatarTier(level) {
  return Math.min(4, Math.max(0, Math.floor((level - 1) / 5)));
}

export function liveStreak(streak, lastDoneDate, today) {
  if (!lastDoneDate) return 0;
  if (lastDoneDate === today || isNextDay(lastDoneDate, today)) return streak;
  return 0;
}
