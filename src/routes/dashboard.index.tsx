import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Users, TrendingUp, ScanLine, Clock, Target } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Question } from "@/lib/quiz-types";
import {
  buildAnalysisReport,
  MIN_RESPONSES_FOR_ANALYSIS,
  type ResponseRow,
} from "@/lib/quiz-analytics";
import {
  computeObjectiveProgress,
  getMerchantObjectiveOption,
  type MerchantObjectiveId,
} from "@/lib/merchant-objectives";
import {
  computeSatisfactionScore,
  satisfactionScoreColor,
} from "@/lib/satisfaction-score";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

interface Resp extends ResponseRow {
  customer_gender: string | null;
}

function DashboardHome() {
  const { merchant, user } = useAuth();
  const [responses, setResponses] = useState<Resp[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [scanRate, setScanRate] = useState(0);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase
        .from("responses")
        .select("*")
        .eq("merchant_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(100),
      supabase.from("quizzes").select("questions").eq("merchant_id", user.id),
    ]).then(([r, q]) => {
      setResponses((r.data as Resp[]) || []);
      const qs: Question[] = [];
      for (const row of q.data || []) {
        const list = (row as { questions: Question[] }).questions;
        if (Array.isArray(list)) qs.push(...list);
      }
      setQuestions(qs);
      setScanRate(Math.min(100, Math.round(((r.data?.length || 0) / 100) * 78)));
    });
  }, [user]);

  const total = responses.length;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = responses.filter((r) => new Date(r.completed_at).getTime() > weekAgo).length;
  const last = responses[0];

  const satisfactionScore = useMemo(
    () => computeSatisfactionScore(responses, questions),
    [responses, questions],
  );

  const analysisReport = useMemo(
    () => (total >= MIN_RESPONSES_FOR_ANALYSIS ? buildAnalysisReport(responses, questions) : null),
    [responses, questions, total],
  );

  const objectiveId = merchant?.objective as MerchantObjectiveId | null | undefined;
  const objectiveOpt = objectiveId ? getMerchantObjectiveOption(objectiveId) : undefined;
  const objectiveProgress =
    objectiveId && objectiveOpt
      ? computeObjectiveProgress(
          objectiveId,
          merchant?.objective_target,
          satisfactionScore,
          analysisReport,
        )
      : null;

  const metrics = [
    { label: "Total réponses", value: total, icon: Users },
    { label: "Nouveaux cette semaine", value: thisWeek, icon: TrendingUp },
    { label: "Taux de scan", value: `${scanRate}%`, icon: ScanLine },
    {
      label: "Dernier scan",
      value: last ? new Date(last.completed_at).toLocaleDateString("fr-FR") : "—",
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Bonjour {merchant?.name || ""} 👋</h1>
          <p className="text-muted-foreground mt-1">Voici un aperçu de ton activité.</p>
        </div>
        <Link to="/dashboard/quiz" className="btn-yellow">
          Créer un nouveau quiz <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-background border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Score de satisfaction
          </h2>
          {total >= MIN_RESPONSES_FOR_ANALYSIS && satisfactionScore != null ? (
            <>
              <p
                className="text-5xl sm:text-6xl font-black leading-none"
                style={{ color: satisfactionScoreColor(satisfactionScore) }}
              >
                {satisfactionScore}
                <span className="text-2xl text-muted-foreground font-bold"> / 10</span>
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                Basé sur {total} réponse{total > 1 ? "s" : ""} (notes, oui/non, intentions de retour).
              </p>
            </>
          ) : (
            <p className="text-lg font-medium text-muted-foreground leading-relaxed">
              Collecte {Math.max(0, MIN_RESPONSES_FOR_ANALYSIS - total)} réponse
              {MIN_RESPONSES_FOR_ANALYSIS - total > 1 ? "s" : ""} de plus pour voir ton score
              {total > 0 ? ` (${total}/${MIN_RESPONSES_FOR_ANALYSIS})` : ""}.
            </p>
          )}
        </div>

        <div className="bg-background border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/30">
              <Target className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold text-lg">Mon objectif du moment</h2>
              {!objectiveOpt && (
                <p className="text-sm text-muted-foreground mt-1">
                  Définis une priorité pour suivre ta progression.
                </p>
              )}
            </div>
          </div>

          {!objectiveOpt ? (
            <Link
              to="/dashboard/settings"
              className="inline-flex items-center gap-2 font-semibold text-foreground underline underline-offset-4"
            >
              Définir mon objectif →
            </Link>
          ) : (
            <div className="space-y-4">
              <p className="font-semibold">
                {objectiveOpt.emoji} {objectiveOpt.label}
              </p>
              {merchant?.objective_target && (
                <p className="text-sm text-muted-foreground">Cible : {merchant.objective_target}</p>
              )}
              {merchant?.objective_date && (
                <p className="text-sm text-muted-foreground">
                  Date cible :{" "}
                  {new Date(merchant.objective_date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span>{objectiveProgress?.currentLabel}</span>
                  <span>{objectiveProgress?.percent}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${objectiveProgress?.percent ?? 0}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{objectiveProgress?.targetLabel}</p>
              </div>
              {total >= MIN_RESPONSES_FOR_ANALYSIS && objectiveProgress?.tip && (
                <p className="text-sm rounded-lg bg-secondary/80 border border-border p-3 leading-relaxed">
                  💡 {objectiveProgress.tip}
                </p>
              )}
              {total < MIN_RESPONSES_FOR_ANALYSIS && (
                <p className="text-xs text-muted-foreground">
                  Le conseil personnalisé s&apos;affichera avec au moins {MIN_RESPONSES_FOR_ANALYSIS} réponses.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-background border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {m.label}
              </span>
              <m.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-background border border-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-bold">Réponses récentes</h2>
        </div>
        {responses.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            Pas encore de réponse.{" "}
            <Link to="/dashboard/quiz" className="underline font-semibold text-foreground">
              Crée ton premier quiz
            </Link>
            .
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Âge</th>
                  <th className="p-3">Genre</th>
                  <th className="p-3">Pourquoi venu</th>
                  <th className="p-3">Revient ?</th>
                </tr>
              </thead>
              <tbody>
                {responses.slice(0, 10).map((r) => {
                  const a = r.answers as Record<string, unknown>;
                  return (
                    <tr key={r.id} className="border-t border-border">
                      <td className="p-3">{new Date(r.completed_at).toLocaleDateString("fr-FR")}</td>
                      <td className="p-3">{r.customer_age ?? "—"}</td>
                      <td className="p-3">{r.customer_gender ?? "—"}</td>
                      <td className="p-3 truncate max-w-xs">{String(a.why ?? a.reason ?? "—")}</td>
                      <td className="p-3">{String(a.return ?? a.would_return ?? "—")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
