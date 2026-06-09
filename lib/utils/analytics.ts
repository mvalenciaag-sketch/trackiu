export const MONTHS_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/** Epley formula: estimated 1-rep max */
export function epley(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return +(weight * (1 + reps / 30)).toFixed(1);
}

export function formatShortDate(dateStr: string): string {
  const parts = dateStr.split("-");
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
}

export function formatVolKg(vol: number): string {
  if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k kg`;
  return `${Math.round(vol)} kg`;
}

/** ISO date string for N days ago */
export function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}
