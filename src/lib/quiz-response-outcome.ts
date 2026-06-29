import type { Question } from "@/lib/quiz-types";

/** Note ≥ ce seuil → éligible redirection Google Avis. */
export const SATISFIED_RATING_MIN = 8;

/** Note ≤ ce seuil → alerte email commerçant. */
export const UNHAPPY_RATING_MAX = 6;

export interface QuizOutcome {
  satisfactionRating: number | null;
  recommendYes: boolean;
  showGoogleReview: boolean;
  triggerMerchantAlert: boolean;
  improvementText: string | null;
  openText: string | null;
}

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

function isRecommendQuestion(q: Question): boolean {
  return /recommand/i.test(norm(q.label)) && q.type === "yesno";
}

function isImprovementQuestion(q: Question): boolean {
  const l = norm(q.label);
  const b = norm(q.businessLabel || "");
  return (
    (/amelior|friction|priorite/.test(l) || b.includes("friction")) &&
    (q.type === "multichoice" || q.type === "choice")
  );
}

function isOpenTextQuestion(q: Question): boolean {
  return q.type === "text" && !q.id.startsWith("_");
}

function parseRating(val: unknown): number | null {
  if (val == null || val === "") return null;
  const n = typeof val === "number" ? val : Number(val);
  if (Number.isNaN(n) || n < 1 || n > 10) return null;
  return n;
}

function parseRecommendYes(val: unknown): boolean {
  if (val == null || val === "") return false;
  return /^oui/i.test(String(val).trim());
}

function formatAnswerValue(val: unknown, questionId: string, answers: Record<string, unknown>): string {
  let display: string;
  if (Array.isArray(val)) {
    display = val.map(String).join(", ");
  } else {
    display = String(val);
  }

  const otherText = answers[`${questionId}_other_text`];
  if (otherText && String(otherText).trim()) {
    display += ` — Autre : ${String(otherText).trim()}`;
  }

  const why = answers[`${questionId}_why`];
  if (why && String(why).trim()) {
    display += ` (Pourquoi : ${String(why).trim()})`;
  }

  return display;
}

function findRatingQuestion(questions: Question[]): Question | undefined {
  return questions.find((q) => q.type === "rating");
}

function findRecommendQuestion(questions: Question[]): Question | undefined {
  return questions.find(isRecommendQuestion);
}

function findImprovementQuestion(questions: Question[]): Question | undefined {
  return questions.find(isImprovementQuestion);
}

function findOpenTextQuestion(questions: Question[]): Question | undefined {
  const openQuestions = questions.filter(isOpenTextQuestion);
  return openQuestions[openQuestions.length - 1];
}

export function evaluateQuizOutcome(
  answers: Record<string, unknown>,
  questions: Question[],
): QuizOutcome {
  const ratingQ = findRatingQuestion(questions);
  const recommendQ = findRecommendQuestion(questions);
  const improvementQ = findImprovementQuestion(questions);
  const openQ = findOpenTextQuestion(questions);

  const satisfactionRating = ratingQ ? parseRating(getAnswerValue(answers, ratingQ)) : null;
  const recommendYes = recommendQ ? parseRecommendYes(getAnswerValue(answers, recommendQ)) : false;

  const inAlertZone = satisfactionRating !== null && satisfactionRating <= UNHAPPY_RATING_MAX;

  // La note prime : zone d'alerte (≤ 6) → jamais de bouton Google, même si « Oui » à la recommandation.
  let showGoogleReview = false;
  if (!inAlertZone) {
    const satisfiedByRating =
      satisfactionRating !== null && satisfactionRating >= SATISFIED_RATING_MIN;
    const satisfiedByRecommend =
      recommendYes && (satisfactionRating === null || satisfactionRating > UNHAPPY_RATING_MAX);
    showGoogleReview = satisfiedByRating || satisfiedByRecommend;
  }

  const triggerMerchantAlert = inAlertZone;

  let improvementText: string | null = null;
  if (improvementQ) {
    const raw = getAnswerValue(answers, improvementQ);
    if (raw != null && raw !== "" && !(Array.isArray(raw) && raw.length === 0)) {
      improvementText = formatAnswerValue(raw, improvementQ.id, answers);
    }
  }

  let openText: string | null = null;
  if (openQ) {
    const raw = getAnswerValue(answers, openQ);
    const text = String(raw ?? "").trim();
    if (text) openText = text;
  }

  return {
    satisfactionRating,
    recommendYes,
    showGoogleReview,
    triggerMerchantAlert,
    improvementText,
    openText,
  };
}

export function isValidGoogleReviewUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function normalizeGoogleReviewUrl(url: string): string {
  return url.trim();
}
