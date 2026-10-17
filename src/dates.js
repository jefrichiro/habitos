const MS_PER_DAY = 86_400_000;
const MS_PER_HOUR = 3_600_000;

function pad2(n) {
  return String(n).padStart(2, "0");
}

function parse(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { y, m, d };
}

function utcMs(dateStr) {
  const { y, m, d } = parse(dateStr);
  return Date.UTC(y, m - 1, d);
}

export function logicalDate(now, cutoffHour = 4) {
  const shifted = new Date(now.getTime() - cutoffHour * MS_PER_HOUR);
  return `${shifted.getFullYear()}-${pad2(shifted.getMonth() + 1)}-${pad2(shifted.getDate())}`;
}

export function addDays(dateStr, n) {
  const { y, m, d } = parse(dateStr);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

export function daysBetween(a, b) {
  return Math.round((utcMs(b) - utcMs(a)) / MS_PER_DAY);
}

export function isNextDay(prev, next) {
  return daysBetween(prev, next) === 1;
}
