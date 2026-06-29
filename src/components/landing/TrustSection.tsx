import { Quote, Star } from "lucide-react";

/**
 * ⚠️ DESIGN ONLY — PLACEHOLDERS À REMPLACER
 * Tous les témoignages et chiffres ci-dessous sont des exemples factices
 * pour valider le design. Remplace `TESTIMONIALS_PLACEHOLDER` et
 * `STATS_PLACEHOLDER` par tes vraies données dès que tu as des retours
 * clients réels. Ne PAS déployer en prod avec ce contenu placeholder.
 *
 * Note : les notes "5 étoiles" sont volontairement présentées comme des
 * scores internes au dashboard Scano (pas comme des avis Google), pour
 * éviter toute ambiguïté avec de vrais avis publics tant que ce sont des
 * placeholders.
 */

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  rating: number;
  accent: string;
}

interface TrustStat {
  value: string;
  label: string;
}

const TESTIMONIALS_PLACEHOLDER: Testimonial[] = [
  {
    name: "Marc A.",
    role: "Restaurateur — Lille",
    quote:
      "J'ai intercepté deux clients mécontents avant qu'ils ne postent sur Google. Le genre d'alerte qui change la façon de gérer son resto au quotidien.",
    rating: 5,
    accent: "from-amber-400 to-orange-500",
  },
  {
    name: "Julie D.",
    role: "Coiffeuse — Lille",
    quote:
      "Le dashboard m'a fait réaliser que l'attente du samedi posait souci à plusieurs clientes. J'ai réorganisé mes créneaux en conséquence.",
    rating: 5,
    accent: "from-yellow-400 to-amber-500",
  },
  {
    name: "Thomas R.",
    role: "Gérant de boutique — Lille",
    quote:
      "Avant, je découvrais les clients insatisfaits par hasard, ou jamais. Maintenant j'ai un retour en temps réel, à chaque passage en caisse.",
    rating: 5,
    accent: "from-orange-400 to-rose-400",
  },
];

const STATS_PLACEHOLDER: TrustStat[] = [
  { value: "+340%", label: "de données collectées" },
  { value: "92%", label: "satisfaction moyenne" },
  { value: "5 min", label: "pour la mise en place" },
];

export default function TrustSection({
  testimonials = TESTIMONIALS_PLACEHOLDER,
  stats = STATS_PLACEHOLDER,
}: {
  testimonials?: Testimonial[];
  stats?: TrustStat[];
}) {
  return (
    <section className="relative w-full overflow-hidden bg-black px-6 py-24">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFD700]/[0.04] blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFD700]/80">
            Preuve sociale
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-5xl">
            Ils utilisent Scano
          </h2>
        </div>

        {/* Chiffres clés */}
        <div className="mb-20 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>

        {/* Cartes témoignages — layout dynamique, carte centrale légèrement avancée */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-center">
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} {...t} elevated={i === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({ value, label }: TrustStat) {
  return (
    <div className="group relative rounded-2xl border border-white/10 bg-zinc-900/50 p-8 text-center backdrop-blur-sm transition-colors duration-300 hover:border-white/20">
      <div className="bg-gradient-to-br from-[#FFD700] to-orange-400 bg-clip-text text-4xl font-extrabold text-transparent md:text-5xl">
        {value}
      </div>
      <div className="mt-2 text-sm text-zinc-400">{label}</div>
    </div>
  );
}

function TestimonialCard({
  name,
  role,
  quote,
  rating = 5,
  accent,
  elevated,
}: Testimonial & { elevated?: boolean }) {
  return (
    <div
      className={`group relative flex flex-col rounded-2xl border border-white/10 bg-zinc-900/50 p-7 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-zinc-900/70 ${
        elevated ? "md:-translate-y-3 md:shadow-2xl md:shadow-black/40" : ""
      }`}
    >
      {/* Dégradé hover subtil */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#FFD700]/0 via-transparent to-orange-500/0 opacity-0 transition-opacity duration-300 group-hover:from-[#FFD700]/[0.06] group-hover:opacity-100" />

      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <Quote className="h-5 w-5 text-[#FFD700]/70" strokeWidth={2} />
          <div className="flex gap-0.5" aria-label={`${rating} sur 5`}>
            {Array.from({ length: rating }).map((_, i) => (
              <Star
                key={i}
                className="h-3.5 w-3.5 fill-[#FFD700] text-[#FFD700]"
              />
            ))}
          </div>
        </div>

        <p className="flex-1 text-[15px] leading-relaxed text-zinc-200">
          {quote}
        </p>

        <div className="mt-6 flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${accent} text-xs font-bold text-black`}
          >
            {getInitials(name)}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{name}</div>
            <div className="text-xs text-zinc-500">{role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}
