import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Users, TrendingUp, ScanLine, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

interface Resp {
  id: string;
  customer_age: number | null;
  customer_gender: string | null;
  completed_at: string;
  answers: Record<string, unknown>;
}

function DashboardHome() {
  const { merchant, user } = useAuth();
  const [responses, setResponses] = useState<Resp[]>([]);
  const [scanRate, setScanRate] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("responses").select("*").eq("merchant_id", user.id)
      .order("completed_at", { ascending: false }).limit(50)
      .then(({ data }) => {
        setResponses((data as Resp[]) || []);
        setScanRate(Math.min(100, Math.round(((data?.length || 0) / 100) * 78)));
      });
  }, [user]);

  const total = responses.length;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = responses.filter(r => new Date(r.completed_at).getTime() > weekAgo).length;
  const last = responses[0];

  const metrics = [
    { label: "Total réponses", value: total, icon: Users },
    { label: "Nouveaux cette semaine", value: thisWeek, icon: TrendingUp },
    { label: "Taux de scan", value: `${scanRate}%`, icon: ScanLine },
    { label: "Dernier scan", value: last ? new Date(last.completed_at).toLocaleDateString("fr-FR") : "—", icon: Clock },
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => (
          <div key={m.label} className="bg-background border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{m.label}</span>
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
            Pas encore de réponse. <Link to="/dashboard/quiz" className="underline font-semibold text-foreground">Crée ton premier quiz</Link>.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-3">Date</th><th className="p-3">Âge</th><th className="p-3">Genre</th>
                  <th className="p-3">Pourquoi venu</th><th className="p-3">Revient ?</th>
                </tr>
              </thead>
              <tbody>
                {responses.slice(0, 10).map(r => {
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
