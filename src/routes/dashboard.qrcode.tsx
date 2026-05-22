import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Printer } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/qrcode")({
  validateSearch: z.object({ id: z.string().optional() }).parse,
  component: QrPage,
});

interface QuizLite { id: string; name: string; }

function QrPage() {
  const { id } = Route.useSearch();
  const { user, merchant } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizLite[]>([]);
  const [selected, setSelected] = useState<string | undefined>(id);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("quizzes").select("id, name").eq("merchant_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => {
        const list = (data as QuizLite[]) || [];
        setQuizzes(list);
        if (!selected && list[0]) setSelected(list[0].id);
      });
  }, [user]);

  const quizUrl = selected ? `${typeof window !== "undefined" ? window.location.origin : ""}/quiz/${selected}` : "";

  const downloadPng = () => {
    const canvas = wrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url; a.download = `scano-qrcode-${selected}.png`; a.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ton QR code</h1>
        <p className="text-muted-foreground mt-1">À imprimer et coller en caisse.</p>
      </div>

      {quizzes.length === 0 ? (
        <div className="bg-background border border-border rounded-2xl p-10 text-center text-muted-foreground">
          Crée d'abord un quiz pour générer ton QR code.
        </div>
      ) : (
        <>
          <div className="bg-background border border-border rounded-2xl p-5">
            <label className="text-sm font-semibold mb-2 block">Choisir un quiz</label>
            <select value={selected} onChange={e => setSelected(e.target.value)}
              className="w-full sm:w-auto px-4 py-3 rounded-lg border border-input bg-background outline-none focus:border-foreground">
              {quizzes.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
            </select>
          </div>

          <div ref={wrapRef} className="bg-background border border-border rounded-2xl p-10 flex flex-col items-center text-center print:border-0">
            <h2 className="text-2xl font-bold mb-1">{merchant?.business_name || "Mon commerce"}</h2>
            <p className="text-muted-foreground mb-6">Scannez pour gagner un cadeau&nbsp;!</p>
            {selected && (
              <div className="p-5 bg-white border-4 border-foreground rounded-2xl">
                <QRCodeCanvas value={quizUrl} size={260} level="H" />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-6 break-all max-w-xs">{quizUrl}</p>
          </div>

          <div className="flex flex-wrap gap-3 print:hidden">
            <button onClick={downloadPng} className="btn-yellow"><Download className="h-4 w-4" /> Télécharger PNG</button>
            <button onClick={() => window.print()} className="btn-outline-dark"><Printer className="h-4 w-4" /> Imprimer</button>
          </div>
        </>
      )}
    </div>
  );
}
