import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatAnswersForDisplay } from "@/lib/format-answers";

export const Route = createFileRoute("/dashboard/responses")({
  component: ResponsesPage,
});

interface R {
  id: string;
  quiz_id: string;
  customer_first_name: string | null;
  customer_age: number | null;
  customer_gender: string | null;
  redemption_code: string | null;
  answers: Record<string, unknown>;
  completed_at: string;
}
interface Q { id: string; name: string; free_gift: string | null; }

function ResponsesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<R[]>([]);
  const [quizzes, setQuizzes] = useState<Q[]>([]);
  const [qid, setQid] = useState("all");
  const [ageRange, setAgeRange] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("responses").select("*").eq("merchant_id", user.id).order("completed_at", { ascending: false }),
      supabase.from("quizzes").select("id, name, free_gift").eq("merchant_id", user.id),
    ]).then(([r, q]) => {
      setRows((r.data as R[]) || []);
      setQuizzes((q.data as Q[]) || []);
    });
  }, [user]);

  const filtered = useMemo(() => rows.filter(r => {
    if (qid !== "all" && r.quiz_id !== qid) return false;
    if (dateFilter && !r.completed_at.startsWith(dateFilter)) return false;
    if (ageRange !== "all" && r.customer_age != null) {
      const [min, max] = ageRange.split("-").map(Number);
      if (r.customer_age < min || r.customer_age > max) return false;
    }
    return true;
  }), [rows, qid, ageRange, dateFilter]);

  const giftFor = (id: string) => quizzes.find(q => q.id === id)?.free_gift || "—";

  const exportCsv = () => {
    const headers = ["date", "prenom", "age", "genre", "quiz", "cadeau", "code", "reponses"];
    const lines = [headers.join(",")];
    filtered.forEach(r => {
      const row = [
        new Date(r.completed_at).toISOString(),
        r.customer_first_name ?? "",
        r.customer_age ?? "",
        r.customer_gender ?? "",
        quizzes.find(q => q.id === r.quiz_id)?.name ?? "",
        giftFor(r.quiz_id),
        r.redemption_code ?? "",
        JSON.stringify(r.answers).replace(/"/g, '""'),
      ].map(v => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(row.join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `scano-reponses-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Réponses</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} réponse(s)</p>
        </div>
        <button onClick={exportCsv} disabled={filtered.length === 0} className="btn-yellow disabled:opacity-50">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <div className="bg-background border border-border rounded-2xl p-4 grid sm:grid-cols-3 gap-3">
        <select value={qid} onChange={e => setQid(e.target.value)}
          className="px-3 py-2 rounded-lg border border-input bg-background">
          <option value="all">Tous les quiz</option>
          {quizzes.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
        </select>
        <select value={ageRange} onChange={e => setAgeRange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-input bg-background">
          <option value="all">Tous âges</option>
          <option value="18-25">18-25</option>
          <option value="26-35">26-35</option>
          <option value="36-50">36-50</option>
          <option value="51-99">51+</option>
        </select>
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-input bg-background" />
      </div>

      <div className="bg-background border border-border rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">Aucune réponse pour le moment.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-3">Date</th><th className="p-3">Prénom</th><th className="p-3">Âge</th>
                  <th className="p-3">Code</th><th className="p-3">Réponses</th><th className="p-3">Cadeau</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-t border-border align-top">
                    <td className="p-3 whitespace-nowrap">{new Date(r.completed_at).toLocaleDateString("fr-FR")}</td>
                    <td className="p-3">{r.customer_first_name ?? "—"}</td>
                    <td className="p-3">{r.customer_age ?? "—"}</td>
                    <td className="p-3 font-mono text-xs font-bold whitespace-nowrap">
                      {r.redemption_code ?? "—"}
                    </td>
                    <td className="p-3 max-w-md">
                      <details>
                        <summary className="cursor-pointer text-foreground">
                          Voir ({formatAnswersForDisplay(r.answers).length})
                        </summary>
                        <ul className="mt-2 text-xs space-y-1.5 bg-secondary p-3 rounded">
                          {formatAnswersForDisplay(r.answers).map((row) => (
                            <li key={row.label}>
                              <span className="font-semibold text-foreground">{row.label} :</span>{" "}
                              <span className="text-muted-foreground">{row.value}</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    </td>
                    <td className="p-3">{giftFor(r.quiz_id)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
