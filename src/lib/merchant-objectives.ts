import type { AnalysisReport } from "@/lib/quiz-analytics";

export type MerchantObjectiveId = "loyalty" | "rating" | "acquisition" | "revenue" | "friction";

export const MERCHANT_OBJECTIVE_OPTIONS: {
  id: MerchantObjectiveId;
  emoji: string;
  label: string;
  defaultTarget: string;
}[] = [
  { id: "loyalty", emoji: "🎯", label: "Augmenter mon taux de retour client", defaultTarget: "70% de clients qui reviennent" },
  { id: "rating", emoji: "⭐", label: "Améliorer ma note moyenne", defaultTarget: "Atteindre 8/10 de satisfaction" },
  { id: "acquisition", emoji: "📣", label: "Comprendre d'où viennent mes clients", defaultTarget: "Identifier mon canal n°1" },
  { id: "revenue", emoji: "💰", label: "Augmenter le panier moyen", defaultTarget: "Mieux segmenter mes clients" },
  { id: "friction", emoji: "🚨", label: "Identifier les points de friction", defaultTarget: "Réduire les freins majeurs" },
];

export function getMerchantObjectiveOption(id: string | null | undefined) {
  return MERCHANT_OBJECTIVE_OPTIONS.find((o) => o.id === id);
}

function parseTargetScore10(target: string): number | null {
  const m = target.match(/(\d+(?:[.,]\d+)?)\s*\/\s*10/i) ?? target.match(/(\d+(?:[.,]\d+)?)\s*sur\s*10/i);
  if (m) return Number(m[1].replace(",", "."));
  const m2 = target.match(/(\d+(?:[.,]\d+)?)/);
  if (m2 && /satisfaction|note|10/i.test(target)) return Number(m2[1].replace(",", "."));
  return null;
}

function parseTargetPercent(target: string): number | null {
  const m = target.match(/(\d+)\s*%/);
  return m ? Number(m[1]) : null;
}

export interface ObjectiveProgress {
  currentLabel: string;
  targetLabel: string;
  percent: number;
  tip: string;
}

export function computeObjectiveProgress(
  objectiveId: MerchantObjectiveId,
  objectiveTarget: string | null | undefined,
  globalScore: number | null,
  report: AnalysisReport | null,
): ObjectiveProgress {
  const opt = getMerchantObjectiveOption(objectiveId)!;
  const target = objectiveTarget?.trim() || opt.defaultTarget;

  switch (objectiveId) {
    case "loyalty": {
      const current = report?.returnRate ?? 0;
      const goal = parseTargetPercent(target) ?? 70;
      return {
        currentLabel: `${current}% envisagent de revenir`,
        targetLabel: target,
        percent: Math.min(100, Math.round((current / goal) * 100)),
        tip:
          current < 50
            ? "Relancez les clients satisfaits avec une offre de retour sous 30 jours."
            : "Capitalisez sur les clients fidèles : programme de parrainage ou carte de fidélité.",
      };
    }
    case "rating": {
      const current = globalScore ?? 0;
      const goal = parseTargetScore10(target) ?? 8;
      return {
        currentLabel: globalScore != null ? `${globalScore} / 10` : "—",
        targetLabel: target,
        percent: Math.min(100, Math.round((current / goal) * 100)),
        tip:
          globalScore != null && globalScore < 7
            ? "Analysez les verbatims des notes 7-8 pour comprendre ce qui bloque le 9/10."
            : "Demandez un avis Google aux clients qui ont mis 9 ou 10.",
      };
    }
    case "acquisition": {
      const top = report?.acquisition[0];
      const current = top?.percent ?? 0;
      return {
        currentLabel: top ? `${top.label} (${top.percent}%)` : "Données en cours",
        targetLabel: target,
        percent: top ? Math.min(100, top.percent + 20) : 10,
        tip: top?.tip ?? "Ajoutez une question « comment nous avez-vous découvert » à votre quiz.",
      };
    }
    case "revenue": {
      const current = globalScore != null ? Math.round(globalScore * 10) : 0;
      return {
        currentLabel: globalScore != null ? `Score expérience ${globalScore}/10` : "—",
        targetLabel: target,
        percent: Math.min(100, current),
        tip: "Croisez budget déclaré et fréquence de visite dans vos réponses pour ajuster vos offres.",
      };
    }
    case "friction": {
      const top = report?.weaknesses[0];
      const burden = top?.percent ?? 0;
      const current = Math.max(0, 100 - burden);
      return {
        currentLabel: top ? `Frein principal : ${top.label} (${top.percent}%)` : "Peu de freins détectés",
        targetLabel: target,
        percent: Math.min(100, current),
        tip: top
          ? `Priorisez « ${top.label} » : ${top.percent}% de vos clients l'ont mentionné.`
          : "Continuez à surveiller les retours libres dans les verbatims.",
      };
    }
  }
}
