import { loadState, saveState } from "./src/storage.js";
import * as today from "./src/ui/today.js";
import * as habits from "./src/ui/habits.js";
import * as shop from "./src/ui/shop.js";
import * as profile from "./src/ui/profile.js";

const UI = { today, habits, shop, profile };
const TABS = [
  { id: "today", label: "Hoy", icon: "🔥" },
  { id: "habits", label: "Hábitos", icon: "📋" },
  { id: "shop", label: "Tienda", icon: "🎁" },
  { id: "profile", label: "Perfil", icon: "🛡️" },
];

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

let state = loadState(localStorage);
let activeTab = "today";

const ctx = {
  now: new Date(),
  getState: () => state,
  setState(next) { state = next; saveState(localStorage, state); render(); },
  navigate(tab) { if (UI[tab]) { activeTab = tab; render(); } },
};

function shell() {
  const tabs = TABS.map((t) =>
    `<button class="tab${t.id === activeTab ? " is-active" : ""}" id="tab-${t.id}" data-tab="${t.id}" role="tab" aria-controls="view" aria-selected="${t.id === activeTab}">
       <span class="tab-icon" aria-hidden="true">${t.icon}</span><span class="tab-label">${t.label}</span>
     </button>`
  ).join("");
  return `<main id="view" class="view" role="tabpanel" tabindex="-1" aria-labelledby="tab-${activeTab}"></main><nav class="tabbar" role="tablist" aria-label="Secciones">${tabs}</nav>`;
}

function render() {
  ctx.now = new Date();
  const app = document.getElementById("app");
  const prevScroll = app.querySelector("#view")?.scrollTop ?? 0;
  app.innerHTML = `<div class="app-shell">${shell()}</div>`;
  app.querySelectorAll(".tab").forEach((btn) =>
    btn.addEventListener("click", () => ctx.navigate(btn.dataset.tab))
  );
  UI[activeTab].mount(app.querySelector("#view"), state, ctx);
  const view = app.querySelector("#view");
  if (view) view.scrollTop = prevScroll;
}

render();
