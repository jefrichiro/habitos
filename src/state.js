import { logicalDate, isNextDay } from "./dates.js";
import { xpForCheckin, levelFromXp, avatarTier, COINS_PER_CHECKIN, QUEST_COMPLETE_COINS, DEFAULT_HABIT_XP } from "./game.js";
import { evaluate } from "./achievements.js";
import { generateQuests, updateQuestProgress } from "./quests.js";

export function recompute(state) {
  const next = structuredClone(state);
  next.checkins = next.checkins ?? {};
  next.achievements = next.achievements ?? {};
  next.questCoins = next.questCoins ?? {};
  next.shop = next.shop ?? { catalog: [], redemptions: [] };
  next.shop.redemptions = next.shop.redemptions ?? [];

  const tracker = new Map();
  for (const habit of next.habits) {
    tracker.set(habit.id, { streak: 0, best: 0, last: null, total: 0 });
  }

  let totalXp = 0;
  let totalCheckins = 0;
  const dates = Object.keys(next.checkins).sort();

  for (const date of dates) {
    const ids = next.checkins[date] ?? [];
    for (const habitId of ids) {
      totalCheckins += 1;
      let entry = tracker.get(habitId);
      if (!entry) {
        entry = { streak: 0, best: 0, last: null, total: 0 };
        tracker.set(habitId, entry);
      }
      entry.streak = entry.last && isNextDay(entry.last, date) ? entry.streak + 1 : 1;
      if (entry.streak > entry.best) entry.best = entry.streak;
      entry.last = date;
      entry.total += 1;
      totalXp += xpForCheckin(entry.streak, next.settings?.defaultHabitXp ?? DEFAULT_HABIT_XP);
    }
  }

  for (const habit of next.habits) {
    const entry = tracker.get(habit.id);
    if (!entry) continue;
    habit.streak = entry.streak;
    habit.bestStreak = entry.best;
    habit.lastDoneDate = entry.last;
    habit.totalDone = entry.total;
  }

  const questCoins = Object.values(next.questCoins).reduce((a, v) => a + (Number(v) || 0), 0);

  let spent = 0;
  for (const redemption of next.shop.redemptions) {
    spent += Number(redemption.cost) || 0;
  }

  const level = levelFromXp(totalXp);
  next.profile = {
    ...next.profile,
    totalXp,
    level,
    avatarTier: avatarTier(level),
    coins: Math.max(0, COINS_PER_CHECKIN * totalCheckins + questCoins - spent),
  };

  return next;
}

export function todayCheckins(state, now) {
  return state.checkins?.[logicalDate(now, state.settings.dayCutoffHour)] ?? [];
}

export function applyCheckIn(state, habitId, now) {
  const date = logicalDate(now, state.settings.dayCutoffHour);
  const current = state.checkins?.[date] ?? [];

  if (current.includes(habitId)) {
    return {
      state,
      events: {
        xpGained: 0,
        coinsGained: 0,
        leveledUp: false,
        newLevel: state.profile.level,
        unlocked: [],
        questsCompleted: 0,
      },
    };
  }

  const before = state.profile;
  let next = structuredClone(state);
  next.checkins = next.checkins ?? {};
  next.checkins[date] = [...(next.checkins[date] ?? []), habitId];

  const quests = updateQuestProgress(
    next.quests?.date === date ? next.quests : generateQuests(date),
    next,
  );
  next.quests = quests;

  next.questCoins = next.questCoins ?? {};
  next.questCoins[date] = quests.items.every((item) => item.done) ? QUEST_COMPLETE_COINS : 0;

  next = recompute(next);

  const unlocked = evaluate(next);
  next.achievements = next.achievements ?? {};
  for (const id of unlocked) {
    next.achievements[id] = { unlockedAt: date };
  }

  const after = next.profile;
  return {
    state: next,
    events: {
      xpGained: after.totalXp - before.totalXp,
      coinsGained: after.coins - before.coins,
      leveledUp: after.level > before.level,
      newLevel: after.level,
      unlocked,
      questsCompleted: quests.items.filter((item) => item.done).length,
    },
  };
}

export function applyUncheck(state, habitId, now) {
  const date = logicalDate(now, state.settings.dayCutoffHour);
  const before = state.profile;

  let next = structuredClone(state);
  next.checkins = next.checkins ?? {};
  next.checkins[date] = (next.checkins[date] ?? []).filter((id) => id !== habitId);

  const quests = updateQuestProgress(
    next.quests?.date === date ? next.quests : generateQuests(date),
    next,
  );
  next.quests = quests;

  next.questCoins = next.questCoins ?? {};
  next.questCoins[date] = quests.items.every((item) => item.done) ? QUEST_COMPLETE_COINS : 0;

  next = recompute(next);

  const after = next.profile;
  return {
    state: next,
    events: {
      xpGained: after.totalXp - before.totalXp,
      coinsGained: after.coins - before.coins,
      leveledUp: after.level > before.level,
      newLevel: after.level,
      unlocked: [],
      questsCompleted: quests.items.filter((item) => item.done).length,
    },
  };
}

export function addHabit(state, { name, icon, color }) {
  const next = structuredClone(state);
  next.habits.push({
    id: crypto.randomUUID(),
    name,
    icon,
    color,
    createdAt: "",
    archived: false,
    streak: 0,
    bestStreak: 0,
    lastDoneDate: null,
    totalDone: 0,
  });
  return next;
}

export function updateHabit(state, id, patch) {
  const next = structuredClone(state);
  next.habits = next.habits.map((habit) => (habit.id === id ? { ...habit, ...patch } : habit));
  return next;
}

export function archiveHabit(state, id) {
  return updateHabit(state, id, { archived: true });
}

export function redeemReward(state, rewardId, now) {
  const catalog = state.shop?.catalog ?? [];
  const reward = catalog.find((item) => item.id === rewardId);
  if (!reward) return { state, ok: false, reason: "not_found" };
  if ((state.profile?.coins ?? 0) < reward.cost) {
    return { state, ok: false, reason: "insufficient_coins" };
  }

  const next = structuredClone(state);
  next.profile = { ...next.profile, coins: next.profile.coins - reward.cost };
  next.shop = {
    ...next.shop,
    redemptions: [
      ...(next.shop.redemptions ?? []),
      { id: rewardId, date: logicalDate(now, state.settings.dayCutoffHour), cost: reward.cost },
    ],
  };
  return { state: next, ok: true };
}

export function addReward(state, { name, cost, icon }) {
  const next = structuredClone(state);
  next.shop = {
    ...next.shop,
    catalog: [...next.shop.catalog, { id: crypto.randomUUID(), name, cost, icon }],
  };
  return next;
}

export function deleteReward(state, id) {
  const next = structuredClone(state);
  next.shop = {
    ...next.shop,
    catalog: next.shop.catalog.filter((reward) => reward.id !== id),
  };
  return next;
}
