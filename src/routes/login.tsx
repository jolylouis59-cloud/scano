import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Connexion impossible : " + error.message);
      return;
    }
    const {
      data: { user: signedInUser },
    } = await supabase.auth.getUser();
    const { data: merchant } = signedInUser
      ? await supabase
          .from("merchants")
          .select("plan")
          .eq("id", signedInUser.id)
          .maybeSingle()
      : { data: null };
    const activePlans = new Set(["starter", "growth", "pro"]);
    const hasActivePlan = activePlans.has(String((merchant as { plan?: string } | null)?.plan ?? "").toLowerCase());

    toast.success("Bienvenue !");
    navigate({ to: hasActivePlan ? "/dashboard" : "/pricing" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-secondary">
      <div className="w-full max-w-md bg-background border border-border rounded-2xl p-8">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl mb-8">
          <img src="/logo.png" alt="Scano" className="h-8 w-8" />
          Scano
        </Link>
        <h1 className="text-2xl font-bold mb-2">Connexion</h1>
        <p className="text-sm text-muted-foreground mb-6">Connecte-toi à ton compte Scano.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold mb-1 block">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-input bg-background outline-none focus:border-foreground" />
          </div>
          <div>
            <label className="text-sm font-semibold mb-1 block">Mot de passe</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-input bg-background outline-none focus:border-foreground" />
          </div>
          <button type="submit" disabled={loading} className="btn-yellow w-full">
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <p className="mt-6 text-sm text-center text-muted-foreground">
          Pas encore de compte ? <Link to="/signup" className="font-semibold text-foreground underline">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}
