import { addDays } from "./dates.js";

export const AVATAR_PALETTES = [
  { skin: "#f2c29b", hair: "#7a5230", shirt: "#8a6d3b", pants: "#5b6f3a", boots: "#4a3520", metal: "#9aa4b2", accent: "#7bd88f" },
  { skin: "#f2c29b", hair: "#3f2d1a", shirt: "#4c8b57", pants: "#3a4a5a", boots: "#3b2c1c", metal: "#c0c8d4", accent: "#8be9a0" },
  { skin: "#eab98a", hair: "#2b2b2b", shirt: "#3b6fb5", pants: "#2c3e57", boots: "#22303f", metal: "#b8c2cf", accent: "#61a0ff" },
  { skin: "#e8b183", hair: "#5a3a1a", shirt: "#b5423b", pants: "#5a2a26", boots: "#3a1d1a", metal: "#e6c15a", accent: "#f5d547" },
  { skin: "#f6cfa8", hair: "#d9b25a", shirt: "#f0e2b6", pants: "#c9a24a", boots: "#8a6d2a", metal: "#fff3b0", accent: "#ffe15c" },
];

function levelForCount(count) {
  if (count <= 0) return 0;
  if (count >= 4) return 4;
  return count;
}

export function heatmapCells(checkins, days, today) {
  const n = Math.max(0, Math.trunc(days ?? 0));
  const cells = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const date = addDays(today, -i);
    const list = checkins?.[date];
    const count = Array.isArray(list) ? list.length : 0;
    cells.push({ date, count, level: levelForCount(count) });
  }
  return cells;
}

export function monthStats(state, today) {
  const month = String(today).slice(0, 7);
  const checkins = state?.checkins ?? {};

  let total = 0;
  let activeDays = 0;
  for (const [date, list] of Object.entries(checkins)) {
    if (!date.startsWith(month)) continue;
    const count = Array.isArray(list) ? list.length : 0;
    total += count;
    if (count > 0) activeDays += 1;
  }

  let bestStreak = 0;
  for (const habit of state?.habits ?? []) {
    bestStreak = Math.max(bestStreak, habit?.bestStreak ?? 0);
  }

  const dayOfMonth = Number(String(today).slice(8, 10)) || 0;
  const completionPct = Math.max(
    0,
    Math.min(100, Math.round((100 * activeDays) / Math.max(1, dayOfMonth)))
  );

  return { total, bestStreak, completionPct };
}

function rect(x, y, w, h, fill) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
}

function baseHero(p) {
  return [
    rect(4, 1, 8, 2, p.hair),
    rect(3, 2, 2, 2, p.hair),
    rect(11, 2, 2, 2, p.hair),
    rect(5, 3, 6, 3, p.skin),
    rect(4, 4, 1, 2, p.skin),
    rect(11, 4, 1, 2, p.skin),
    rect(6, 4, 1, 1, "#1a1a1a"),
    rect(9, 4, 1, 1, "#1a1a1a"),
    rect(5, 6, 6, 4, p.shirt),
    rect(3, 6, 2, 3, p.shirt),
    rect(11, 6, 2, 3, p.shirt),
    rect(3, 9, 2, 1, p.skin),
    rect(11, 9, 2, 1, p.skin),
    rect(5, 10, 2, 2, p.pants),
    rect(9, 10, 2, 2, p.pants),
    rect(5, 12, 2, 1, p.boots),
    rect(9, 12, 2, 1, p.boots),
  ].join("");
}

export function avatarSprite(tier) {
  const t = Math.max(0, Math.min(4, Math.trunc(tier ?? 0)));
  const p = AVATAR_PALETTES[t];

  const parts = [];

  if (t >= 3) {
    parts.push(rect(4, 5, 8, 7, p.accent));
    parts.push(rect(3, 6, 1, 6, p.accent));
    parts.push(rect(12, 6, 1, 6, p.accent));
  }

  parts.push(baseHero(p));

  if (t >= 1) {
    parts.push(rect(13, 3, 1, 7, p.metal));
    parts.push(rect(12, 10, 3, 1, p.accent));
    parts.push(rect(13, 11, 1, 2, p.boots));
  }

  if (t >= 2) {
    parts.push(rect(1, 6, 3, 4, p.metal));
    parts.push(rect(2, 7, 1, 2, p.accent));
  }

  if (t >= 4) {
    parts.push(rect(4, 0, 8, 1, p.metal));
    parts.push(rect(4, 0, 1, 2, p.accent));
    parts.push(rect(7, 0, 1, 2, p.accent));
    parts.push(rect(11, 0, 1, 2, p.accent));
    parts.push(rect(0, 1, 1, 1, "#ffffff"));
    parts.push(rect(15, 1, 1, 1, "#ffffff"));
    parts.push(rect(15, 13, 1, 1, "#ffffff"));
    parts.push(rect(0, 13, 1, 1, "#ffffff"));
  }

  return `<svg viewBox="0 0 16 16" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${parts.join("")}</svg>`;
}
