import { applyCheckIn, applyUncheck, todayCheckins } from "../state.js";
import { levelProgress, liveStreak } from "../game.js";
import { generateQuests, updateQuestProgress } from "../quests.js";
import { achievementCtx } from "../achievements.js";
import { logicalDate } from "../dates.js";
import { ACHIEVEMENTS } from "../data.js";

export function xpFloatText(xp) {
  return `+${xp} XP`;
}

export function celebrationText(events, achievements = ACHIEVEMENTS) {
  const unlocked = events.unlocked ?? [];
  if (!events.leveledUp && unlocked.length === 0) return null;
  const lines = [];
  if (events.leveledUp) lines.push(`¡NIVEL ${events.newLevel}!`);
  for (const id of unlocked) {
    const ach = achievements.find((a) => a.id === id);
    if (ach) lines.push(ach.name);
  }
  return lines;
}

const feedbackTimers = new Set();

function removeLater(el, ms) {
  const timer = setTimeout(() => {
    feedbackTimers.delete(timer);
    el.remove();
  }, ms);
  feedbackTimers.add(timer);
}

function prefersReducedMotion() {
  return (
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function showFloatingXp(amount, rect) {
  const el = document.createElement("div");
  el.className = "float-xp";
  el.textContent = xpFloatText(amount);
  el.setAttribute("aria-hidden", "true");
  el.style.left = `${rect.left + rect.width / 2}px`;
  el.style.top = `${rect.top}px`;
  document.body.appendChild(el);
  if (!prefersReducedMotion()) {
    requestAnimationFrame(() => el.classList.add("is-on"));
  }
  removeLater(el, 900);
}

function showCelebration(lines) {
  if (!lines || lines.length === 0) return;
  const wrap = document.createElement("div");
  wrap.className = "celebration";

  const card = document.createElement("div");
  card.className = "celebration-card";
  card.setAttribute("role", "status");
  card.setAttribute("aria-live", "polite");

  const linesEl = document.createElement("div");
  linesEl.className = "celebration-lines";
  lines.forEach((line, i) => {
    if (i > 0) linesEl.appendChild(document.createElement("br"));
    linesEl.appendChild(document.createTextNode(line));
  });

  const sparks = document.createElement("div");
  sparks.className = "sparks";
  sparks.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 8; i++) {
    const spark = document.createElement("span");
    spark.className = "spark";
    sparks.appendChild(spark);
  }

  card.appendChild(linesEl);
  card.appendChild(sparks);
  wrap.appendChild(card);
  document.body.appendChild(wrap);
  removeLater(wrap, 1500);
}

export function habitsForToday(state) {
  return state.habits.filter((h) => !h.archived);
}

export function todayQuests(state, dateStr) {
  const quests =
    state.quests?.date === dateStr ? state.quests : generateQuests(dateStr);
  return updateQuestProgress(quests, state);
}

export function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function render(state, ctx) {
  const { level, pct } = levelProgress(state.profile.totalXp);
  const dateStr = logicalDate(ctx.now, state.settings.dayCutoffHour);
  const globalStreak = achievementCtx(state, dateStr).globalStreak;
  const coins = state.profile.coins;
  const questItems = todayQuests(state, dateStr).items;
  const doneIds = todayCheckins(state, ctx.now);
  const habits = habitsForToday(state);

  const questItemsHtml = questItems
    .map((i) => {
      const done = i.done ? "is-done" : "";
      return `<li class="quest ${done}">
        <span class="quest-desc">${escapeHtml(i.desc)}</span>
        <span class="quest-progress">${i.progress}/${i.target}</span>
      </li>`;
    })
    .join("");

  const habitsHtml = habits
    .map((h) => {
      const done = doneIds.includes(h.id);
      return `<li class="habit ${done ? "is-done" : ""}">
        <button class="habit-check" data-id="${escapeHtml(String(h.id))}" aria-pressed="${done}" aria-label="${escapeHtml(h.name)}">
          ${done ? "✔" : ""}
        </button>
        <span class="habit-icon" aria-hidden="true">${escapeHtml(h.icon ?? "")}</span>
        <span class="habit-name">${escapeHtml(h.name)}</span>
        <span class="habit-streak">🔥${liveStreak(Number(h.streak) || 0, h.lastDoneDate, dateStr)}</span>
      </li>`;
    })
    .join("");

  return `<section class="screen screen-today">
  <header class="hud">
    <div class="hud-level">Nivel ${level}</div>
    <div class="xpbar"><div class="xpbar-fill" style="width:${Math.round(pct * 100)}%"></div></div>
    <div class="hud-stats">
      <span class="hud-streak" title="Racha global">🔥 ${globalStreak}</span>
      <span class="hud-coins" title="Monedas">🪙 ${coins}</span>
    </div>
  </header>

  <section class="quests">
    <h3 class="section-label">Misiones de hoy</h3>
    <ul>
      ${questItemsHtml}
    </ul>
  </section>

  <section class="habits">
    <h3 class="section-label">Hábitos</h3>
    <ul class="habit-list">
      ${habitsHtml}
    </ul>
  </section>
</section>`;
}

export function mount(root, state, ctx) {
  root.innerHTML = render(state, ctx);
  root.querySelectorAll(".habit-check").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cur = ctx.getState();
      const id = btn.dataset.id;
      const done = todayCheckins(cur, ctx.now).includes(id);
      const rect = btn.getBoundingClientRect();
      const res = done
        ? applyUncheck(cur, id, ctx.now)
        : applyCheckIn(cur, id, ctx.now);
      ctx.setState(res.state);
      if (done) return;
      if (res.events.xpGained > 0) showFloatingXp(res.events.xpGained, rect);
      if (res.events.leveledUp || (res.events.unlocked ?? []).length > 0) {
        showCelebration(celebrationText(res.events));
      }
    });
  });
}
