import { Quote } from "lucide-react";

/**
 * DESIGN ONLY — PLACEHOLDERS À REMPLACER
 * Tous les témoignages et chiffres ci-dessous sont des exemples factices
 * pour valider le design. Remplace TESTIMONIALS_PLACEHOLDER et STATS_PLACEHOLDER
 * par tes vraies données dès que tu as des retours clients réels.
 */

export interface Testimonial {
  name: string;
  role: string;
  quote: string;
}

export interface TrustStat {
  value: string;
  label: string;
}

const TESTIMONIALS_PLACEHOLDER: Testimonial[] = [
  {
    name: "Prénom Nom",
    role: "Restaurateur — Lille",
    quote:
      "Grâce à Scano, j'ai intercepté deux clients mécontents avant qu'ils ne postent sur Google. Indispensable.",
  },
  {
    name: "Prénom Nom",
    role: "Coiffeur / Barbier — Lille",
    quote:
      "Lorem ipsum dolor sit amet, témoignage exemple à remplacer par un vrai retour client.",
  },
  {
    name: "Prénom Nom",
    role: "Gérant(e) de boutique — Lille",
    quote:
      "Lorem ipsum dolor sit amet, témoignage exemple à remplacer par un vrai retour client.",
  },
];

const STATS_PLACEHOLDER: TrustStat[] = [
  { value: "+340%", label: "de données collectées" },
  { value: "92%", label: "satisfaction moyenne" },
  { value: "5 min", label: "pour la mise en place" },
];

export interface TrustSectionProps {
  testimonials?: Testimonial[];
  stats?: TrustStat[];
}

export default function TrustSection({
  testimonials = TESTIMONIALS_PLACEHOLDER,
  stats = STATS_PLACEHOLDER,
}: TrustSectionProps) {
  return (
    <section className="w-full bg-black px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#FFD700]">
            Preuve sociale
          </span>
          <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
            Ils utilisent Scano
          </h2>
        </div>

        <div className="mb-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center"
            >
              <div className="text-3xl font-extrabold text-[#FFD700] md:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-zinc-400">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} name={t.name} role={t.role} quote={t.quote} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ name, role, quote }: Testimonial) {
  return (
    <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 p-6 transition-colors hover:border-[#FFD700]/40">
      <Quote className="mb-4 h-6 w-6 text-[#FFD700]" strokeWidth={2} />
      <p className="flex-1 text-sm leading-relaxed text-zinc-200">
        &quot;{quote}&quot;
      </p>
      <div className="mt-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFD700] text-xs font-bold text-black">
          {getInitials(name)}
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{name}</div>
          <div className="text-xs text-zinc-500">{role}</div>
        </div>
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}
