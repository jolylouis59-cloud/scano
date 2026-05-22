import type { Question } from "@/lib/quiz-types";

export const MIN_RESPONSES_FOR_ANALYSIS = 3;

const POSITIVE_WORDS = [
  "super", "excellent", "parfait", "top", "génial", "adoré", "satisfait", "recommande",
  "bravo", "merci", "propre", "rapide", "accueil", "souriant", "chaleureux", "bien",
  "adorable", "nickel", "formidable", "magnifique", "heureux", "content", "agréable",
];

const NEGATIVE_WORDS = [
  "déçu", "attente", "long", "cher", "problème", "mauvais", "bruit", "froid", "sale",
  "lent", "manque", "absent", "difficile", "compliqué", "erreur", "nul", "horrible",
  "décevant", "cher", "lentement", "insatisfait", "mécontent", "déçue",
];

const PROFILE_PREFIXES = ["_first_name", "_birth", "_gender"];

const RIEN_VALUES = new Set(["rien", "rien à signaler", "rien a signaler", "satisfait", "✅"]);

const NEW_CLIENT_VALUES = new Set([
  "première visite", "premiere visite", "première fois", "premiere fois", "🆕",
]);

const RETURN_POSITIVE = /^(oui|très bientôt|tres bientot|ce mois|ce mois-ci|very soon)/i;
const RETURN_NEGATIVE = /^(non|probablement pas|peut-être|peut etre)/i;

export type Sentiment = "positive" | "neutral" | "negative";
export type Trend = "up" | "stable" | "down";

export interface AnalysisInsight {
  label: string;
  percent: number;
  count: number;
  quote?: string;
}

export interface AcquisitionBar {
  label: string;
  percent: number;
  count: number;
  tip: string;
}

export interface VerbatimRow {
  text: string;
  date: string;
  context: string;
  sentiment: Sentiment;
}

export interface PriorityAction {
  rank: number;
  title: string;
  description: string;
}

export interface WeeklyScore {
  weekLabel: string;
  score: number;
  count: number;
}

export interface AnalysisReport {
  responseCount: number;
  lastResponseDate: string | null;
  globalScore: number;
  trend: Trend;
  summaryLine: string;
  avgAge: number | null;
  genderBreakdown: string;
  frequencySummary: string;
  topAgeBand: { label: string; percent: number };
  ageBands: { label: string; percent: number }[];
  strengths: AnalysisInsight[];
  weaknesses: AnalysisInsight[];
  returnRate: number;
  recommendRate: number;
  returnTrend: number | null;
  recommendTrend: number | null;
  acquisition: AcquisitionBar[];
  verbatims: VerbatimRow[];
  actions: PriorityAction[];
  weeklyScores: WeeklyScore[];
}

