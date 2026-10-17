import { levelFromXp } from "./game.js";
import { isNextDay } from "./dates.js";
import { ACHIEVEMENTS } from "./data.js";

export function globalStreak(checkins, today) {
  const dates = Object.keys(checkins)
    .filter((d) => (checkins[d] ?? []).length > 0)
    .sort();
  if (dates.length === 0) return 0;
  const last = dates[dates.length - 1];
  if (today != null && last !== today && !isNextDay(last, today)) return 0;
  let streak = 1;
  for (let i = dates.length - 1; i > 0; i--) {
    if (isNextDay(dates[i - 1], dates[i])) streak += 1;
    else break;
  }
  return streak;
}

export function achievementCtx(state, today) {
  const checkins = state.checkins ?? {};
  let totalCheckins = 0;
  for (const ids of Object.values(checkins)) totalCheckins += (ids ?? []).length;

  let maxHabitStreak = 0;
  for (const habit of state.habits ?? []) {
    maxHabitStreak = Math.max(maxHabitStreak, habit.bestStreak ?? 0, habit.streak ?? 0);
  }

  return {
    totalCheckins,
    maxHabitStreak,
    globalStreak: globalStreak(checkins, today),
    level: levelFromXp(state.profile?.totalXp ?? 0),
  };
}

export function evaluate(state, achievements = ACHIEVEMENTS) {
  const ctx = achievementCtx(state);
  const unlocked = state.achievements ?? {};
  const met = {
    total_checkins: ctx.totalCheckins,
    habit_streak: ctx.maxHabitStreak,
    global_streak: ctx.globalStreak,
    level: ctx.level,
  };
  return achievements
    .filter((a) => !(a.id in unlocked))
    .filter((a) => (met[a.type] ?? -Infinity) >= a.value)
    .map((a) => a.id);
}
