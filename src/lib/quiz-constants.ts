import type { ObjectiveOption, SectorOption } from "./quiz-types";

export const SECTOR_OPTIONS: SectorOption[] = [
  { id: "restaurant", emoji: "🍽️", label: "Restaurant" },
  { id: "fastfood", emoji: "🍔", label: "Fast-food / Snack" },
  { id: "cafe", emoji: "☕", label: "Café / Bar / Brasserie" },
  { id: "boulangerie", emoji: "🥖", label: "Boulangerie / Pâtisserie" },
  { id: "epicerie", emoji: "🛒", label: "Épicerie / Superette" },
  { id: "coiffure", emoji: "💇", label: "Salon de coiffure" },
  { id: "barbershop", emoji: "💈", label: "Barbershop" },
  { id: "beaute", emoji: "💅", label: "Institut de beauté / Esthétique" },
  { id: "nail", emoji: "💅", label: "Nail art / Onglerie" },
  { id: "mode", emoji: "👗", label: "Boutique mode / Prêt-à-porter" },
  { id: "maroquinerie", emoji: "👜", label: "Maroquinerie / Accessoires" },
  { id: "bijouterie", emoji: "💍", label: "Bijouterie / Joaillerie" },
  { id: "librairie", emoji: "📚", label: "Librairie / Papeterie" },
  { id: "pharmacie", emoji: "💊", label: "Pharmacie / Parapharmacie" },
  { id: "fitness", emoji: "🏋️", label: "Salle de sport / Fitness" },
  { id: "yoga", emoji: "🧘", label: "Studio yoga / Bien-être" },
  { id: "garage", emoji: "🚗", label: "Garage automobile" },
  { id: "station", emoji: "⛽", label: "Station-service" },
  { id: "lavage", emoji: "🚿", label: "Station de lavage / Nettoyage auto" },
  { id: "artisan", emoji: "🏗️", label: "Artisan (plombier, électricien, menuisier...)" },
  { id: "photo", emoji: "🎨", label: "Studio photo / Graphisme" },
  { id: "animalerie", emoji: "🐾", label: "Animalerie / Toilettage" },
  { id: "nettoyage", emoji: "🧹", label: "Service de nettoyage / Ménage" },
  { id: "immobilier", emoji: "🏠", label: "Agence immobilière" },
  { id: "creche", emoji: "👶", label: "Crèche / Garde d'enfants" },
  { id: "formation", emoji: "🎓", label: "École / Formation / Coaching" },
  { id: "medical", emoji: "🏥", label: "Cabinet médical / Paramédical" },
  { id: "dentaire", emoji: "🦷", label: "Cabinet dentaire" },
  { id: "naturo", emoji: "🌿", label: "Naturopathe / Ostéopathe" },
  { id: "informatique", emoji: "💻", label: "Informatique / Réparation téléphone" },
  { id: "jeux", emoji: "🎮", label: "Salle de jeux / Loisirs" },
  { id: "evenementiel", emoji: "🎪", label: "Événementiel / Animation" },
  { id: "other", emoji: "✂️", label: "Autre — je décris mon activité", isOther: true },
];

export const OBJECTIVE_OPTIONS: ObjectiveOption[] = [
  {
    id: "revenue",
    emoji: "📈",
    title: "Augmenter mon chiffre d'affaires",
    description: "Comprendre ce qui pousse vos clients à dépenser plus",
  },
  {
    id: "loyalty",
    emoji: "🔄",
    title: "Fidéliser mes clients",
    description: "Savoir pourquoi ils reviennent (ou pas) chez vous",
  },
  {
    id: "profile",
    emoji: "🎯",
    title: "Mieux connaître mon client type",
    description: "Découvrir qui sont vraiment vos clients : âge, habitudes, attentes",
  },
  {
    id: "reviews",
    emoji: "⭐",
    title: "Obtenir plus d'avis positifs",
    description: "Identifier vos clients satisfaits pour les encourager à laisser un avis Google",
  },
  {
    id: "friction",
    emoji: "🚨",
    title: "Identifier ce qui ne va pas",
    description: "Comprendre les points de friction avant qu'ils partent chez un concurrent",
  },
  {
    id: "acquisition",
    emoji: "📣",
    title: "Savoir comment ils m'ont trouvé",
    description: "Mesurer l'impact de votre bouche-à-oreille, réseaux sociaux, Google...",
  },
];

