import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, QrCode, Smartphone, BarChart3, Check, ChevronDown } from "lucide-react";

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

