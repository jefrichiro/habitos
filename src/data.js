export const CONFIG = { dayCutoffHour: 4, defaultHabitXp: 10 };

export const DEFAULT_HABITS = [
  { id: "estudiar-ingles", name: "Estudiar inglés", icon: "📖", color: "#f5d547" },
  { id: "ejercicio", name: "Hacer ejercicio", icon: "🏋", color: "#7bd88f" },
  { id: "leer", name: "Leer 10 min", icon: "📚", color: "#7ea8e8" },
];

export const ACHIEVEMENTS = [
  { id: "first_step", name: "Primer paso", desc: "Marca tu primer hábito", icon: "🌱", type: "total_checkins", value: 1 },
  { id: "streak_7", name: "Racha de fuego", desc: "7 días seguidos en un hábito", icon: "🔥", type: "habit_streak", value: 7 },
  { id: "streak_21", name: "Hábito forjado", desc: "21 días seguidos en un hábito", icon: "⚔️", type: "habit_streak", value: 21 },
  { id: "checkins_100", name: "Centurión", desc: "100 check-ins totales", icon: "🛡️", type: "total_checkins", value: 100 },
  { id: "level_2", name: "Aprendiz", desc: "Alcanza el nivel 2", icon: "⭐", type: "level", value: 2 },
  { id: "global_streak_7", name: "Semana perfecta", desc: "7 días seguidos con al menos un hábito", icon: "📅", type: "global_streak", value: 7 },
];

export const SHOP_CATALOG = [
  { id: "pelicula", name: "Ver una peli", cost: 50, icon: "🎬" },
  { id: "cheat-meal", name: "Comida trampa", cost: 40, icon: "🍕" },
  { id: "dia-libre", name: "Día libre de hábitos", cost: 80, icon: "🛌" },
];

export const QUEST_TEMPLATES = [
  { id: "q1", desc: "Completa 1 hábito hoy", type: "complete_n_habits", target: 1, bonusXp: 5 },
  { id: "q2", desc: "Completa 2 hábitos hoy", type: "complete_n_habits", target: 2, bonusXp: 10 },
  { id: "q3", desc: "Completa 3 hábitos hoy", type: "complete_n_habits", target: 3, bonusXp: 15 },
  { id: "qperfect", desc: "Día perfecto: completa todos tus hábitos", type: "perfect_day", target: 0, bonusXp: 25 },
];