/** Suggestions cliquables communes (tous secteurs) */
export const GIFT_QUICK_PICKS: string[] = [
  "5% de réduction sur votre prochaine visite",
  "10% de réduction sur votre prochaine visite",
  "15% de réduction sur votre prochaine visite",
  "20% de réduction sur votre prochaine visite",
  "Un produit offert au choix",
  "Un café offert",
  "Un dessert offert",
  "Un échantillon offert",
  "Un service express offert",
  "La prochaine prestation -50%",
  "Un diagnostic gratuit",
  "Double points fidélité",
  "Accès prioritaire aux promotions",
];

export function getRatingFeedbackCopy(score: number): { label: string; placeholder: string } {
  if (score <= 6) {
    return {
      label: "Qu'est-ce qui vous a déçu ? (optionnel)",
      placeholder: "Dites-nous ce qu'on peut améliorer...",
    };
  }
  if (score <= 8) {
    return {
      label: "Qu'est-ce qu'on pourrait améliorer ? (optionnel)",
      placeholder: "Un petit détail à améliorer...",
    };
  }
  return {
    label: "Qu'est-ce qui vous a particulièrement plu ? (optionnel)",
    placeholder: "Dites-nous ce qui vous a conquis !",
  };
}

export const GIFT_SUGGESTIONS: Record<string, string[]> = {
  restaurant: ["☕ Un café offert", "🍰 Un dessert pour votre prochaine visite", "🎁 10% sur votre prochain repas", "🍹 Un apéritif offert"],
  fastfood: ["🍟 Frites offertes", "🥤 Boisson offerte", "🎁 Menu à -20%", "🍔 Burger offert"],
  cafe: ["☕ Un café offert", "🥐 Une viennoiserie offerte", "🎁 -10% sur votre prochaine note", "🍹 Un mocktail offert"],
  boulangerie: ["🥐 Un croissant offert", "☕ Un café + viennoiserie offerts", "🎂 -10% sur votre prochaine commande", "🥖 Pain offert du jour"],
  epicerie: ["🎁 5€ offerts dès 30€", "🛒 Un produit local offert", "☕ Café offert en caisse", "🎁 -10% sur le panier"],
  coiffure: ["💆 Un soin express offert", "✂️ -10% sur votre prochaine coupe", "🎁 Un produit capillaire offert", "💇 Brushing offert pour votre prochain RDV"],
  barbershop: ["💈 Rasage traditionnel offert", "✂️ -10% sur la prochaine coupe", "🎁 Produit barbe offert", "💇 Taille de barbe offerte"],
  beaute: ["💅 Soin découverte offert", "🎁 -15% sur la prochaine prestation", "✨ Échantillon produit offert", "💆 Massage express offert"],
  nail: ["💅 Vernis offert", "🎁 -10% sur la prochaine pose", "✨ Nail art offert", "💅 Soin cuticules offert"],
  mode: ["🛍️ -10% sur votre prochain achat", "🎁 Un accessoire offert dès 50€ d'achat", "📦 La livraison offerte sur commande en ligne", "👗 -15% sur les soldes"],
  maroquinerie: ["👜 -10% sur le prochain sac", "🎁 Porte-clés offert", "📦 Emballage cadeau offert", "🛍️ -15% sur accessoires"],
  bijouterie: ["💍 Nettoyage bijou offert", "🎁 -10% sur la prochaine pièce", "✨ Gravure offerte", "💎 Soin offert"],
  librairie: ["📚 Marque-page collector offert", "🎁 -10% sur le prochain livre", "☕ Café offert en librairie", "📖 Bon d'achat 5€"],
  pharmacie: ["💊 Produit découverte offert", "🎁 -10% sur parapharmacie", "🧴 Échantillon offert", "💆 Conseil beauté offert"],
  fitness: ["🏋️ Séance découverte offerte", "🎁 -20% sur le premier mois", "💪 Coaching offert", "🧘 Cours collectif offert"],
  yoga: ["🧘 Cours découverte offert", "🎁 -15% sur le carnet", "🕯️ Tapis offert", "✨ Séance privée à prix réduit"],
  garage: ["🔧 Diagnostic gratuit", "🎁 -10% sur la prochaine révision", "🚗 Contrôle niveaux offert", "⚙️ Main d'œuvre offerte 1h"],
  station: ["⛽ Lavage pare-brise offert", "🎁 Café offert", "🚗 Contrôle pression offert", "🎁 -5€ sur le plein"],
  lavage: ["🚗 Un lavage express offert", "🎁 -5€ sur votre prochain passage", "✨ Une désinfection intérieure offerte", "🧽 Aspiration offerte"],
  artisan: ["🔧 Un diagnostic gratuit", "💰 -10% sur votre prochaine intervention", "📞 Un devis prioritaire offert", "🛠️ Déplacement offert"],
  photo: ["📸 Mini-shoot offert", "🎁 -15% sur le prochain shooting", "🖼️ Tirage offert", "✨ Retouche offerte"],
  animalerie: ["🐾 Friandises offertes", "🎁 -10% sur accessoires", "✂️ Toilettage express offert", "🦴 Jouet offert"],
  nettoyage: ["🧹 Première heure offerte", "🎁 -15% sur le forfait", "✨ Produit écologique offert", "🏠 Diagnostic offert"],
  immobilier: ["🏠 Estimation gratuite", "📸 Photos pro offertes", "🎁 Frais dossier réduits", "📋 Visite guidée VIP"],
  creche: ["👶 Journée découverte offerte", "🎁 -10% sur le premier mois", "📚 Kit bienvenue offert", "🧸 Atelier offert"],
  formation: ["🎓 Module découverte offert", "🎁 -20% sur la formation", "📚 Support offert", "💻 Session coaching offerte"],
  medical: ["🏥 Consultation découverte", "🎁 -10% sur la prochaine visite", "📋 Bilan offert", "💊 Échantillon offert"],
  dentaire: ["🦷 Détartrage offert", "🎁 -10% sur le devis", "✨ Blanchiment à prix réduit", "🪥 Kit dentaire offert"],
  naturo: ["🌿 Première consultation offerte", "🎁 -15% sur le bilan", "🍵 Infusion offerte", "📋 Plan personnalisé offert"],
  informatique: ["💻 Diagnostic gratuit", "🎁 -10% sur la réparation", "📱 Protection écran offerte", "🔋 Chargeur offert"],
  jeux: ["🎮 30 min de jeu offertes", "🎁 -20% sur l'entrée", "🍿 Pop-corn offert", "🏆 Partie VIP offerte"],
  evenementiel: ["🎪 Devis gratuit", "🎁 -10% sur le package", "📸 Photos offertes", "🎈 Décoration offerte"],
  other: ["🎁 Une surprise vous attend", "✨ -10% sur votre prochaine visite", "🎁 Cadeau de bienvenue", "💝 Offre exclusive"],
};

