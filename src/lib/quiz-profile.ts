export const BIRTH_MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
] as const;

export const BIRTH_YEARS = Array.from({ length: 2010 - 1940 + 1 }, (_, i) => 2010 - i);

export function calculateAgeFromBirth(month: number, year: number): number {
  const today = new Date();
  let age = today.getFullYear() - year;
  const currentMonth = today.getMonth() + 1;
  if (currentMonth < month || (currentMonth === month && today.getDate() < 15)) {
    age -= 1;
  }
  return Math.max(0, Math.min(age, 120));
}
