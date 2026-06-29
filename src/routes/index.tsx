import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, QrCode, Smartphone, BarChart3, Check, ChevronDown, MessageSquare, Star, TrendingUp } from "lucide-react";
import TrustSection from "@/components/landing/TrustSection";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

type QuizChoice = { emoji: string; text: string };

const DEFAULT_CHOICES: QuizChoice[] = [
  { emoji: "😍", text: "Excellent, j'adore !" },
  { emoji: "👍", text: "Bien, je reviendrai" },
  { emoji: "😐", text: "Peut mieux faire…" },
];

const QUESTION_SUGGESTIONS = [
  "Qu'est-ce qui vous a plu ?",
  "Reviendrez-vous ?",
  "Comment nous avez-vous trouvés ?",
  "Recommanderiez-vous ?",
] as const;

function SectionQuizBuilder() {
  const navigate = useNavigate();
  const [shopName, setShopName] = useState("");
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState(DEFAULT_CHOICES);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);

  const filledChoices = choices
    .map((c, index) => ({ ...c, index }))
    .filter((c) => c.text.trim());

  const displayShopName = shopName.trim() || "Ton commerce";
  const displayQuestion = question.trim() || "Ta question apparaîtra ici…";

  const updateChoice = (index: number, field: keyof QuizChoice, value: string) => {
    setChoices((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const addChoice = () => {
    if (choices.length >= 6) return;
    setChoices((prev) => [...prev, { emoji: "✨", text: "" }]);
  };

  const handleTestQuiz = () => {
    if (filledChoices.length === 0) {
      setTestError("Ajoute au moins une réponse pour tester ton quiz.");
      return;
    }
    setTestError(null);
    setLeadEmail("");
    setLeadSaved(false);
    setLeadError(null);
    setIsTestMode(true);
  };

  const handleSaveLead = async () => {
    const email = leadEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLeadError("Indique une adresse email valide.");
      return;
    }

    setLeadSubmitting(true);
    setLeadError(null);

    try {
      const res = await fetch("/api/save-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setLeadSaved(true);
        return;
      }

      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error || "Enregistrement impossible");
    } catch (apiErr) {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from("leads").insert({ email });
        if (!error) {
          setLeadSaved(true);
          return;
        }
        setLeadError(error.message);
      } else {
        setLeadError(apiErr instanceof Error ? apiErr.message : "Erreur lors de l'envoi");
      }
    } finally {
      setLeadSubmitting(false);
    }
  };

  const handleBackToQuiz = () => {
    setIsTestMode(false);
    setLeadEmail("");
    setLeadSaved(false);
    setLeadError(null);
  };

  const confirmedChoice =
    selectedChoice !== null && choices[selectedChoice]?.text.trim()
      ? choices[selectedChoice]
      : filledChoices[0];

  return (
    <section id="quiz-builder" className="bg-[#FAFAFA] py-24 border-y border-[#E5E5E5]">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-5xl font-bold text-[#111111] mb-4">Crée ton quiz en 30 secondes</h2>
          <p className="text-lg text-[#111111]/70 max-w-2xl mx-auto">
            Vois exactement ce que tes clients verront — avant même de t&apos;inscrire.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Builder */}
          <div className="space-y-6 rounded-2xl border border-[#E5E5E5] bg-white p-6 sm:p-8">
            <div>
              <label htmlFor="shop-name" className="block text-sm font-semibold text-[#111111] mb-2">
                Ton commerce
              </label>
              <input
                id="shop-name"
                type="text"
                maxLength={40}
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Ex: Boulangerie Martin, Café Roma…"
                className="w-full rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-4 py-3 text-[#111111] placeholder:text-[#111111]/40 focus:outline-none focus:ring-2 focus:ring-[#FFD60A]/50"
              />
            </div>

            <div>
              <label htmlFor="quiz-question" className="block text-sm font-semibold text-[#111111] mb-2">
                Qu&apos;est-ce que tu veux savoir de tes clients ?
              </label>
              <textarea
                id="quiz-question"
                rows={2}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={"Ex: Qu'est-ce qui vous a le plus plu aujourd'hui ?"}
                className="w-full resize-none rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-4 py-3 text-[#111111] placeholder:text-[#111111]/40 focus:outline-none focus:ring-2 focus:ring-[#FFD60A]/50"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {QUESTION_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setQuestion(suggestion)}
                    className="rounded-full border border-[#E5E5E5] bg-[#F5F5F5] px-3 py-1.5 text-xs font-medium text-[#111111] hover:border-[#FFD60A] hover:bg-[#FFD60A]/10 transition"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-sm font-semibold text-[#111111] mb-3">Les réponses</span>
              <div className="space-y-3">
                {choices.map((choice, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={choice.emoji}
                      onChange={(e) => updateChoice(index, "emoji", e.target.value)}
                      maxLength={4}
                      aria-label={`Emoji réponse ${index + 1}`}
                      className="w-12 shrink-0 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-2 py-3 text-center text-lg focus:outline-none focus:ring-2 focus:ring-[#FFD60A]/50"
                    />
                    <input
                      type="text"
                      value={choice.text}
                      onChange={(e) => updateChoice(index, "text", e.target.value)}
                      placeholder="Texte de la réponse"
                      className="flex-1 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-4 py-3 text-[#111111] placeholder:text-[#111111]/40 focus:outline-none focus:ring-2 focus:ring-[#FFD60A]/50"
                    />
                  </div>
                ))}
              </div>
              {choices.length < 6 && (
                <button
                  type="button"
                  onClick={addChoice}
                  className="mt-3 text-sm font-semibold text-[#111111] hover:text-[#111111]/70 transition"
                >
                  ＋ Ajouter une réponse
                </button>
              )}
            </div>

            <div>
              <button
                type="button"
                onClick={handleTestQuiz}
                className="w-full rounded-xl border-2 border-[#FFD60A] bg-[#FFD60A]/15 px-4 py-3.5 text-sm font-bold text-[#111111] hover:bg-[#FFD60A]/25 transition"
              >
                👆 Teste ton quiz comme un client
              </button>
              {testError && <p className="mt-2 text-sm text-red-600">{testError}</p>}
            </div>
          </div>

          {/* Preview + CTA */}
          <div className="lg:sticky lg:top-8 space-y-6">
            <div className="mx-auto w-full max-w-[320px] bg-[#111111] rounded-[2.5rem] p-3 shadow-xl">
              <div className="relative bg-[#F7F5F2] rounded-[2rem] overflow-hidden min-h-[520px]">
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-20 h-5 rounded-full bg-[#333333]" />
                </div>

                <div
                  className={`px-5 pb-6 transition-opacity duration-200 ${
                    isTestMode ? "opacity-0 absolute inset-0 pointer-events-none" : "opacity-100"
                  }`}
                >
                  <div className="flex justify-center mb-4">
                    <span className="rounded-full bg-[#111111] px-3 py-1 text-[10px] font-bold tracking-wider text-[#FFD60A]">
                      SCANO
                    </span>
                  </div>
                  <h3 className="text-center text-lg font-bold text-[#111111] mb-1">{displayShopName}</h3>
                  <p className="text-center text-sm text-[#111111]/70 mb-5 px-2">{displayQuestion}</p>
                  <div className="space-y-2">
                    {choices.map((choice, index) => {
                      const label = choice.text.trim() || "Réponse…";
                      const isSelected = selectedChoice === index;
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setSelectedChoice(index)}
                          className={`w-full flex items-center gap-3 rounded-xl border-2 bg-white px-4 py-3 text-left text-sm font-medium text-[#111111] transition ${
                            isSelected ? "border-[#FFD60A] shadow-sm" : "border-[#E5E5E5] hover:border-[#111111]/30"
                          }`}
                        >
                          <span className="text-xl">{choice.emoji}</span>
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-6 text-center text-[10px] text-[#111111]/40">Propulsé par Scano</p>
                </div>

                <div
                  className={`px-5 pb-6 transition-opacity duration-200 ${
                    isTestMode ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"
                  }`}
                >
                  <div className="flex flex-col items-center pt-6 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#22C55E]/15 text-2xl">
                      ✅
                    </div>
                    <h3 className="text-xl font-bold text-[#111111] mb-2">Merci pour ton avis !</h3>
                    <p className="text-sm text-[#111111]/70 mb-4">
                      Tu as répondu : {confirmedChoice?.emoji} {confirmedChoice?.text.trim()}
                    </p>

                    <div className="w-full mb-4 text-left">
                      {leadSaved ? (
                        <p className="rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 px-4 py-3 text-sm font-medium text-[#111111]">
                          Merci ! Ton email est enregistré.
                        </p>
                      ) : (
                        <>
                          <p className="mb-2 text-sm font-semibold text-[#111111]">
                            Laisse ton email pour recevoir les résultats
                          </p>
                          <input
                            type="email"
                            value={leadEmail}
                            onChange={(e) => setLeadEmail(e.target.value)}
                            placeholder="prenom@email.com"
                            disabled={leadSubmitting}
                            className="mb-2 w-full rounded-xl border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm text-[#111111] placeholder:text-[#111111]/40 focus:outline-none focus:ring-2 focus:ring-[#FFD60A]/50 disabled:opacity-60"
                          />
                          <button
                            type="button"
                            onClick={() => void handleSaveLead()}
                            disabled={leadSubmitting || !leadEmail.trim()}
                            className="w-full rounded-xl bg-[#FFD60A] px-4 py-2.5 text-sm font-bold text-[#111111] hover:opacity-90 transition disabled:opacity-50"
                          >
                            {leadSubmitting ? "Envoi…" : "Envoyer"}
                          </button>
                          {leadError && <p className="mt-2 text-xs text-red-600">{leadError}</p>}
                        </>
                      )}
                    </div>

                    <div className="w-full space-y-3 mb-6">
                      <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 text-left text-xs text-[#111111]/80">
                        <div className="font-bold text-[#111111] mb-1">📊 Dans ton dashboard Scano</div>
                        Cette réponse vient d&apos;apparaître en temps réel
                      </div>
                      <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 text-left text-xs text-[#111111]/80">
                        <div className="font-bold text-[#111111] mb-1">🔔 Notification envoyée</div>
                        Tu es alerté instantanément sur ton téléphone
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleBackToQuiz}
                      className="text-sm font-semibold text-[#111111] hover:underline"
                    >
                      ↩ Revenir au quiz
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[#111111] p-6 text-white">
              <h3 className="text-xl font-bold mb-2">Prêt à le lancer pour de vrai ?</h3>
              <p className="text-sm text-white/70 mb-5">Ton quiz sera en ligne en moins de 5 minutes.</p>
              <ul className="space-y-2 mb-6 text-sm">
                {[
                  "QR code imprimable inclus",
                  "Dashboard en temps réel",
                  "Alertes sur ton téléphone",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FFD60A]" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => navigate({ to: "/signup" })}
                className="w-full rounded-xl bg-[#FFD60A] px-4 py-3.5 text-sm font-bold text-[#111111] hover:opacity-90 transition"
              >
                Créer mon compte — Gratuit
              </button>
              <p className="mt-4 text-center text-xs text-white/50">
                Sans engagement · Résiliation en 1 clic
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const FAQ_ITEMS = [
  {
    q: "C'est quoi exactement Scano ?",
    a: "Scano est un QR code que tu poses en caisse. Ton client scanne, répond à 5 questions en 2 minutes depuis son téléphone, et repart avec un cadeau de ta part. Toi tu reçois ses vrais retours directement sur ton téléphone — ce qu'il a aimé, ce qui l'a déçu, s'il revient.",
  },
  {
    q: "C'est quoi le \"cadeau\" que reçoit mon client ?",
    a: "Tu choisis toi-même : un bon de réduction, un café offert, un échantillon, une remise sur la prochaine visite... C'est toi qui décides du montant et du type. Le client le reçoit automatiquement dès qu'il termine le quiz.",
  },
  {
    q: "Est-ce que ça m'aide à avoir plus d'avis Google ?",
    a: "Oui. Les clients satisfaits sont automatiquement redirigés vers ta fiche Google à la fin du quiz. C'est le moyen le plus simple d'augmenter ta note sans y penser.",
  },
  {
    q: "Combien de temps pour être opérationnel ?",
    a: "5 minutes chrono. Tu crées ton compte, tu télécharges ton QR code, tu l'imprimes et tu le poses en caisse. Pas de technique, pas de matériel à commander.",
  },
  {
    q: "Est-ce que mes clients doivent télécharger une application ?",
    a: "Non. Le quiz s'ouvre directement dans le navigateur de leur téléphone. Un scan suffit.",
  },
  {
    q: "Est-ce que Scano est conforme au RGPD ?",
    a: "Oui. Les données sont hébergées en Europe, jamais revendues, et tes clients sont informés lors du quiz. Tu peux supprimer toutes les données depuis ton tableau de bord à tout moment.",
  },
  {
    q: "Qui peut voir mes retours clients ?",
    a: "Uniquement toi. Les retours sont privés et accessibles depuis ton tableau de bord. Ils ne sont pas publiés publiquement.",
  },
  {
    q: "Et si un client laisse un avis négatif ?",
    a: "C'est exactement pour ça que Scano existe. Un avis négatif en privé, c'est une chance de corriger le tir avant que ce client parte chez le concurrent — ou pire, laisse un avis 1 étoile sur Google.",
  },
  {
    q: "Est-ce que ça marche pour mon type de commerce ?",
    a: "Scano est conçu pour tous les commerces de proximité : restaurants, coiffeurs, boutiques, salons d'esthétique, boulangeries, garages... Si tu as des clients qui passent en physique, Scano fonctionne.",
  },
  {
    q: "Je peux annuler quand je veux ?",
    a: "Oui, sans frais ni engagement. Tu annules en un clic depuis ton espace. Aucune surprise sur ta facture.",
  },
  {
    q: "Est-ce que je peux personnaliser les questions du quiz ?",
    a: "Oui. Tu peux adapter les questions à ton activité pour obtenir les retours les plus pertinents pour toi.",
  },
  {
    q: "Qu'est-ce que je reçois exactement comme informations ?",
    a: "Pour chaque client : pourquoi il est venu, ce qui l'a déçu ou satisfait, s'il compte revenir, comment il t'a trouvé, et son profil (âge, fréquence de visite). Tout ce qu'il ne te dirait jamais à la caisse.",
  },
] as const;

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <img src="/logo.png" alt="Scano" className="h-8 w-8" />
            Scano
          </Link>
          <nav className="flex items-center gap-3">
            <a href="/#pricing" className="text-sm font-semibold hover:underline">Tarifs</a>
            <Link to="/login" className="text-sm font-semibold hover:underline">Connexion</Link>
            <Link to="/signup" className="btn-yellow !py-2 !px-4 text-sm">Commencer</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-sm font-medium mb-8">
          Pour commerces locaux · restaurants · coiffeurs · boutiques
        </div>
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold leading-[1.05] max-w-4xl mx-auto">
          Tes clients te disent jamais ce qu'ils pensent vraiment.
        </h1>
        <p className="mt-6 text-lg sm:text-xl font-semibold max-w-2xl mx-auto" style={{ color: "var(--color-urgent)" }}>
          Résultat : tu perds des clients sans savoir pourquoi. Et tu continues à deviner.
        </p>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Scano installe un QR code en caisse. Ton client scanne, répond à 5 questions en 2 minutes, repart avec un cadeau. Toi tu reçois ses vrais retours — directement sur ton téléphone.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/signup" className="btn-yellow text-base">
            Je veux savoir ce que pensent mes clients <ArrowRight className="h-5 w-5" />
          </Link>
          <a href="#how" className="btn-outline-dark text-base">Voir comment ça marche</a>
        </div>
      </section>

      <TrustSection />

      {/* How it works */}
      <section id="how" className="bg-dark text-dark-foreground py-24">
        <div className="max-w-6xl mx-auto px-5">
          <h2 className="text-3xl sm:text-5xl text-center font-bold mb-16">En place en 5 minutes. Résultats dès le soir.</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: QrCode, title: "Tu colles le QR code en caisse", body: "On te génère un QR code prêt à imprimer. Tu le poses sur ton comptoir. C'est tout." },
              { icon: Smartphone, title: "Ton client scanne et répond", body: "En 2 minutes depuis son téléphone, il répond à des questions sur son expérience. Et repart avec un cadeau de ta part." },
              { icon: BarChart3, title: "Tu reçois ses vrais retours", body: "Ce qu'il a aimé, ce qui l'a déçu, s'il va revenir, comment il t'a trouvé. Tout ce qu'il t'aurait jamais dit à la caisse." },
            ].map((s, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mb-6">
                  <s.icon className="h-6 w-6" />
                </div>
                <div className="text-sm font-semibold text-primary mb-2">Étape {i + 1}</div>
                <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                <p className="text-white/70">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionQuizBuilder />

      {/* Google reviews */}
      <section className="bg-dark text-dark-foreground py-24 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-5">
          <h2 className="text-3xl sm:text-5xl text-center font-bold mb-4">
            Booste ta note Google automatiquement.
          </h2>
          <p className="text-center text-white/70 text-lg max-w-2xl mx-auto mb-16">
            Les clients satisfaits sont redirigés vers ta fiche Google à la fin du quiz. Plus d&apos;avis positifs, sans y penser.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: MessageSquare,
                title: "Filtre les insatisfaits",
                body: "Les clients déçus te parlent en privé. Pas sur Google.",
              },
              {
                icon: Star,
                title: "Redirige les satisfaits",
                body: "Ceux qui ont aimé sont invités à laisser un avis Google en 1 clic.",
              },
              {
                icon: TrendingUp,
                title: "Ta note monte toute seule",
                body: "Sans relance, sans effort. Le système travaille pour toi.",
              },
            ].map((s, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mb-6">
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                <p className="text-white/70">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you learn */}
      <section className="max-w-6xl mx-auto px-5 py-24">
        <h2 className="text-3xl sm:text-5xl text-center font-bold mb-4">Arrête de deviner. Commence à savoir.</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">Chaque réponse est une info que tu n'aurais jamais eu autrement.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { t: "Pourquoi ils sont venus", d: "Google, bouche-à-oreille, Instagram, ils passaient devant... Tu sais enfin ce qui marche." },
            { t: "Ce qui les a déçus", d: "L'attente, un produit, le prix, le service... Ils te le disent dans le quiz, pas sur Google." },
            { t: "S'ils vont revenir", d: "Et si non, pourquoi. Tu peux agir avant qu'ils partent chez le concurrent." },
            { t: "Qui sont vraiment tes clients", d: "Âge, habitudes, fréquence. Tu construis enfin une vraie connaissance client." },
          ].map((c, i) => (
            <div key={i} className="border border-border rounded-2xl p-6 hover:border-foreground transition">
              <div className="text-3xl font-bold text-primary mb-3">0{i + 1}</div>
              <h3 className="font-bold mb-2">{c.t}</h3>
              <p className="text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Early adopters */}
      <section className="bg-secondary py-24">
        <div className="max-w-6xl mx-auto px-5">
          <h2 className="text-3xl sm:text-5xl text-center font-bold mb-4">
            Sois parmi les premiers commerces à rejoindre Scano
          </h2>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
            Lancement en cours : profite des meilleures conditions pour démarrer, récupérer des retours clients
            exploitables et prendre de l'avance sur ta zone.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-14">
            <Link to="/signup" className="btn-yellow text-base">
              Rejoindre Scano maintenant <ArrowRight className="h-5 w-5" />
            </Link>
            <a href="/#pricing" className="btn-outline-dark text-base">
              Voir les offres
            </a>
          </div>
          <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto text-center">
            <div><div className="text-3xl sm:text-4xl font-bold text-primary">+340%</div><div className="text-sm text-muted-foreground mt-1">de données clients collectées</div></div>
            <div><div className="text-3xl sm:text-4xl font-bold text-primary">78%</div><div className="text-sm text-muted-foreground mt-1">des clients scannent le QR code</div></div>
            <div><div className="text-3xl sm:text-4xl font-bold text-primary">5 min</div><div className="text-sm text-muted-foreground mt-1">pour être opérationnel</div></div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-5 py-24">
        <h2 className="text-3xl sm:text-5xl text-center font-bold mb-4">Un investissement, pas une dépense.</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">Le premier retour client que tu vas avoir va valoir bien plus que l'abonnement.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "Starter", price: "49,99", desc: "Pour tester et voir les premiers retours", features: ["1 quiz", "QR code", "100 réponses/mois", "Dashboard basique"], featured: false },
            { name: "Growth", price: "99,99", desc: "Pour vraiment comprendre tes clients", features: ["3 quiz", "QR code", "500 réponses/mois", "Dashboard complet", "Analyse IA"], featured: true },
            { name: "Pro", price: "199,99", desc: "Avec un expert qui analyse tout avec toi", features: ["Quiz illimités", "Réponses illimitées", "Dashboard complet", "Analyse IA", "Suivi mensuel personnalisé"], featured: false },
          ].map((p) => (
            <div key={p.name} className={`relative rounded-2xl p-8 border-2 ${p.featured ? "border-primary bg-primary/5" : "border-border"}`}>
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                  LE PLUS CHOISI
                </div>
              )}
              <h3 className="text-xl font-bold mb-2">{p.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{p.desc}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">{p.price}€</span>
                <span className="text-muted-foreground">/mois</span>
              </div>
              <ul className="space-y-3 mb-8">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className={p.featured ? "btn-yellow w-full" : "btn-outline-dark w-full"}>
                Choisir {p.name}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-secondary py-24">
        <div className="max-w-3xl mx-auto px-5">
          <h2 className="text-3xl sm:text-5xl text-center font-bold mb-4">Questions fréquentes</h2>
          <p className="text-center text-muted-foreground mb-12">
            Tout ce que tu veux savoir avant de te lancer.
          </p>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-border bg-background overflow-hidden"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 font-semibold text-left [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="px-6 pb-5 text-muted-foreground leading-relaxed border-t border-border pt-4">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-dark text-dark-foreground py-24">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold mb-4">Combien de clients t'ont quitté cette semaine sans rien dire ?</h2>
          <p className="text-lg text-white/70 mb-8">Avec Scano, le prochain te dira tout.</p>
          <Link to="/signup" className="btn-yellow text-base">
            Je commence maintenant <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground space-y-2">
        <div className="flex items-center justify-center gap-4">
          <Link to="/cgu" className="hover:underline">
            CGU
          </Link>
          <span>·</span>
          <Link to="/privacy" className="hover:underline">
            Politique de confidentialité
          </Link>
        </div>
        <div>© {new Date().getFullYear()} Scano. Tous droits réservés.</div>
      </footer>
    </div>
  );
}

