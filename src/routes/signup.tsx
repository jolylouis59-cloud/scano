import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { signUpMerchant } from "@/lib/auth-signup";
import { getSectorDisplayForSummary, SECTOR_OPTIONS } from "@/lib/quiz-constants";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [sectorId, setSectorId] = useState("restaurant");
  const [customActivity, setCustomActivity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (sectorId === "other" && !customActivity.trim()) {
      toast.error("Décrivez votre activité");
      return;
    }
    setLoading(true);
    const businessType = getSectorDisplayForSummary(sectorId, customActivity);
    const { error } = await signUpMerchant({
      email,
      password,
      name,
      businessName,
      businessType,
    });
    setLoading(false);
    if (error) {
      const isRateLimit = /rate limit/i.test(error.message);
      toast.error(
        isRateLimit
          ? "Limite d'emails Supabase atteinte. Ajoutez VITE_SUPABASE_SERVICE_ROLE_KEY dans .env (clé service_role du dashboard) et rechargez, ou désactivez « Confirm email » dans Authentication → Providers → Email."
          : "Inscription impossible : " + error.message,
      );
      return;
    }

    // Transactional welcome email (non-blocking for UX).
    void fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "welcome_signup",
        to: email,
        name,
        businessName,
      }),
    }).catch(() => {
      /* ignore email failures on signup path */
    });

    toast.success("Compte créé !");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-12 bg-secondary">
      <div className="w-full max-w-md bg-background border border-border rounded-2xl p-8">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl mb-8">
          <img src="/logo.png" alt="Scano" className="h-8 w-8" />
          Scano
        </Link>
        <h1 className="text-2xl font-bold mb-2">Créer ton compte</h1>
        <p className="text-sm text-muted-foreground mb-6">5 minutes et tu commences à collecter des données.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold mb-1 block">Ton prénom</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-input outline-none focus:border-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-1 block">Nom du commerce</label>
            <input
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-input outline-none focus:border-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-1 block">Secteur d&apos;activité</label>
            <select
              value={sectorId}
              onChange={(e) => setSectorId(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-input outline-none focus:border-foreground bg-background"
            >
              {SECTOR_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.emoji} {s.label}
                </option>
              ))}
            </select>
          </div>
          {sectorId === "other" && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
              <label className="text-sm font-semibold block">Décrivez votre activité</label>
              <textarea
                required
                value={customActivity}
                onChange={(e) => setCustomActivity(e.target.value)}
                rows={3}
                placeholder="Ex : Compléments alimentaires en ligne, clientèle 35-55 ans..."
                className="w-full px-4 py-3 rounded-lg border border-input bg-background outline-none focus:border-foreground resize-y"
              />
            </div>
          )}
          <div>
            <label className="text-sm font-semibold mb-1 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-input outline-none focus:border-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-1 block">Mot de passe</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-input outline-none focus:border-foreground"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-yellow w-full">
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>
        <p className="mt-6 text-sm text-center text-muted-foreground">
          Déjà inscrit ?{" "}
          <Link to="/login" className="font-semibold text-foreground underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
