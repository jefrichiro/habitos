import { QUEST_TEMPLATES } from "./data.js";

const MS_PER_DAY = 86_400_000;

function dayIndexOf(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

export function generateQuests(dateStr) {
  const n = QUEST_TEMPLATES.length;
  const start = ((dayIndexOf(dateStr) % n) + n) % n;
  const items = [0, 1, 2].map((offset) => {
    const t = QUEST_TEMPLATES[(start + offset) % n];
    return {
      id: t.id,
      type: t.type,
      desc: t.desc,
      target: t.target,
      progress: 0,
      done: false,
      bonusXp: t.bonusXp,
    };
  });
  return { date: dateStr, items };
}

export function updateQuestProgress(quests, state) {
  const checkins = state.checkins[quests.date] ?? [];
  const dailyCheckins = checkins.length;
  const items = quests.items.map((item) => {
    if (item.type === "perfect_day") {
      const target = state.habits.filter((h) => !h.archived).length;
      const progress = dailyCheckins;
      return { ...item, target, progress, done: target > 0 && progress >= target };
    }
    const progress = Math.min(dailyCheckins, item.target);
    return { ...item, progress, done: progress >= item.target };
  });
  return { ...quests, items };
}
