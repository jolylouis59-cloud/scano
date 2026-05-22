import type { Question } from "@/lib/quiz-types";
import type { ResponseRow } from "@/lib/quiz-analytics";

const RETURN_POSITIVE = /^(oui|très bientôt|tres bientot|ce mois|ce mois-ci)/i;
const RETURN_NEGATIVE = /^(non|probablement pas)/i;

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

function getAnswerValue(answers: Record<string, unknown>, q: Question): unknown {
  if (answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== "") {
    return answers[q.id];
  }
  if (answers[q.label] !== undefined && answers[q.label] !== null && answers[q.label] !== "") {
    return answers[q.label];
  }
  return undefined;
}

function scoreFromAnswer(val: unknown, q: Question): number | null {
  if (val == null || val === "") return null;

  if (q.type === "rating") {
    const n = typeof val === "number" ? val : Number(val);
    if (!Number.isNaN(n) && n >= 1 && n <= 10) return n;
    return null;
  }

  if (q.type === "yesno") {
    const s = String(val);
    if (/^oui/i.test(s)) return 10;
    if (/^non/i.test(s)) return 0;
    return null;
  }

  const label = norm(q.label);
  if (/revenir|prochainement|commander a nouveau/.test(label)) {
    const s = String(val);
    if (RETURN_POSITIVE.test(s) || /^oui/i.test(s)) return 10;
    if (RETURN_NEGATIVE.test(s)) return 0;
    if (/peut/i.test(s)) return 5;
  }

  return null;
}

/** Score global /10 : moyenne pondérée notes, oui/non et intentions de retour. */
export function computeSatisfactionScore(
  rows: ResponseRow[],
  questions: Question[],
): number | null {
  const points: number[] = [];

  for (const row of rows) {
    for (const q of questions) {
      const val = getAnswerValue(row.answers, q);
      const pt = scoreFromAnswer(val, q);
      if (pt != null) points.push(pt);
    }
  }

  if (points.length === 0) return null;
  const avg = points.reduce((a, b) => a + b, 0) / points.length;
  return Math.round(avg * 10) / 10;
}

export function satisfactionScoreColor(score: number): string {
  if (score < 5) return "#EF4444";
  if (score <= 7) return "#F97316";
  return "#22C55E";
}
