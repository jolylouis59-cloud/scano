import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { signUpMerchant } from "@/lib/auth-signup";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("Coiffeur");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
            <input required value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-input outline-none focus:border-foreground" />
          </div>
          <div>
            <label className="text-sm font-semibold mb-1 block">Nom du commerce</label>
            <input required value={businessName} onChange={e => setBusinessName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-input outline-none focus:border-foreground" />
          </div>
          <div>
            <label className="text-sm font-semibold mb-1 block">Type</label>
            <select value={businessType} onChange={e => setBusinessType(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-input outline-none focus:border-foreground bg-background">
              <option>Coiffeur</option>
              <option>Restaurant</option>
              <option>Boutique</option>
              <option>Autre</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold mb-1 block">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-input outline-none focus:border-foreground" />
          </div>
          <div>
            <label className="text-sm font-semibold mb-1 block">Mot de passe</label>
            <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-input outline-none focus:border-foreground" />
          </div>
          <button type="submit" disabled={loading} className="btn-yellow w-full">
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>
        <p className="mt-6 text-sm text-center text-muted-foreground">
          Déjà inscrit ? <Link to="/login" className="font-semibold text-foreground underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
