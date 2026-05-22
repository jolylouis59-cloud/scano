import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type ComponentType } from "react";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  ThumbsUp,
  AlertTriangle,
  Target,
  Megaphone,
  MessageSquareQuote,
  ListOrdered,
  LineChart,
  QrCode,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Question } from "@/lib/quiz-types";
import {
  buildAnalysisReport,
  MIN_RESPONSES_FOR_ANALYSIS,
  type AnalysisReport,
  type ResponseRow,
  type Sentiment,
} from "@/lib/quiz-analytics";

export const Route = createFileRoute("/dashboard/analyse")({
  component: AnalysePage,
});

function TrendBadge({ trend }: { trend: AnalysisReport["trend"] }) {
  if (trend === "up") {
    return (
      <span className="inline-flex items-center gap-1 text-[#22C55E] font-semibold text-sm">
        <TrendingUp className="h-4 w-4" /> En progression
      </span>
    );
  }
  if (trend === "down") {
    return (
      <span className="inline-flex items-center gap-1 text-[#EF4444] font-semibold text-sm">
        <TrendingDown className="h-4 w-4" /> À surveiller
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-gray-400 font-semibold text-sm">
      <Minus className="h-4 w-4" /> Stable
    </span>
  );
}

function gaugeColor(percent: number): string {
  if (percent > 70) return "#22C55E";
  if (percent >= 50) return "#F97316";
  return "#EF4444";
}

function IntentGauge({ label, value, delta }: { label: string; value: number; delta: number | null }) {
  const color = gaugeColor(value);
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline gap-2">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-2xl font-black" style={{ color }}>
          {value}%
        </span>
      </div>
      <div className="h-3 w-full rounded-full bg-black/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }}
        />
      </div>
      {delta != null && (
        <p className={`text-xs font-medium ${delta >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
          {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)} pts vs semaine précédente
        </p>
      )}
    </div>
  );
}

function SentimentTag({ sentiment }: { sentiment: Sentiment }) {
  const map = {
    positive: { emoji: "😊", label: "Positif", className: "bg-green-100 text-green-800" },
    neutral: { emoji: "😐", label: "Neutre", className: "bg-gray-100 text-gray-700" },
    negative: { emoji: "😞", label: "Négatif", className: "bg-red-100 text-red-800" },
  }[sentiment];
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${map.className}`}>
      {map.emoji} {map.label}
    </span>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/30">
        <Icon className="h-5 w-5 text-foreground" />
      </span>
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function AnalysePage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ResponseRow[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [respRes, quizRes] = await Promise.all([
      supabase
        .from("responses")
        .select("id, quiz_id, customer_age, customer_gender, answers, completed_at")
        .eq("merchant_id", user.id)
        .order("completed_at", { ascending: false }),
      supabase.from("quizzes").select("questions").eq("merchant_id", user.id),
    ]);
    const r = (respRes.data as ResponseRow[]) || [];
    setRows(r);
    const qs: Question[] = [];
    for (const q of quizRes.data || []) {
      const list = (q as { questions: Question[] }).questions;
      if (Array.isArray(list)) qs.push(...list);
    }
    setQuestions(qs);
    setLoading(false);
    return { rows: r, questions: qs };
  }, [user]);

  const runAnalysis = useCallback(
    async (showSpinner = true) => {
      if (!user) return;
      if (showSpinner) setGenerating(true);
      const data = rows.length ? { rows, questions } : await loadData();
      const next = buildAnalysisReport(data.rows, data.questions);
      setReport(next);
      setGeneratedAt(new Date());
      if (showSpinner) setGenerating(false);
    },
    [user, rows, questions, loadData],
  );

  useEffect(() => {
    void loadData().then((data) => {
      if (data && data.rows.length >= MIN_RESPONSES_FOR_ANALYSIS) {
        setReport(buildAnalysisReport(data.rows, data.questions));
        setGeneratedAt(new Date());
      }
    });
  }, [loadData]);

  const missing = MIN_RESPONSES_FOR_ANALYSIS - rows.length;
  const lastDate = report?.lastResponseDate
    ? new Date(report.lastResponseDate).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analyse IA</h1>
          <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span>
              <strong className="text-foreground">{rows.length}</strong> réponse{rows.length !== 1 ? "s" : ""}{" "}
              analysée{rows.length !== 1 ? "s" : ""}
            </span>
            {lastDate && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Dernière : {lastDate}
              </span>
            )}
            {generatedAt && report && (
              <span className="text-xs text-muted-foreground">
                Générée le {generatedAt.toLocaleString("fr-FR")}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void runAnalysis(true)}
          disabled={loading || generating || rows.length < MIN_RESPONSES_FOR_ANALYSIS}
          className="btn-yellow shrink-0"
        >
          <Sparkles className="h-4 w-4" />
          {generating ? "Analyse en cours…" : "Générer une nouvelle analyse"}
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border p-12 text-center text-muted-foreground">
          Chargement des réponses…
        </div>
      ) : !report ? (
        <div className="rounded-2xl border border-border bg-background p-10 sm:p-14 text-center max-w-lg mx-auto shadow-sm">
          <p className="text-5xl mb-4">📊</p>
          <h2 className="text-xl font-bold mb-2">Pas encore assez de données</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            Il vous manque encore <strong>{missing > 0 ? missing : MIN_RESPONSES_FOR_ANALYSIS}</strong> réponse
            {missing > 1 ? "s" : ""} pour débloquer l'analyse complète (minimum {MIN_RESPONSES_FOR_ANALYSIS}).
          </p>
          <Link to="/dashboard/qrcode" className="btn-yellow inline-flex">
            <QrCode className="h-4 w-4" /> Voir mon QR code
          </Link>
        </div>
      ) : (
        <>
          {/* 2. Synthèse globale */}
          <section className="rounded-2xl bg-dark text-dark-foreground p-6 sm:p-8 shadow-lg">
            <p className="text-xs uppercase tracking-widest text-primary font-bold mb-4">Synthèse globale</p>
            <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-10">
              <div>
                <p className="text-6xl sm:text-7xl font-black text-primary leading-none">
                  {report.globalScore}
                  <span className="text-2xl text-dark-foreground/60 font-bold">/10</span>
                </p>
                <p className="text-sm text-dark-foreground/70 mt-2">Score de satisfaction global</p>
              </div>
              <div className="flex-1 space-y-2">
                <TrendBadge trend={report.trend} />
                <p className="text-lg font-medium leading-snug">{report.summaryLine}</p>
              </div>
            </div>
          </section>

          {/* 3. Ton client type */}
          <section className="rounded-2xl border border-border bg-background p-6 shadow-sm">
            <SectionTitle icon={Users} title="Ton client type" subtitle="Basé sur les profils collectés" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl bg-secondary/60 p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Âge moyen</p>
                <p className="text-3xl font-black">{report.avgAge != null ? `${report.avgAge} ans` : "—"}</p>
              </div>
              <div className="rounded-xl bg-secondary/60 p-4 sm:col-span-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Genre</p>
                <p className="text-lg font-bold leading-snug">{report.genderBreakdown}</p>
              </div>
              <div className="rounded-xl bg-secondary/60 p-4 lg:col-span-1 sm:col-span-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Fréquence</p>
                <p className="text-sm font-semibold leading-relaxed">{report.frequencySummary}</p>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-sm font-semibold mb-3">
                Tranche la plus représentée : <span className="text-primary">{report.topAgeBand.label}</span> (
                {report.topAgeBand.percent}%)
              </p>
              <div className="space-y-2">
                {report.ageBands.map((b) => (
                  <div key={b.label} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-20 shrink-0">{b.label}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${b.percent}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold w-10 text-right">{b.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 4. Ce qui fonctionne */}
          <section className="rounded-2xl border border-[#22C55E]/30 bg-[#22C55E]/8 p-6 shadow-sm">
            <SectionTitle icon={ThumbsUp} title="Ce qui fonctionne" />
            {report.strengths.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun signal positif structuré pour l'instant.</p>
            ) : (
              <ul className="space-y-4">
                {report.strengths.map((s) => (
                  <li key={s.label} className="border-b border-[#22C55E]/20 pb-4 last:border-0 last:pb-0">
                    <p className="font-bold text-base">
                      ✅ &quot;{s.label}&quot; — mentionné par {s.percent}% des clients
                    </p>
                    {s.quote && (
                      <p className="text-sm text-muted-foreground mt-2 italic pl-1">
                        💬 &quot;{s.quote}&quot;
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 5. Ce qu'il faut améliorer */}
          <section className="rounded-2xl border border-[#EF4444]/30 bg-[#EF4444]/8 p-6 shadow-sm">
            <SectionTitle icon={AlertTriangle} title="Ce qu'il faut améliorer" />
            {report.weaknesses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun frein majeur détecté — continuez ainsi !</p>
            ) : (
              <ul className="space-y-4">
                {report.weaknesses.map((w) => (
                  <li key={w.label} className="border-b border-[#EF4444]/20 pb-4 last:border-0 last:pb-0">
                    <p className="font-bold text-base">
                      ⚠️ &quot;{w.label}&quot; — cité par {w.percent}% des clients
                    </p>
                    {w.quote && (
                      <p className="text-sm text-muted-foreground mt-2 italic pl-1">
                        💬 &quot;{w.quote}&quot;
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 6. Intentions futures */}
          <section className="rounded-2xl border border-border bg-background p-6 shadow-sm">
            <SectionTitle icon={Target} title="Intentions futures" />
            <div className="grid sm:grid-cols-2 gap-8">
              <IntentGauge
                label="Déclarent vouloir revenir"
                value={report.returnRate}
                delta={report.returnTrend}
              />
              <IntentGauge
                label="Recommanderaient votre commerce"
                value={report.recommendRate}
                delta={report.recommendTrend}
              />
            </div>
          </section>

          {/* 7. Canal d'acquisition */}
          <section className="rounded-2xl border border-border bg-background p-6 shadow-sm">
            <SectionTitle icon={Megaphone} title="Canal d'acquisition" />
            {report.acquisition.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune question « comment nous avez-vous découvert » dans vos quiz actuels.
              </p>
            ) : (
              <div className="space-y-6">
                {report.acquisition.map((a) => (
                  <div key={a.label}>
                    <div className="flex justify-between text-sm font-semibold mb-1.5">
                      <span>{a.label}</span>
                      <span>{a.percent}%</span>
                    </div>
                    <div className="h-4 w-full rounded-lg bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-lg bg-[#FFD60A] border-r-2 border-[#111111] transition-all min-w-[2%]"
                        style={{ width: `${Math.max(a.percent, 2)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">💡 {a.tip}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 8. Verbatims */}
          <section className="rounded-2xl border border-border bg-background p-6 shadow-sm">
            <SectionTitle icon={MessageSquareQuote} title="Verbatims clients" subtitle="5 derniers textes libres" />
            {report.verbatims.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun verbatim textuel pour le moment.</p>
            ) : (
              <ul className="space-y-4">
                {report.verbatims.map((v, i) => (
                  <li key={`${v.date}-${i}`} className="rounded-xl border border-border p-4 bg-secondary/30">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <SentimentTag sentiment={v.sentiment} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(v.date).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    <p className="italic text-foreground leading-relaxed">&quot;{v.text}&quot;</p>
                    <p className="text-xs text-muted-foreground mt-2">Contexte : {v.context}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 9. Actions prioritaires */}
          <section className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-6 shadow-sm">
            <SectionTitle icon={ListOrdered} title="3 actions prioritaires" subtitle="Basées sur vos vraies données" />
            <div className="grid gap-4">
              {report.actions.map((a) => (
                <div
                  key={a.rank}
                  className="flex gap-4 rounded-xl bg-background border border-border p-5 shadow-sm"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFD60A] text-[#111111] font-black text-lg">
                    {a.rank}
                  </span>
                  <div>
                    <h3 className="font-bold text-base">{a.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{a.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 10. Évolution */}
          {report.weeklyScores.length > 1 && (
            <section className="rounded-2xl border border-border bg-background p-6 shadow-sm">
              <SectionTitle
                icon={LineChart}
                title="Évolution dans le temps"
                subtitle="Score moyen par semaine (4 dernières)"
              />
              <div className="flex items-end justify-between gap-3 h-48 pt-4">
                {report.weeklyScores.map((w) => {
                  const h = Math.max(12, (w.score / 10) * 100);
                  return (
                    <div key={w.weekLabel} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                      <span className="text-sm font-black">{w.score}</span>
                      <div
                        className="w-full max-w-[4rem] mx-auto rounded-t-lg bg-[#FFD60A] border-2 border-b-0 border-[#111111] transition-all"
                        style={{ height: `${h}%` }}
                        title={`${w.count} réponse(s)`}
                      />
                      <span className="text-[10px] font-semibold text-muted-foreground text-center truncate w-full">
                        {w.weekLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
