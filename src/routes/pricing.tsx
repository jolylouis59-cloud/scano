import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

type PlanId = "starter" | "growth" | "pro";

const PLANS: { id: PlanId; name: string; price: string; amount: number; description: string; highlights: string[] }[] = [
  {
    id: "starter",
    name: "Starter",
    price: "49,99€ / mois",
    amount: 4999,
    description: "Idéal pour démarrer et collecter des premiers insights.",
    highlights: ["1 commerce", "Quiz illimités", "Dashboard de base"],
  },
  {
    id: "growth",
    name: "Growth",
    price: "99,99€ / mois",
    amount: 9999,
    description: "Pour accélérer la croissance et fidéliser plus vite.",
    highlights: ["Analyses avancées", "Priorités IA", "Support prioritaire"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "199,99€ / mois",
    amount: 19999,
    description: "Pour les équipes qui veulent piloter finement la performance.",
    highlights: ["Tout Growth", "Usage intensif", "Accompagnement premium"],
  },
];

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
});

function PricingPage() {
  const navigate = useNavigate();
  const { user, merchant, loading } = useAuth();
  const [subscribingPlan, setSubscribingPlan] = useState<PlanId | null>(null);

  const hasActivePlan = useMemo(() => {
    const active = new Set(["starter", "growth", "pro"]);
    const plan = merchant?.plan?.toLowerCase?.() ?? "";
    return active.has(plan);
  }, [merchant?.plan]);

  const onSubscribe = async (plan: PlanId) => {
    if (!user) {
      toast.info("Connecte-toi d'abord pour t'abonner.");
      navigate({ to: "/login" });
      return;
    }

    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      toast.error("VITE_STRIPE_PUBLISHABLE_KEY manquant dans .env");
      return;
    }

    try {
      setSubscribingPlan(plan);
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          merchantId: user.id,
          email: user.email,
        }),
      });
      const payload = (await res.json()) as { sessionId?: string; error?: string };
      if (!res.ok || !payload.sessionId) {
        throw new Error(payload.error || "Impossible de créer la session Stripe Checkout");
      }

      const stripe = await loadStripe(publishableKey);
      if (!stripe) throw new Error("Stripe JS indisponible");
      const { error } = await stripe.redirectToCheckout({ sessionId: payload.sessionId });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'abonnement");
      setSubscribingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Chargement...
      </div>
    );
  }

  if (user && hasActivePlan) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 bg-secondary">
        <div className="bg-background border border-border rounded-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-2">Abonnement actif</h1>
          <p className="text-muted-foreground mb-6">
            Votre plan est déjà actif. Vous pouvez continuer sur le dashboard.
          </p>
          <Link to="/dashboard" className="btn-yellow w-full inline-flex justify-center">
            Aller au dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary px-5 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">Choisissez votre abonnement Scano</h1>
          <p className="text-muted-foreground text-lg">
            Débloquez le dashboard complet et les analyses IA avancées.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const busy = subscribingPlan === plan.id;
            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-6 bg-background shadow-sm flex flex-col ${
                  plan.id === "growth" ? "border-primary ring-2 ring-primary/25" : "border-border"
                }`}
              >
                <h2 className="text-2xl font-bold">{plan.name}</h2>
                <p className="text-3xl font-black mt-2">{plan.price}</p>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                <ul className="mt-5 space-y-2 text-sm">
                  {plan.highlights.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#22C55E]" />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => void onSubscribe(plan.id)}
                  disabled={busy}
                  className={`${plan.id === "growth" ? "btn-yellow" : "btn-outline-dark"} mt-6 w-full`}
                >
                  {busy ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Redirection...
                    </span>
                  ) : (
                    "S'abonner"
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
