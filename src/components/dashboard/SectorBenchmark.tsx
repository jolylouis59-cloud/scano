import { TrendingUp, AlertTriangle, Info } from "lucide-react";

export interface SectorBenchmarkProps {
  sector?: string;
  score?: number;
  sectorAveragePercentile?: number;
  priceComplaintRate?: number;
  priceComplaintThreshold?: number;
}

/**
 * Comparaison sectorielle — à intégrer dans /dashboard/analyse.
 *
 * Props (branchées sur les données réelles Supabase / analyse) :
 * - sector: ex. "coiffeurs", "opticiens", "spas"
 * - score: score moyen accueil/satisfaction du commerçant (0-10)
 * - sectorAveragePercentile: percentile calculé côté backend (0-100)
 * - priceComplaintRate: % de mentions négatives sur le prix (0-100)
 * - priceComplaintThreshold: seuil d'alerte prix (défaut 60)
 */
export default function SectorBenchmark({
  sector,
  score,
  sectorAveragePercentile,
  priceComplaintRate,
  priceComplaintThreshold = 60,
}: SectorBenchmarkProps) {
  const insights = buildInsights({
    sector,
    score,
    sectorAveragePercentile,
    priceComplaintRate,
    priceComplaintThreshold,
  });

  if (insights.length === 0) return null;

  return (
    <section className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFD700]">
          <TrendingUp className="h-4 w-4 text-black" strokeWidth={2.5} />
        </div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Comparaison secteur
        </h3>
      </div>

      <div className="space-y-3">
        {insights.map((insight, i) => (
          <InsightCard key={i} type={insight.type} message={insight.message} />
        ))}
      </div>
    </section>
  );
}

function InsightCard({ type, message }: { type: "info" | "warning"; message: string }) {
  const isWarning = type === "warning";

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 ${
        isWarning
          ? "border-[#FFD700]/30 bg-[#FFD700]/5"
          : "border-zinc-800 bg-zinc-900"
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {isWarning ? (
          <AlertTriangle className="h-4 w-4 text-[#FFD700]" />
        ) : (
          <Info className="h-4 w-4 text-zinc-500" />
        )}
      </div>
      <p className="text-sm leading-relaxed text-zinc-200">{message}</p>
    </div>
  );
}

interface Insight {
  type: "info" | "warning";
  message: string;
}

function buildInsights({
  sector,
  sectorAveragePercentile,
  priceComplaintRate,
  priceComplaintThreshold,
}: {
  sector?: string;
  score?: number;
  sectorAveragePercentile?: number;
  priceComplaintRate?: number;
  priceComplaintThreshold: number;
}): Insight[] {
  const insights: Insight[] = [];

  if (typeof sectorAveragePercentile === "number" && sector) {
    insights.push({
      type: "info",
      message: `Ton accueil est meilleur que ${sectorAveragePercentile}% des ${sector} de ta zone.`,
    });
  }

  if (
    typeof priceComplaintRate === "number" &&
    priceComplaintRate >= priceComplaintThreshold
  ) {
    insights.push({
      type: "warning",
      message: `Attention : tes prix sont perçus comme plus élevés que la moyenne locale (${priceComplaintRate}% des avis le mentionnent). Envisage une offre spéciale sur le prochain passage.`,
    });
  }

  return insights;
}
