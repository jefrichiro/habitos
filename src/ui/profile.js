import { escapeHtml } from "./today.js";
import { ACHIEVEMENTS } from "../data.js";
import { avatarSprite, heatmapCells, monthStats } from "../charts.js";
import { levelProgress } from "../game.js";
import { exportJson, importJson } from "../storage.js";
import { recompute } from "../state.js";
import { logicalDate } from "../dates.js";

let flashTimer = null;

export function showFlash(text, kind = "ok") {
  let el = document.querySelector(".flash");
  if (!el) {
    el = document.createElement("div");
    el.className = "flash";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }
  el.classList.remove("flash-ok", "flash-error");
  el.classList.add(kind === "error" ? "flash-error" : "flash-ok");
  el.textContent = text;
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => {
    el.remove();
    flashTimer = null;
  }, 2200);
}

export function render(state, ctx) {
  const today = logicalDate(ctx.now, state.settings.dayCutoffHour);
  const cells = heatmapCells(state.checkins, 35, today);
  const stats = monthStats(state, today);
  const { level, intoLevel, levelSpan, pct } = levelProgress(state.profile.totalXp);

  const cellsHtml = cells
    .map(
      (c) =>
        `<span class="hm-cell hm-l${c.level}" data-date="${c.date}" title="${c.date}: ${c.count} check-in(s)"></span>`
    )
    .join("");

  const achievementsHtml = ACHIEVEMENTS.map((a) => {
    const at = state.achievements?.[a.id]?.unlockedAt;
    return `
      <li class="achievement ${at ? "is-unlocked" : "is-locked"}">
        <span class="ach-icon">${a.icon}</span>
        <span class="ach-name">${escapeHtml(a.name)}</span>
        <span class="ach-desc">${escapeHtml(a.desc)}</span>
        ${at ? `<span class="ach-date">${at}</span>` : `<span class="ach-lock">🔒</span>`}
      </li>`;
  }).join("");

  return `<section class="screen screen-profile">
  <h2 class="screen-title">Perfil</h2>

  <div class="hero-card">
    <div class="hero-avatar" aria-hidden="true">${avatarSprite(state.profile.avatarTier)}</div>
    <div class="hero-info">
      <div class="hero-name">${escapeHtml(state.profile.heroName)}</div>
      <div class="hero-level">Nivel ${level}</div>
      <div class="xpbar"><div class="xpbar-fill" style="width:${Math.round(pct * 100)}%"></div></div>
      <div class="hero-xp">${intoLevel}/${levelSpan} XP</div>
      <div class="hero-coins">🪙 ${state.profile.coins}</div>
    </div>
  </div>

  <h3 class="section-label">Últimos 35 días</h3>
  <div class="heatmap" role="img" aria-label="Mapa de calor de los últimos 35 días">
    ${cellsHtml}
  </div>

  <div class="stat-row">
    <div class="stat"><span class="stat-value">${stats.total}</span><span class="stat-label">este mes</span></div>
    <div class="stat"><span class="stat-value">${stats.bestStreak}</span><span class="stat-label">mejor racha</span></div>
    <div class="stat"><span class="stat-value">${stats.completionPct}%</span><span class="stat-label">días activos</span></div>
  </div>

  <h3 class="section-label">Logros</h3>
  <ul class="achievement-grid">
    ${achievementsHtml}
  </ul>

  <h3 class="section-label">Copia de seguridad</h3>
  <div class="backup-row">
    <button type="button" class="btn-primary" id="btn-export">Exportar</button>
    <button type="button" class="btn-secondary" id="btn-import">Importar</button>
    <input type="file" id="import-file" accept="application/json,.json" hidden>
  </div>
  <p class="import-error" id="import-error" hidden>No se pudo importar: el archivo no es válido.</p>
</section>`;
}

export function mount(root, state, ctx) {
  root.innerHTML = render(state, ctx);

  const exportBtn = root.querySelector("#btn-export");
  const importBtn = root.querySelector("#btn-import");
  const fileInput = root.querySelector("#import-file");
  const errorEl = root.querySelector("#import-error");

  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const current = ctx.getState();
      const today = logicalDate(ctx.now, current.settings.dayCutoffHour);
      const blob = new Blob([exportJson(current)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `habitos-${today}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });
  }

  if (importBtn && fileInput) {
    importBtn.addEventListener("click", () => fileInput.click());
  }

  if (fileInput) {
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const next = importJson(text);
        showFlash("Importado correctamente.");
        if (errorEl) errorEl.hidden = true;
        ctx.setState(recompute(next));
      } catch {
        if (errorEl) errorEl.hidden = false;
      } finally {
        fileInput.value = "";
      }
    });
  }
}
