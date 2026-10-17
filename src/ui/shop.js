import { escapeHtml } from "./today.js";
import { ICON_CHOICES } from "./habits.js";
import { redeemReward, addReward, deleteReward } from "../state.js";

const NAME_MAX = 40;

export function canAfford(state, reward) {
  return (state?.profile?.coins ?? 0) >= (reward?.cost ?? Infinity);
}

export function validateReward(input) {
  const rawName = input?.name == null ? "" : String(input.name);
  const name = rawName.trim().slice(0, NAME_MAX);
  if (name === "") return { ok: false, reason: "name_required" };

  const cost = Number(input?.cost);
  if (!Number.isFinite(cost) || cost < 1) return { ok: false, reason: "cost_invalid" };

  const rawIcon = input?.icon == null ? "" : String(input.icon).trim();
  const icon = rawIcon === "" ? ICON_CHOICES[0] : rawIcon;

  return { ok: true, value: { name, cost: Math.round(cost), icon } };
}

export function redemptionHistory(state) {
  const catalog = state?.shop?.catalog ?? [];
  const redemptions = state?.shop?.redemptions ?? [];
  const lookup = new Map(catalog.map((r) => [r.id, r]));

  return redemptions
    .map((redemption, index) => {
      const reward = lookup.get(redemption.id);
      return {
        id: redemption.id,
        name: reward ? reward.name : "Recompensa",
        icon: reward ? reward.icon : "🎁",
        cost: redemption.cost,
        date: redemption.date,
        index,
      };
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return b.index - a.index;
    })
    .map(({ index, ...entry }) => entry);
}

export function formatShortDate(dateStr) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr));
  if (!match) return dateStr;
  return `${match[3]}/${match[2]}`;
}

export function render(state, ctx) {
  const coins = state.profile?.coins ?? 0;
  const catalog = state.shop?.catalog ?? [];
  const history = redemptionHistory(state);

  const catalogHtml =
    catalog.length === 0
      ? `<p class="muted">Sin recompensas. Añade una abajo.</p>`
      : `<ul class="reward-list">${catalog
          .map((r) => {
            const afford = canAfford(state, r);
            return `<li class="reward ${afford ? "" : "is-locked"}">
      <span class="reward-icon">${escapeHtml(r.icon ?? "")}</span>
      <span class="reward-name">${escapeHtml(r.name)}</span>
      <span class="reward-cost">🪙 ${Number(r.cost) || 0}</span>
      <button type="button" class="btn-redeem" data-id="${escapeHtml(String(r.id))}" ${afford ? "" : "disabled"}>Canjear</button>
      <button type="button" class="btn-del-reward" data-id="${escapeHtml(String(r.id))}" aria-label="Borrar ${escapeHtml(r.name)}">✕</button>
    </li>`;
          })
          .join("")}</ul>`;

  const iconButtons = ICON_CHOICES.map(
    (e, i) => `<button type="button" class="pick ${i === 0 ? "is-picked" : ""}" data-icon="${e}">${e}</button>`
  ).join("");

  const historyHtml =
    history.length === 0
      ? `<p class="muted">Sin canjes todavía.</p>`
      : `<ul class="redemption-list">${history
          .map(
            (h) => `<li class="redemption">
      <span class="redemption-date">${formatShortDate(h.date)}</span>
      <span class="redemption-icon">${escapeHtml(h.icon ?? "")}</span>
      <span class="redemption-name">${escapeHtml(h.name)}</span>
      <span class="redemption-cost">-🪙 ${Number(h.cost) || 0}</span>
    </li>`
          )
          .join("")}</ul>`;

  return `<section class="screen screen-shop">
  <h2 class="screen-title">Tienda</h2>
  <div class="wallet"><span class="wallet-coins">🪙 ${coins}</span><span class="wallet-label">monedas</span></div>

  <h3 class="section-label">Recompensas</h3>
  ${catalogHtml}

  <h3 class="section-label">Añadir recompensa</h3>
  <form id="reward-form" class="reward-form">
    <input id="reward-name" type="text" maxlength="${NAME_MAX}" placeholder="Nombre" autocomplete="off">
    <input id="reward-cost" type="number" min="1" step="1" inputmode="numeric" placeholder="Coste">
    <div class="pick-row" id="reward-icon-picker">
      ${iconButtons}
    </div>
    <button type="submit" class="btn-primary">Añadir</button>
  </form>

  <h3 class="section-label">Historial</h3>
  ${historyHtml}
</section>`;
}

export function mount(root, state, ctx) {
  root.innerHTML = render(state, ctx);

  let pickedIcon = ICON_CHOICES[0];
  const iconPicker = root.querySelector("#reward-icon-picker");
  if (iconPicker) {
    iconPicker.querySelectorAll(".pick").forEach((btn) => {
      btn.addEventListener("click", () => {
        pickedIcon = btn.dataset.icon;
        iconPicker.querySelectorAll(".pick").forEach((b) => b.classList.toggle("is-picked", b === btn));
      });
    });
  }

  root.querySelectorAll(".btn-redeem").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      const res = redeemReward(ctx.getState(), btn.dataset.id, ctx.now);
      if (res.ok) ctx.setState(res.state);
    });
  });

  const form = root.querySelector("#reward-form");
  const nameInput = root.querySelector("#reward-name");
  const costInput = root.querySelector("#reward-cost");
  if (form && nameInput && costInput) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = validateReward({ name: nameInput.value, cost: costInput.value, icon: pickedIcon });
      if (!v.ok) {
        if (v.reason === "name_required") nameInput.classList.add("is-error");
        if (v.reason === "cost_invalid") costInput.classList.add("is-error");
        return;
      }
      ctx.setState(addReward(ctx.getState(), v.value));
    });
    nameInput.addEventListener("input", () => nameInput.classList.remove("is-error"));
    costInput.addEventListener("input", () => costInput.classList.remove("is-error"));
  }

  root.querySelectorAll(".btn-del-reward").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (confirm("¿Borrar recompensa? El historial la conserva.")) {
        ctx.setState(deleteReward(ctx.getState(), btn.dataset.id));
      }
    });
  });
}
