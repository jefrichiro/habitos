import { escapeHtml } from "./today.js";
import { addHabit, updateHabit, archiveHabit } from "../state.js";

export const ICON_CHOICES = ["📚", "🏃", "🧘", "💧", "🥗", "✍️", "🎸", "🛏️", "🧹", "💻"];
export const COLOR_CHOICES = ["#e8c170", "#7ec37e", "#7ea8e8", "#e88f7e", "#c77ee8", "#7ee8d5"];

const NAME_MAX = 40;

export function validateHabit(input) {
  const rawName = input?.name == null ? "" : String(input.name);
  const name = rawName.trim().slice(0, NAME_MAX);
  if (name === "") return { ok: false, reason: "name_required" };

  const rawIcon = input?.icon == null ? "" : String(input.icon).trim();
  const icon = rawIcon === "" ? ICON_CHOICES[0] : rawIcon;

  const rawColor = input?.color == null ? "" : String(input.color).trim();
  const color = rawColor === "" ? COLOR_CHOICES[0] : rawColor;

  return { ok: true, value: { name, icon, color } };
}

export function groupHabits(state) {
  const habits = state?.habits ?? [];
  return {
    active: habits.filter((h) => !h.archived),
    archived: habits.filter((h) => h.archived),
  };
}

function rowTemplate(h) {
  return `<li class="manage-row" data-id="${escapeHtml(String(h.id))}">
    <span class="habit-icon">${escapeHtml(h.icon ?? "")}</span>
    <span class="habit-name">${escapeHtml(h.name)}</span>
    <button type="button" class="btn-edit" data-id="${escapeHtml(String(h.id))}">Editar</button>
    <button type="button" class="btn-archive" data-id="${escapeHtml(String(h.id))}">Archivar</button>
  </li>`;
}

function iconPickerHtml(selected, pickerClass = "edit-icon-picker") {
  const buttons = ICON_CHOICES.map(
    (e) => `<button type="button" class="pick ${e === selected ? "is-picked" : ""}" data-icon="${e}">${e}</button>`
  ).join("");
  return `<div class="pick-row ${pickerClass}">${buttons}</div>`;
}

function colorPickerHtml(selected, pickerClass = "edit-color-picker") {
  const swatches = COLOR_CHOICES.map(
    (c) =>
      `<button type="button" class="swatch ${c === selected ? "is-picked" : ""}" data-color="${escapeHtml(c)}" style="--sw:${escapeHtml(c)}"></button>`
  ).join("");
  return `<div class="pick-row ${pickerClass}">${swatches}</div>`;
}

function inlineEditTemplate(h) {
  return `<form class="habit-form inline-edit" data-id="${escapeHtml(String(h.id))}">
    <input class="edit-name" type="text" maxlength="${NAME_MAX}" value="${escapeHtml(h.name)}" placeholder="Nombre del hábito" autocomplete="off">
    ${iconPickerHtml(h.icon)}
    ${colorPickerHtml(h.color)}
    <div class="edit-actions">
      <button type="submit" class="btn-primary">Guardar</button>
      <button type="button" class="btn-cancel">Cancelar</button>
    </div>
  </form>`;
}

export function render(state, ctx) {
  const { active, archived } = groupHabits(state);

  const iconButtons = ICON_CHOICES.map(
    (e, i) => `<button type="button" class="pick ${i === 0 ? "is-picked" : ""}" data-icon="${e}">${e}</button>`
  ).join("");

  const colorSwatches = COLOR_CHOICES.map(
    (c, i) =>
      `<button type="button" class="swatch ${i === 0 ? "is-picked" : ""}" data-color="${escapeHtml(c)}" style="--sw:${escapeHtml(c)}"></button>`
  ).join("");

  const activeHtml =
    active.length === 0
      ? `<p class="muted">Sin hábitos. Crea uno arriba.</p>`
      : `<ul class="habit-manage">${active.map(rowTemplate).join("")}</ul>`;

  const archivedHtml =
    archived.length === 0
      ? `<p class="muted">Nada archivado.</p>`
      : `<ul class="habit-manage is-archived">${archived
          .map(
            (h) =>
              `<li class="manage-row is-archived"><span class="habit-icon">${escapeHtml(h.icon ?? "")}</span><span class="habit-name">${escapeHtml(
                h.name
              )}</span></li>`
          )
          .join("")}</ul>`;

  return `<section class="screen screen-habits">
  <h2 class="screen-title">Hábitos</h2>
  <h3 class="section-label">Nuevo hábito</h3>
  <form id="habit-form" class="habit-form">
    <input id="habit-name" type="text" maxlength="${NAME_MAX}" placeholder="Nombre del hábito" autocomplete="off">
    <div class="pick-row" id="icon-picker">${iconButtons}</div>
    <div class="pick-row" id="color-picker">${colorSwatches}</div>
    <button type="submit" class="btn-primary">Añadir</button>
  </form>

  <h3 class="section-label">Activos</h3>
  ${activeHtml}

  <h3 class="section-label">Archivados</h3>
  ${archivedHtml}
</section>`;
}

