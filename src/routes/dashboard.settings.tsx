import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { merchant, user, refreshMerchant, signOut } = useAuth();
  const navigate = useNavigate();
  const [bn, setBn] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (merchant) { setBn(merchant.business_name ?? ""); setEmail(merchant.email); }
  }, [merchant]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("merchants").update({ business_name: bn }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Paramètres enregistrés");
    await refreshMerchant();
  };

  const logout = async () => { await signOut(); navigate({ to: "/" }); };

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
          <input value={bn} onChange={e => setBn(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-input outline-none focus:border-foreground" />
        </div>
        <div>
          <label className="text-sm font-semibold mb-1 block">Email de contact</label>
          <input value={email} disabled className="w-full px-4 py-3 rounded-lg border border-input bg-secondary text-muted-foreground" />
        </div>
        <button onClick={save} disabled={saving} className="btn-yellow">{saving ? "Enregistrement..." : "Enregistrer"}</button>
      </div>

      <div className="bg-background border border-border rounded-2xl p-6">
        <h2 className="font-bold mb-2">Plan actuel</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold capitalize">{merchant?.plan || "starter"}</div>
            <div className="text-sm text-muted-foreground">Tu peux changer de formule à tout moment.</div>
          </div>
          <button onClick={() => toast.info("Configuration Stripe à venir — dis-le moi quand tu veux activer les paiements.")} className="btn-outline-dark">
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