export const GIFT_PLACEHOLDERS: Record<string, string> = Object.fromEntries(
  SECTOR_OPTIONS.map((s) => [s.id, (GIFT_SUGGESTIONS[s.id]?.[0] || "Une surprise vous attend en caisse").replace(/^[^\s]+\s/, "")]),
);

export const MOTIVATIONAL_MESSAGES = [
  "🎁 Une surprise vous attend à la fin",
  "⭐ Plus que quelques questions...",
  "🚀 Vous y êtes presque !",
  "🎯 Dernière ligne droite",
  "🎉 Votre récompense est prête !",
  "💡 Chaque réponse nous aide à mieux vous servir",
  "✨ Presque terminé !",
  "🏁 Encore un effort",
  "📊 Merci pour votre sincérité",
  "🙌 Dernière question !",
];

export function getSectorById(id: string): SectorOption | undefined {
  return SECTOR_OPTIONS.find((s) => s.id === id);
}

export function getSectorLabel(id: string, custom?: string): string {
  if (id === "other" && custom?.trim()) return custom.trim();
  return getSectorById(id)?.label ?? id;
}

/** Résumé onboarding : secteur catalogue ou description « Autre » — jamais le nom d'enseigne */
export function getSectorDisplayForSummary(sectorId: string, customActivity?: string): string {
  if (sectorId === "other") {
    const t = customActivity?.trim();
    return t ? (t.length > 80 ? `${t.slice(0, 77)}…` : t) : "Activité personnalisée";
  }
  return getSectorById(sectorId)?.label ?? sectorId;
}

/** Texte complet pour l'IA (secteur Autre = description exacte du commerçant) */
export function getContextTextForAI(
  sectorId: string,
  customActivity?: string,
  businessDescription?: string,
): string {
  if (sectorId === "other") {
    return [customActivity?.trim(), businessDescription?.trim()].filter(Boolean).join(" ").trim();
  }
  return [businessDescription?.trim(), customActivity?.trim()].filter(Boolean).join(" ").trim();
}
