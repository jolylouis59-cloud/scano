import type { ClientAgeRange } from "./quiz-types";

export const CLIENT_AGE_OPTIONS = [
  { id: "18-25" as const, emoji: "👶", title: "18-25 ans", subtitle: "Jeunes adultes, ton cash et direct" },
  { id: "26-35" as const, emoji: "🧑", title: "26-35 ans", subtitle: "Millennials, ton moderne et efficace" },
  { id: "36-50" as const, emoji: "👨", title: "36-50 ans", subtitle: "Actifs, ton rassurant et sérieux" },
  { id: "50+" as const, emoji: "👴", title: "50+ ans", subtitle: "Seniors, ton simple et chaleureux" },
  { id: "mixed" as const, emoji: "🌍", title: "Mixte", subtitle: "Clientèle variée, ton neutre et accessible" },
];

export function applyAgeTone(text: string, ageRange: ClientAgeRange = "mixed"): string {
  if (ageRange === "mixed") return text;

  const informal = (t: string) =>
    t
      .replace(/Comment évaluez-vous/gi, "C'était comment")
      .replace(/Comment jugez-vous/gi, "C'était comment")
      .replace(/Qu'est-ce qui pourrait être amélioré/gi, "Qu'est-ce qui pourrait être mieux")
      .replace(/Qu'est-ce qui vous ferait/gi, "Qu'est-ce qui te ferait")
      .replace(/Recommanderiez-vous/gi, "Tu recommanderais")
      .replace(/Envisagez-vous/gi, "Tu comptes")
      .replace(/Avez-vous/gi, "T'as")
      .replace(/Vous êtes/gi, "T'es")
      .replace(/ votre /gi, " ton ")
      .replace(/ vous /gi, " tu ")
      .replace(/Votre /g, "Ton ")
      .replace(/Quelle est votre/gi, "C'est quoi ton");

  const formal = (t: string) =>
    t
      .replace(/C'était quoi le top/gi, "Qu'est-ce qui vous a particulièrement satisfait")
      .replace(/T'as/gi, "Avez-vous")
      .replace(/ tu /gi, " vous ")
      .replace(/Ton /g, "Votre ")
      .replace(/te ferait/gi, "vous inciterait");

  if (ageRange === "18-25") return informal(text);
  if (ageRange === "50+") return formal(text);
  if (ageRange === "36-50") {
    return text
      .replace(/C'était quoi le top/gi, "Qu'avez-vous particulièrement apprécié")
      .replace(/ tu /gi, " vous ");
  }
  return text;
}