export interface ResponseRow {
  id: string;
  quiz_id: string;
  customer_age: number | null;
  customer_gender: string | null;
  answers: Record<string, unknown>;
  completed_at: string;
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

export function classifySentiment(text: string): Sentiment {
  const t = norm(text);
  let pos = 0;
  let neg = 0;
  for (const w of POSITIVE_WORDS) {
    if (t.includes(w)) pos++;
  }
  for (const w of NEGATIVE_WORDS) {
    if (t.includes(w)) neg++;
  }
  if (pos > neg) return "positive";
  if (neg > pos) return "negative";
  return "neutral";
}

function isProfileKey(key: string): boolean {
  return PROFILE_PREFIXES.includes(key) || key.startsWith("_");
}

function isMetaKey(key: string): boolean {
  return key.endsWith("_other_text") || key.endsWith("_why");
}

function getMetaParent(key: string): string | null {
  if (key.endsWith("_other_text")) return key.slice(0, -"_other_text".length);
  if (key.endsWith("_why")) return key.slice(0, -"_why".length);
  return null;
}

type QCategory =
  | "rating"
  | "acquisition"
  | "frequency"
  | "return_intent"
  | "recommend"
  | "improvement"
  | "appreciation"
  | "open_text";

function categorizeQuestion(q: Question): QCategory[] {
  const l = norm(q.label);
  const b = norm(q.businessLabel || "");
  const cats: QCategory[] = [];

  if (q.type === "rating") cats.push("rating");
  if (/decouv|comment.*trouv|acquisition/.test(l) || b.includes("acquisition")) cats.push("acquisition");
  if (/frequence/.test(l)) cats.push("frequency");
  if (/revenir|commander a nouveau|prochainement/.test(l) && q.type !== "yesno") cats.push("return_intent");
  if (/recommand/.test(l)) cats.push("recommend");
  if (/amelior|friction|priorite/.test(l) && (q.type === "multichoice" || q.type === "choice")) cats.push("improvement");
  if (/appreci|compte le plus|confiance pour command/.test(l) && q.type !== "rating") cats.push("appreciation");
  if (q.type === "text" && !q.id.startsWith("_")) cats.push("open_text");

  return cats;
}

function buildQuestionIndex(questions: Question[]): Map<string, Question> {
  const byId = new Map<string, Question>();
  const byLabel = new Map<string, Question>();
  for (const q of questions) {
    byId.set(q.id, q);
    byLabel.set(norm(q.label), q);
  }
  return new Map([...byId, ...byLabel]);
}

function resolveQuestion(key: string, index: Map<string, Question>): Question | undefined {
  return index.get(key) ?? index.get(norm(key));
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

function displayOption(raw: string, q?: Question): string {
  const card = q?.choiceCards?.find((c) => c.value === raw || c.title === raw);
  if (card?.title) return card.title.replace(/^[^\p{L}\p{N}]+/u, "").trim() || card.title;
  return raw.replace(/^[^\p{L}\p{N}]+/u, "").trim() || raw;
}

function isRienOption(v: string): boolean {
  return RIEN_VALUES.has(norm(v));
}

function countOption(
  rows: ResponseRow[],
  questions: Question[],
  category: QCategory,
  excludeRien = false,
): Map<string, { count: number; quote?: string }> {
  const counts = new Map<string, { count: number; quote?: string }>();
  const qs = questions.filter((q) => categorizeQuestion(q).includes(category));

  for (const row of rows) {
    for (const q of qs) {
      const val = getAnswerValue(row.answers, q);
      if (val == null || val === "") continue;

      const items = Array.isArray(val) ? val.map(String) : [String(val)];
      for (const raw of items) {
        if (excludeRien && isRienOption(raw)) continue;
        const label = displayOption(raw, q);
        const prev = counts.get(label) ?? { count: 0 };
        let quote = prev.quote;
        if (!quote) {
          const why = row.answers[`${q.id}_why`] ?? row.answers[`${q.label}_why`];
          const other = row.answers[`${q.id}_other_text`] ?? row.answers[`${q.label}_other_text`];
          const extra = String(why ?? other ?? "").trim();
          if (extra.length > 8) quote = extra;
        }
        counts.set(label, { count: prev.count + 1, quote });
      }
    }
  }
  return counts;
}

function percent(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

function collectRatings(rows: ResponseRow[], questions: Question[]): number[] {
  const scores: number[] = [];
  const qs = questions.filter((q) => q.type === "rating");
  for (const row of rows) {
    for (const q of qs) {
      const v = getAnswerValue(row.answers, q);
      const n = typeof v === "number" ? v : Number(v);
      if (!Number.isNaN(n) && n >= 1 && n <= 10) scores.push(n);
    }
  }
  return scores;
}

function rateFromYesNo(rows: ResponseRow[], questions: Question[], category: "recommend" | "return_intent"): {
  rate: number;
  answered: number;
} {
  const qs = questions.filter((q) => categorizeQuestion(q).includes(category));
  let yes = 0;
  let total = 0;

  for (const row of rows) {
    for (const q of qs) {
      const val = getAnswerValue(row.answers, q);
      if (val == null || val === "") continue;
      total++;
      const s = String(val);
      if (category === "recommend") {
        if (/^oui/i.test(s)) yes += 1;
      } else if (RETURN_POSITIVE.test(s) || /^oui/i.test(s)) {
        yes += 1;
      } else if (/peut/i.test(s)) {
        yes += 0.5;
      }
    }
  }

  return { rate: total === 0 ? 0 : Math.round((yes / total) * 100), answered: total };
}

function acquisitionTip(label: string): string {
  const l = norm(label);
  if (l.includes("bouche") || l.includes("ami") || l.includes("recommand")) {
    return "Renforce le parrainage : une offre « amène un ami » convertit déjà des clients satisfaits.";
  }
  if (l.includes("google") || l.includes("maps")) {
    return "Optimise ta fiche Google : photos récentes + réponses aux avis = plus de découvertes locales.";
  }
  if (l.includes("reseau") || l.includes("instagram") || l.includes("facebook") || l.includes("pub") || l.includes("tiktok")) {
    return "Double la mise sur le contenu UGC : les clients qui viennent des réseaux aiment voir la communauté.";
  }
  if (l.includes("passait") || l.includes("vitrine") || l.includes("devant")) {
    return "Travaille la vitrine et la signalétique : le passage spontané est un levier sous-exploité.";
  }
  return "Capitalise sur ce canal avec une offre d'accueil dédiée aux nouveaux venus par cette source.";
}

function ageBand(age: number): string {
  if (age < 26) return "18-25 ans";
  if (age < 36) return "26-35 ans";
  if (age < 51) return "36-50 ans";
  return "50+ ans";
}

function weekKey(iso: string): string {
  const d = new Date(iso);
  const day = d.getDay() || 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - day);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function weekLabel(key: string): string {
  const [, w] = key.split("-W");
  return `Sem. ${w}`;
}

function collectVerbatims(
  rows: ResponseRow[],
  questions: Question[],
  limit = 5,
): VerbatimRow[] {
  const index = buildQuestionIndex(questions);
  const items: { text: string; date: string; context: string; sort: number }[] = [];

  for (const row of rows) {
    const date = row.completed_at;

    for (const q of questions.filter((x) => categorizeQuestion(x).includes("open_text"))) {
      const v = getAnswerValue(row.answers, q);
      const text = String(v ?? "").trim();
      if (text.length >= 8) {
        items.push({ text, date, context: q.label, sort: new Date(date).getTime() });
      }
    }

    for (const [key, val] of Object.entries(row.answers)) {
      if (!isMetaKey(key)) continue;
      const text = String(val ?? "").trim();
      if (text.length < 8) continue;
      const parentId = getMetaParent(key);
      const parent = parentId ? resolveQuestion(parentId, index) : undefined;
      const context = parent?.label ?? "Commentaire";
      items.push({ text, date, context, sort: new Date(date).getTime() });
    }

    for (const [key, val] of Object.entries(row.answers)) {
      if (isProfileKey(key) || isMetaKey(key)) continue;
      if (typeof val !== "string") continue;
      const text = val.trim();
      if (text.length >= 20 && !questions.some((q) => q.id === key || q.label === key)) {
        items.push({ text, date, context: key, sort: new Date(date).getTime() });
      }
    }
  }

  return items
    .sort((a, b) => b.sort - a.sort)
    .slice(0, limit)
    .map((v) => ({
      text: v.text,
      date: v.date,
      context: v.context,
      sentiment: classifySentiment(v.text),
    }));
}

function mapToInsights(
  counts: Map<string, { count: number; quote?: string }>,
  totalResponses: number,
  maxItems: number,
): AnalysisInsight[] {
  return [...counts.entries()]
    .map(([label, { count, quote }]) => ({
      label,
      count,
      percent: percent(count, totalResponses),
      quote,
    }))
    .filter((x) => x.percent > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, maxItems);
}

function buildActions(
  report: Omit<AnalysisReport, "actions">,
  weaknesses: AnalysisInsight[],
  frequencySummary: string,
): PriorityAction[] {
  const actions: { score: number; title: string; description: string }[] = [];

  const topWeak = weaknesses[0];
  if (topWeak && topWeak.percent >= 25) {
    actions.push({
      score: topWeak.percent,
      title: `Priorité : ${topWeak.label}`,
      description: `Optimise « ${topWeak.label.toLowerCase()} » : ${topWeak.percent}% de tes clients l'ont mentionné comme frein.`,
    });
  }

  if (/nouveau|première|premiere|58|50|majoritaire/i.test(frequencySummary)) {
    const m = frequencySummary.match(/(\d+)%/);
    const p = m ? Number(m[1]) : 50;
    if (p >= 45) {
      actions.push({
        score: p,
        title: "Programme fidélité",
        description: `Lance un programme fidélité : tu as beaucoup de primo-visiteurs (${p}%) à convertir en habitués.`,
      });
    }
  }

  if (report.globalScore >= 6 && report.globalScore < 9) {
    actions.push({
      score: 80,
      title: "Passer de bon à excellent",
      description: `Tu es à ${(10 - report.globalScore).toFixed(1)} point${report.globalScore < 9 ? "s" : ""} du score parfait. Identifie ce qui bloque les clients 7-8 pour viser 9-10.`,
    });
  }

  if (report.recommendRate < 60 && report.recommendRate > 0) {
    actions.push({
      score: 100 - report.recommendRate,
      title: "Renforcer la recommandation",
      description: `Seulement ${report.recommendRate}% recommanderaient votre commerce. Analysez les verbatims négatifs et agissez sur le premier frein.`,
    });
  }

  if (report.returnRate < 55 && report.returnRate > 0) {
    actions.push({
      score: 100 - report.returnRate,
      title: "Fidéliser les visiteurs",
      description: `${report.returnRate}% envisagent de revenir — relancez-les avec une offre de retour sous 30 jours.`,
    });
  }

  const topAcq = report.acquisition[0];
  if (topAcq && topAcq.percent >= 35) {
    actions.push({
      score: topAcq.percent,
      title: `Investir sur ${topAcq.label}`,
      description: topAcq.tip,
    });
  }

  if (actions.length === 0) {
    actions.push({
      score: 1,
      title: "Continuer à collecter",
      description: "Affinez vos questions quiz et collectez plus de réponses pour des recommandations plus précises.",
    });
  }

  return actions
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((a, i) => ({ rank: i + 1, title: a.title, description: a.description }));
}

function periodRates(
  rows: ResponseRow[],
  questions: Question[],
  category: "recommend" | "return_intent",
  daysAgoStart: number,
  daysAgoEnd: number,
): number | null {
  const now = Date.now();
  const start = now - daysAgoEnd * 86400000;
  const end = now - daysAgoStart * 86400000;
  const slice = rows.filter((r) => {
    const t = new Date(r.completed_at).getTime();
    return t >= start && t < end;
  });
  if (slice.length < 2) return null;
  return rateFromYesNo(slice, questions, category).rate;
}

export function buildAnalysisReport(
  rows: ResponseRow[],
  allQuestions: Question[],
): AnalysisReport | null {
  if (rows.length < MIN_RESPONSES_FOR_ANALYSIS) return null;

  const sorted = [...rows].sort(
    (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime(),
  );
  const lastResponseDate = sorted[0]?.completed_at ?? null;
  const ratings = collectRatings(rows, allQuestions);
  const ratingAvg =
    ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : null;

  const now = Date.now();
  const last7 = rows.filter((r) => now - new Date(r.completed_at).getTime() < 7 * 86400000);
  const prev7 = rows.filter((r) => {
    const age = now - new Date(r.completed_at).getTime();
    return age >= 7 * 86400000 && age < 14 * 86400000;
  });
  const r7 = collectRatings(last7, allQuestions);
  const rPrev = collectRatings(prev7, allQuestions);
  const avg7 = r7.length ? r7.reduce((a, b) => a + b, 0) / r7.length : null;
  const avgPrev = rPrev.length ? rPrev.reduce((a, b) => a + b, 0) / rPrev.length : null;

  let trend: Trend = "stable";
  if (avg7 != null && avgPrev != null) {
    if (avg7 - avgPrev >= 0.4) trend = "up";
    else if (avg7 - avgPrev <= -0.4) trend = "down";
  }

  const { rate: returnRate } = rateFromYesNo(rows, allQuestions, "return_intent");
  const { rate: recommendRate } = rateFromYesNo(rows, allQuestions, "recommend");
  const globalScore =
    ratingAvg ??
    (recommendRate > 0 ? Math.round((recommendRate / 10) * 10) / 10 : returnRate > 0 ? returnRate / 10 : 5);

  const returnTrend =
    periodRates(rows, allQuestions, "return_intent", 7, 14) != null &&
    periodRates(rows, allQuestions, "return_intent", 0, 7) != null
      ? (periodRates(rows, allQuestions, "return_intent", 0, 7) ?? 0) -
        (periodRates(rows, allQuestions, "return_intent", 7, 14) ?? 0)
      : null;

  const recommendTrend =
    periodRates(rows, allQuestions, "recommend", 7, 14) != null &&
    periodRates(rows, allQuestions, "recommend", 0, 7) != null
      ? (periodRates(rows, allQuestions, "recommend", 0, 7) ?? 0) -
        (periodRates(rows, allQuestions, "recommend", 7, 14) ?? 0)
      : null;

  const ages = rows.map((r) => r.customer_age).filter((a): a is number => a != null && a > 0);
  const avgAge = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : null;

  const genders: Record<string, number> = {};
  for (const r of rows) {
    if (r.customer_gender) genders[r.customer_gender] = (genders[r.customer_gender] || 0) + 1;
  }
  const genderTotal = Object.values(genders).reduce((a, b) => a + b, 0);
  const genderBreakdown =
    genderTotal > 0
      ? Object.entries(genders)
          .sort((a, b) => b[1] - a[1])
          .map(([g, c]) => `${percent(c, genderTotal)}% ${g}`)
          .join(" · ")
      : "Données genre insuffisantes";

  const freqCounts = countOption(rows, allQuestions, "frequency");
  let frequencySummary = "Fréquence de visite non renseignée dans les réponses";
  if (freqCounts.size > 0) {
    const top = [...freqCounts.entries()].sort((a, b) => b[1].count - a[1].count)[0];
    const isNew = [...freqCounts.entries()].some(
      ([k, v]) => NEW_CLIENT_VALUES.has(norm(k)) && v.count > 0,
    );
    const newCount = [...freqCounts.entries()]
      .filter(([k]) => NEW_CLIENT_VALUES.has(norm(k)) || /premi/i.test(k))
      .reduce((s, [, v]) => s + v.count, 0);
    const freqTotal = [...freqCounts.values()].reduce((s, v) => s + v.count, 0);
    const newPct = percent(newCount, freqTotal || rows.length);
    if (newPct >= 40) {
      frequencySummary = `Majoritairement nouveaux clients (${newPct}%)`;
    } else {
      frequencySummary = `Plutôt clients récurrents — top : « ${top[0]} » (${percent(top[1].count, freqTotal || rows.length)}%)`;
    }
  }

  const bandCounts: Record<string, number> = {};
  for (const age of ages) {
    const b = ageBand(age);
    bandCounts[b] = (bandCounts[b] || 0) + 1;
  }
  const bandTotal = ages.length || 1;
  const ageBands = ["18-25 ans", "26-35 ans", "36-50 ans", "50+ ans"].map((label) => ({
    label,
    percent: percent(bandCounts[label] || 0, bandTotal),
  }));
  const topAgeBand = [...ageBands].sort((a, b) => b.percent - a.percent)[0] ?? {
    label: "—",
    percent: 0,
  };

  const appreciation = mapToInsights(
    countOption(rows, allQuestions, "appreciation"),
    rows.length,
    5,
  );
  const improvement = mapToInsights(
    countOption(rows, allQuestions, "improvement", true),
    rows.length,
    5,
  );

  const positiveWhy = new Map<string, { count: number; quote?: string }>();
  const negativeWhy = new Map<string, { count: number; quote?: string }>();
  const ratingQs = allQuestions.filter((q) => q.type === "rating");

  for (const row of rows) {
    for (const q of ratingQs) {
      const score = Number(getAnswerValue(row.answers, q));
      if (Number.isNaN(score)) continue;
      const why = String(row.answers[`${q.id}_why`] ?? row.answers[`${q.label}_why`] ?? "").trim();
      if (why.length < 6) continue;
      const bucket = score <= 6 ? negativeWhy : score >= 9 ? positiveWhy : null;
      if (!bucket) continue;
      const key = score <= 6 ? "Expérience décevante" : "Points forts";
      const prev = bucket.get(key) ?? { count: 0 };
      bucket.set(key, { count: prev.count + 1, quote: prev.quote ?? why });
    }
  }

  const strengths = [
    ...appreciation,
    ...mapToInsights(positiveWhy, rows.length, 3),
  ]
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 5);

  const weaknesses = improvement
    .filter((w) => !isRienOption(w.label))
    .concat(mapToInsights(negativeWhy, rows.length, 3))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 5);

  const acqCounts = countOption(rows, allQuestions, "acquisition");
  const acqTotal = [...acqCounts.values()].reduce((s, v) => s + v.count, 0) || rows.length;
  const acquisition: AcquisitionBar[] = [...acqCounts.entries()]
    .map(([label, { count }]) => ({
      label,
      count,
      percent: percent(count, acqTotal),
      tip: acquisitionTip(label),
    }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 6);

  const verbatims = collectVerbatims(rows, allQuestions, 5);

  const weekMap = new Map<string, number[]>();
  for (const row of rows) {
    const wk = weekKey(row.completed_at);
    const rs = collectRatings([row], allQuestions);
    if (!rs.length) continue;
    const arr = weekMap.get(wk) ?? [];
    arr.push(rs.reduce((a, b) => a + b, 0) / rs.length);
    weekMap.set(wk, arr);
  }
  const weeklyScores: WeeklyScore[] = [...weekMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-4)
    .map(([wk, scores]) => ({
      weekLabel: weekLabel(wk),
      score: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
      count: scores.length,
    }));

  const trendLabel =
    trend === "up" ? "En progression" : trend === "down" ? "À surveiller" : "Stable";
  const summaryLine =
    globalScore >= 8
      ? `${trendLabel} · Excellente satisfaction (${globalScore}/10) sur ${rows.length} réponses.`
      : globalScore >= 6
        ? `${trendLabel} · Bonne base (${globalScore}/10), des leviers d'amélioration identifiés.`
        : `${trendLabel} · Score ${globalScore}/10 : agissez sur les freins prioritaires.`;

  const partial: Omit<AnalysisReport, "actions"> = {
    responseCount: rows.length,
    lastResponseDate,
    globalScore,
    trend,
    summaryLine,
    avgAge,
    genderBreakdown,
    frequencySummary,
    topAgeBand,
    ageBands,
    strengths,
    weaknesses,
    returnRate,
    recommendRate,
    returnTrend,
    recommendTrend,
    acquisition,
    verbatims,
    weeklyScores,
  };

  return {
    ...partial,
    actions: buildActions(partial, weaknesses, frequencySummary),
  };
}