function startEdit(root, ctx, id) {
  const habit = ctx.getState().habits.find((h) => h.id === id);
  if (!habit) return;
  const li = [...root.querySelectorAll(".manage-row")].find((row) => row.dataset.id === id);
  if (!li) return;

  li.innerHTML = inlineEditTemplate(habit);
  li.classList.add("is-editing");

  let pickedIcon = habit.icon;
  let pickedColor = habit.color;

  const iconPicker = li.querySelector(".edit-icon-picker");
  iconPicker.querySelectorAll(".pick").forEach((btn) => {
    btn.addEventListener("click", () => {
      pickedIcon = btn.dataset.icon;
      iconPicker.querySelectorAll(".pick").forEach((b) => b.classList.toggle("is-picked", b === btn));
    });
  });

  const colorPicker = li.querySelector(".edit-color-picker");
  colorPicker.querySelectorAll(".swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      pickedColor = btn.dataset.color;
      colorPicker.querySelectorAll(".swatch").forEach((b) => b.classList.toggle("is-picked", b === btn));
    });
  });

  const nameField = li.querySelector(".edit-name");
  nameField.addEventListener("input", () => nameField.classList.remove("is-error"));

  li.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = validateHabit({ name: nameField.value, icon: pickedIcon, color: pickedColor });
    if (!v.ok) {
      nameField.classList.add("is-error");
      return;
    }
    ctx.setState(updateHabit(ctx.getState(), id, v.value));
  });

  li.querySelector(".btn-cancel").addEventListener("click", () => {
    ctx.setState(ctx.getState());
  });
}

export function mount(root, state, ctx) {
  root.innerHTML = render(state, ctx);

  let pickedIcon = ICON_CHOICES[0];
  let pickedColor = COLOR_CHOICES[0];

  const iconPicker = root.querySelector("#icon-picker");
  if (iconPicker) {
    iconPicker.querySelectorAll(".pick").forEach((btn) => {
      btn.addEventListener("click", () => {
        pickedIcon = btn.dataset.icon;
        iconPicker.querySelectorAll(".pick").forEach((b) => b.classList.toggle("is-picked", b === btn));
      });
    });
  }

  const colorPicker = root.querySelector("#color-picker");
  if (colorPicker) {
    colorPicker.querySelectorAll(".swatch").forEach((btn) => {
      btn.addEventListener("click", () => {
        pickedColor = btn.dataset.color;
        colorPicker.querySelectorAll(".swatch").forEach((b) => b.classList.toggle("is-picked", b === btn));
      });
    });
  }

  const form = root.querySelector("#habit-form");
  const nameInput = root.querySelector("#habit-name");
  if (form && nameInput) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = validateHabit({ name: nameInput.value, icon: pickedIcon, color: pickedColor });
      if (!v.ok) {
        nameInput.classList.add("is-error");
        return;
      }
      ctx.setState(addHabit(ctx.getState(), v.value));
    });
    nameInput.addEventListener("input", () => nameInput.classList.remove("is-error"));
  }

  root.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", () => startEdit(root, ctx, btn.dataset.id));
  });

  root.querySelectorAll(".btn-archive").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const habit = ctx.getState().habits.find((h) => h.id === id);
      if (!habit) return;
      if (window.confirm(`¿Archivar "${habit.name}"? Conserva su historial.`)) {
        ctx.setState(archiveHabit(ctx.getState(), id));
      }
    });
  });
}
