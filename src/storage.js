import { CONFIG, DEFAULT_HABITS, SHOP_CATALOG } from "./data.js";

export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = "habitApp";

export function defaultState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: { heroName: "Héroe", avatarTier: 0, coins: 0, totalXp: 0, level: 1, joinedAt: "" },
    habits: DEFAULT_HABITS.map((h) => ({
      id: h.id,
      name: h.name,
      icon: h.icon,
      color: h.color,
      createdAt: "",
      archived: false,
      streak: 0,
      bestStreak: 0,
      lastDoneDate: null,
      totalDone: 0,
    })),
    checkins: {},
    achievements: {},
    quests: null,
    questCoins: {},
    shop: { catalog: SHOP_CATALOG, redemptions: [] },
    settings: { ...CONFIG },
  };
}

function isValidShape(raw) {
  return (
    raw !== null &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    raw.schemaVersion !== undefined &&
    raw.profile !== null &&
    typeof raw.profile === "object" &&
    !Array.isArray(raw.profile) &&
    Array.isArray(raw.habits) &&
    raw.checkins !== null &&
    typeof raw.checkins === "object" &&
    !Array.isArray(raw.checkins)
  );
}

function normalizeV1(raw) {
  const defaults = defaultState();
  let out = raw;
  const clone = () => {
    if (out === raw) out = { ...raw };
  };

  if (out.checkins === null || typeof out.checkins !== "object" || Array.isArray(out.checkins)) {
    clone();
    out.checkins = {};
  }

  if (out.achievements === null || typeof out.achievements !== "object" || Array.isArray(out.achievements)) {
    clone();
    out.achievements = {};
  }

  if (out.questCoins === null || typeof out.questCoins !== "object" || Array.isArray(out.questCoins)) {
    clone();
    out.questCoins = {};
  }

  if (out.shop === null || typeof out.shop !== "object" || Array.isArray(out.shop)) {
    clone();
    out.shop = { catalog: defaults.shop.catalog, redemptions: [] };
  } else {
    if (!Array.isArray(out.shop.catalog)) {
      clone();
      out.shop = { ...out.shop, catalog: defaults.shop.catalog };
    }
    if (!Array.isArray(out.shop.redemptions)) {
      clone();
      out.shop = { ...out.shop, redemptions: [] };
    }
  }

  if (!("quests" in out)) {
    clone();
    out.quests = null;
  }

  if (out.settings === null || typeof out.settings !== "object" || Array.isArray(out.settings)) {
    clone();
    out.settings = { ...defaults.settings };
  } else {
    const merged = { ...out.settings };
    let changed = false;
    for (const key of Object.keys(defaults.settings)) {
      if (merged[key] === undefined) {
        merged[key] = defaults.settings[key];
        changed = true;
      }
    }
    if (changed) {
      clone();
      out.settings = merged;
    }
  }

  return out;
}

export function migrate(raw) {
  if (!isValidShape(raw)) return defaultState();
  if (raw.schemaVersion !== SCHEMA_VERSION) return defaultState();
  return normalizeV1(raw);
}

export function loadState(store) {
  try {
    const str = store.getItem(STORAGE_KEY);
    if (str === null || str === undefined) return defaultState();
    const parsed = JSON.parse(str);
    return migrate(parsed);
  } catch {
    return defaultState();
  }
}

export function saveState(store, state) {
  store.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function exportJson(state) {
  return JSON.stringify(state, null, 2);
}

export function importJson(str) {
  const parsed = JSON.parse(str);
  if (typeof parsed?.schemaVersion === "number" && parsed.schemaVersion > SCHEMA_VERSION) {
    throw new Error("Unsupported schema version");
  }
  if (!isValidShape(parsed)) {
    throw new Error("Invalid state shape");
  }
  return migrate(parsed);
}
