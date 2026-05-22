import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { MERCHANT_OBJECTIVE_OPTIONS, type MerchantObjectiveId } from "@/lib/merchant-objectives";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { merchant, user, refreshMerchant, signOut } = useAuth();
  const navigate = useNavigate();
  const [bn, setBn] = useState("");
  const [email, setEmail] = useState("");
  const [objective, setObjective] = useState<MerchantObjectiveId | "">("");
  const [objectiveTarget, setObjectiveTarget] = useState("");
  const [objectiveDate, setObjectiveDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (merchant) {
      setBn(merchant.business_name ?? "");
      setEmail(merchant.email);
      setObjective((merchant.objective as MerchantObjectiveId) || "");
      setObjectiveTarget(merchant.objective_target ?? "");
      setObjectiveDate(merchant.objective_date ? merchant.objective_date.slice(0, 10) : "");
    }
  }, [merchant]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("merchants")
      .update({
        business_name: bn,
        objective: objective || null,
        objective_target: objectiveTarget.trim() || null,
        objective_date: objectiveDate || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Paramètres enregistrés");
    await refreshMerchant();
  };

  const logout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const selectedObjective = MERCHANT_OBJECTIVE_OPTIONS.find((o) => o.id === objective);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground mt-1">Gère ton compte et ton abonnement.</p>
      </div>

      <div className="bg-background border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-bold">Mon commerce</h2>
        <div>
          <label className="text-sm font-semibold mb-1 block">Nom du commerce</label>
          <input
            value={bn}
            onChange={(e) => setBn(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-input outline-none focus:border-foreground"
          />
        </div>
        <div>
          <label className="text-sm font-semibold mb-1 block">Email de contact</label>
          <input
            value={email}
            disabled
            className="w-full px-4 py-3 rounded-lg border border-input bg-secondary text-muted-foreground"
          />
        </div>
        <button onClick={save} disabled={saving} className="btn-yellow">
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>

      <div className="bg-background border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-bold">Mon objectif</h2>
        <p className="text-sm text-muted-foreground">
          Affiché sur ton tableau de bord avec une barre de progression basée sur tes réponses.
        </p>
        <div>
          <label className="text-sm font-semibold mb-1 block">Priorité du moment</label>
          <select
            value={objective}
            onChange={(e) => {
              const id = e.target.value as MerchantObjectiveId | "";
              setObjective(id);
              const opt = MERCHANT_OBJECTIVE_OPTIONS.find((o) => o.id === id);
              if (opt && !objectiveTarget.trim()) setObjectiveTarget(opt.defaultTarget);
            }}
            className="w-full px-4 py-3 rounded-lg border border-input bg-background outline-none focus:border-foreground"
          >
            <option value="">— Choisir un objectif —</option>
            {MERCHANT_OBJECTIVE_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.emoji} {o.label}
              </option>
            ))}
          </select>
        </div>
        {selectedObjective && (
          <p className="text-xs text-muted-foreground rounded-lg bg-secondary p-3">
            Exemple de cible : {selectedObjective.defaultTarget}
          </p>
        )}
        <div>
          <label className="text-sm font-semibold mb-1 block">
            Objectif chiffré <span className="font-normal text-muted-foreground">(optionnel)</span>
          </label>
          <input
            value={objectiveTarget}
            onChange={(e) => setObjectiveTarget(e.target.value)}
            placeholder="Ex : Atteindre 8/10 de satisfaction"
            className="w-full px-4 py-3 rounded-lg border border-input outline-none focus:border-foreground"
          />
        </div>
        <div>
          <label className="text-sm font-semibold mb-1 block">
            Date cible <span className="font-normal text-muted-foreground">(optionnel)</span>
          </label>
          <input
            type="date"
            value={objectiveDate}
            onChange={(e) => setObjectiveDate(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-input bg-background outline-none focus:border-foreground"
          />
        </div>
        <button onClick={save} disabled={saving} className="btn-outline-dark">
          {saving ? "Enregistrement..." : "Enregistrer l'objectif"}
        </button>
      </div>

      <div className="bg-background border border-border rounded-2xl p-6">
        <h2 className="font-bold mb-2">Plan actuel</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold capitalize">{merchant?.plan || "starter"}</div>
            <div className="text-sm text-muted-foreground">Tu peux changer de formule à tout moment.</div>
          </div>
          <button
            onClick={() =>
              toast.info("Configuration Stripe à venir — dis-le moi quand tu veux activer les paiements.")
            }
            className="btn-outline-dark"
          >
            Changer de plan
          </button>
        </div>
      </div>

      <div className="bg-background border border-border rounded-2xl p-6">
        <button onClick={logout} className="flex items-center gap-2 text-destructive font-semibold">
          <LogOut className="h-4 w-4" /> Se déconnecter
        </button>
      </div>
    </div>
  );
}
