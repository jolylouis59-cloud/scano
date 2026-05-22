import { applyAgeTone } from "./quiz-age-tone";
import type { EmojiPolicy } from "./emoji-policy";
import {
  emojisEnabledForSector,
  formatBusinessLabel,
  getEmojiPolicy,
  neutralEmojiFor,
} from "./emoji-policy";
import type { QuizThemeId } from "./quiz-themes";
import type {
  BusinessContext,
  ChoiceCard,
  ClientAgeRange,
  GenerateQuizParams,
  Question,
} from "./quiz-types";
import { OTHER_OPTION_VALUE } from "./quiz-types";

function id() {
  return crypto.randomUUID();
}

function card(title: string, value: string, emoji = "", subtitle?: string): ChoiceCard {
  return { emoji, title, subtitle, value };
}

function q(
  type: Question["type"],
  label: string,
  businessLabel: string,
  extra?: Partial<Question>,
): Question {
  return { id: id(), type, label, businessLabel, ...extra };
}

function choiceQ(label: string, businessLabel: string, items: ChoiceCard[], extra?: Partial<Question>): Question {
  return q("choice", label, businessLabel, {
    options: items.map((c) => c.value),
    choiceCards: items,
    ...extra,
  });
}

function multiQ(label: string, businessLabel: string, items: ChoiceCard[], extra?: Partial<Question>): Question {
  return q("multichoice", label, businessLabel, {
    options: items.map((c) => c.value),
    choiceCards: items,
    allowOtherOption: true,
    ...extra,
  });
}

function yesNoQ(label: string, businessLabel: string, items: ChoiceCard[]): Question {
  return q("yesno", label, businessLabel, {
    options: ["Oui", "Non"],
    choiceCards: items,
    yesNoWhyOptional: true,
  });
}

const OTHER_CARD = card("Autre", OTHER_OPTION_VALUE, "✏️", "Précisez dans le champ ci-dessous");

function withOtherOption(items: ChoiceCard[]): ChoiceCard[] {
  if (items.some((c) => c.value === OTHER_OPTION_VALUE)) return items;
  return [...items, OTHER_CARD];
}

function applyPolicyToCards(items: ChoiceCard[], policy: EmojiPolicy, sectorId: string): ChoiceCard[] {
  if (policy === "full") return items;
  if (policy === "none") return items.map((c) => ({ ...c, emoji: "" }));
  return items.map((c, i) => ({ ...c, emoji: neutralEmojiFor(sectorId, i) }));
}

function applyPolicyToQuestion(question: Question, policy: EmojiPolicy, sectorId: string): Question {
  const businessLabel = question.businessLabel
    ? formatBusinessLabel(question.businessLabel, policy)
    : question.businessLabel;
  if (!question.choiceCards) {
    return { ...question, businessLabel };
  }
  return {
    ...question,
    businessLabel,
    choiceCards: applyPolicyToCards(question.choiceCards, policy, sectorId),
  };
}

function applyPolicyToQuestions(questions: Question[], policy: EmojiPolicy, sectorId: string): Question[] {
  return questions.map((qu) => applyPolicyToQuestion(qu, policy, sectorId));
}

function tone(text: string, age: ClientAgeRange): string {
  return applyAgeTone(text, age);
}

function brandRef(params: GenerateQuizParams): string {
  return params.storeName?.trim() || "notre marque";
}

export function parseBusinessContext(params: GenerateQuizParams): BusinessContext {
  const blob = [
    params.activityDescription,
    params.businessDescription,
    params.customActivity,
    params.website,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const has = (re: RegExp) => re.test(blob);

  const ecommerce = has(
    /e-?commerce|ecommerce|en ligne|boutique en ligne|vente en ligne|shopify|woocommerce|meta ads|facebook ads|instagram ads|tiktok ads|pub facebook|publicité facebook|dropshipping|marketplace/,
  );
  const metaAds = has(/meta ads|facebook ads|instagram ads|pub facebook|publicité facebook|tiktok ads/);
  const physicalStore =
    !ecommerce &&
    has(/magasin|boutique physique|en caisse|comptoir|salon|restaurant|accueil|passage devant/);
  const healthSupplements = has(/complément|supplement|nutri|vitamine|protéine|santé|pharma/);
  const beautyService = has(/coiffeur|coiffure|salon|beauté|esthétique|manucure|nail|barber|onglerie/);
  const foodService =
    has(/restaurant|grillade|boulangerie|café|brasserie|repas|cuisine|fast-?food/) && !ecommerce;

  const keywords: string[] = [];
  if (ecommerce) keywords.push("e-commerce");
  if (metaAds) keywords.push("meta-ads");
  if (healthSupplements) keywords.push("santé");
  if (beautyService) keywords.push("beauté");

  return {
    blob,
    ecommerce,
    metaAds,
    physicalStore: physicalStore || (!ecommerce && params.sectorId !== "other"),
    healthSupplements,
    beautyService,
    foodService,
    vehicleElectric: has(/tesla|électrique|electrique|hybride/) && params.sectorId === "garage",
    sauceMaison: has(/sauce maison/),
    grillades: has(/grillade/),
    nailArtJapanese: has(/nail art|japonais/) && (params.sectorId === "nail" || beautyService),
    premiumTone: has(/haut de gamme|premium|luxe/) && beautyService,
    streetwearBarber: has(/streetwear|urbain|barber/) && params.sectorId === "barbershop",
    familyRestaurant: has(/familial|familles|midi/) && foodService,
    keywords,
  };
}

type SectorGroup = "food" | "beauty" | "retail" | "auto" | "health" | "services" | "digital" | "generic";

function sectorGroup(sectorId: string, ctx: BusinessContext): SectorGroup {
  if (ctx.ecommerce || ctx.metaAds) return "digital";
  if (["restaurant", "fastfood", "cafe", "boulangerie", "epicerie"].includes(sectorId) || ctx.foodService)
    return "food";
  if (["coiffure", "barbershop", "beaute", "nail"].includes(sectorId) || ctx.beautyService) return "beauty";
  if (["mode", "maroquinerie", "bijouterie", "librairie", "pharmacie"].includes(sectorId)) return "retail";
  if (["garage", "station", "lavage"].includes(sectorId)) return "auto";
  if (["medical", "dentaire", "naturo", "pharmacie"].includes(sectorId) || ctx.healthSupplements)
    return "health";
  if (["fitness", "yoga", "formation", "creche", "immobilier", "nettoyage", "evenementiel", "jeux"].includes(sectorId))
    return "services";
  return "generic";
}

function discoveryQuestion(
  params: GenerateQuizParams,
  ctx: BusinessContext,
  policy: EmojiPolicy,
): Question {
  const brand = brandRef(params);
  const age = params.clientAgeRange ?? "mixed";
  const label = tone(
    params.objective === "acquisition"
      ? `Comment avez-vous découvert ${brand} ?`
      : `Comment nous avez-vous connu ?`,
    age,
  );

  let items: ChoiceCard[];
  if (ctx.ecommerce || ctx.metaAds) {
    items = [
      card("Publicité Facebook/Instagram", "Meta Ads", "📱"),
      card("Recommandation d'un ami", "Bouche-à-oreille", "💬"),
      card("Google", "Google", "🔍"),
      card("TikTok", "TikTok", "🎵"),
      card("Influenceur / créateur", "Influenceur", "⭐"),
    ];
  } else {
    items = [
      card("Bouche-à-oreille", "Bouche-à-oreille", "💬", "Un proche m'a recommandé"),
      card("Réseaux sociaux", "Réseaux sociaux", "📱"),
      card("Google / Maps", "Google Maps", "📍"),
      card("Passage", "Je passais devant", "🚶"),
      card("Publicité", "Publicité", "📢"),
    ];
  }

  return multiQ(
    label,
    "📣 Mesure votre acquisition",
    applyPolicyToCards(withOtherOption(items), policy, params.sectorId),
  );
}

function frequencyQuestion(
  group: SectorGroup,
  params: GenerateQuizParams,
  policy: EmojiPolicy,
): Question {
  const age = params.clientAgeRange ?? "mixed";
  const labels: Record<SectorGroup, string> = {
    digital: "À quelle fréquence commandez-vous chez nous ?",
    food: "À quelle fréquence venez-vous manger chez nous ?",
    beauty: "À quelle fréquence nous rendez-vous visite ?",
    retail: "À quelle fréquence faites-vous vos achats chez nous ?",
    auto: "À quelle fréquence utilisez-vous nos services ?",
    health: "À quelle fréquence utilisez-vous nos produits ou services ?",
    services: "À quelle fréquence êtes-vous client(e) chez nous ?",
    generic: "À quelle fréquence êtes-vous client(e) chez nous ?",
  };
  const items = applyPolicyToCards(
    [
      card("Première fois", "Première visite", "🆕"),
      card("1 fois par mois", "1 fois/mois", "📅"),
      card("Plusieurs fois par mois", "Plusieurs fois/mois", "🔄"),
      card("Client régulier", "Client régulier", "⭐", "Je reviens souvent"),
      card("Rarement", "Rarement", "💤"),
    ],
    policy,
    params.sectorId,
  );
  return choiceQ(tone(labels[group], age), "📊 Segmente vos clients", items);
}

function satisfactionQuestion(params: GenerateQuizParams, ctx: BusinessContext): Question {
  const brand = brandRef(params);
  const age = params.clientAgeRange ?? "mixed";
  let label: string;
  if (ctx.ecommerce) {
    label = `Comment évaluez-vous votre commande chez ${brand} ?`;
  } else if (params.objective === "friction") {
    label = "Globalement, comment jugez-vous votre expérience aujourd'hui ?";
  } else if (ctx.premiumTone) {
    label = "Comment évaluez-vous la qualité de votre prestation ?";
  } else {
    label = `Comment évaluez-vous votre expérience chez ${brand} ?`;
  }
  return q("rating", tone(label, age), "📊 Mesure la fidélité", { ratingMax: 10 });
}

function improvementQuestion(
  group: SectorGroup,
  params: GenerateQuizParams,
  ctx: BusinessContext,
  policy: EmojiPolicy,
): Question {
  const age = params.clientAgeRange ?? "mixed";
  let items: ChoiceCard[];

  if (ctx.ecommerce) {
    items = [
      card("Délai de livraison", "Livraison", "📦"),
      card("Packaging / présentation", "Packaging", "🎁"),
      card("Facilité de commande", "Commande", "📱"),
      card("Confiance dans la marque", "Confiance", "🤝"),
      card("Les prix", "Prix", "💶"),
      card("Service client", "Service", "💬"),
      card("Rien à signaler", "Rien", "✅"),
    ];
  } else if (group === "food") {
    items = [
      card("Temps d'attente", "Attente", "⏱️"),
      card("Les prix", "Prix", "💶"),
      card("L'accueil", "Accueil", "🤝"),
      card("La carte / choix", "Carte", "🍽️"),
      card("La qualité", "Qualité", "⭐"),
      card("Rien à signaler", "Rien", "✅"),
    ];
  } else if (ctx.healthSupplements) {
    items = [
      card("Résultats ressentis", "Résultats", "✨"),
      card("Clarté des conseils", "Conseils", "💬"),
      card("Les prix", "Prix", "💶"),
      card("Goût / format produit", "Produit", "🧪"),
      card("Rien à signaler", "Rien", "✅"),
    ];
  } else {
    items = [
      card("Temps d'attente", "Attente", "⏱️"),
      card("Les prix", "Prix", "💶"),
      card("L'accueil", "Accueil", "🤝"),
      card("La qualité", "Qualité", "⭐"),
      card("Rien à signaler", "Rien", "✅"),
    ];
  }

  return multiQ(
    tone("Qu'est-ce qui pourrait être amélioré ?", age),
    "⚠️ Détecte les points de friction",
    applyPolicyToCards(withOtherOption(items), policy, params.sectorId),
  );
}

function spendingQuestion(
  group: SectorGroup,
  params: GenerateQuizParams,
  ctx: BusinessContext,
  policy: EmojiPolicy,
): Question {
  const age = params.clientAgeRange ?? "mixed";
  const digitalOpts = [
    card("Moins de 30€", "<30€", "💶"),
    card("30€ – 80€", "30-80€", "💰"),
    card("80€ – 150€", "80-150€", "💎"),
    card("Plus de 150€", ">150€", "🌟"),
  ];
  const opts: Record<SectorGroup, ChoiceCard[]> = {
    digital: digitalOpts,
    food: [
      card("Moins de 15€", "<15€", "💶"),
      card("15€ – 30€", "15-30€", "💰"),
      card("30€ – 50€", "30-50€", "💎"),
      card("Plus de 50€", ">50€", "🌟"),
    ],
    beauty: [
      card("Moins de 30€", "<30€", "💶"),
      card("30€ – 60€", "30-60€", "💰"),
      card("60€ – 100€", "60-100€", "💎"),
      card("Plus de 100€", ">100€", "🌟"),
    ],
    retail: digitalOpts,
    auto: [
      card("Entretien courant", "Entretien", "🔧"),
      card("Réparation", "Réparation", "🛠️"),
      card("Prestation premium", "Premium", "✨"),
      card("Devis / gros travaux", "Gros travaux", "📋"),
    ],
    health: [
      card("Découverte", "Découverte", "💶"),
      card("Panier moyen", "Moyen", "💰"),
      card("Programme / cure", "Programme", "💎"),
    ],
    services: [
      card("Offre découverte", "Découverte", "💶"),
      card("Formule standard", "Standard", "💰"),
      card("Formule premium", "Premium", "💎"),
    ],
    generic: [
      card("Petit budget", "Petit", "💶"),
      card("Budget moyen", "Moyen", "💰"),
      card("Gros budget", "Élevé", "💎"),
    ],
  };

  const label = ctx.ecommerce
    ? "Quel montant dépensez-vous en moyenne par commande ?"
    : "Quel budget dépensez-vous en moyenne lors d'une visite ?";

  return choiceQ(
    tone(label, age),
    "💰 Identifie le potentiel panier moyen",
    applyPolicyToCards(opts[group], policy, params.sectorId),
  );
}

function recommendQuestion(params: GenerateQuizParams, ctx: BusinessContext, policy: EmojiPolicy): Question {
  const brand = brandRef(params);
  const age = params.clientAgeRange ?? "mixed";
  const label = tone(
    params.objective === "reviews" || ctx.ecommerce
      ? `Recommanderiez-vous ${brand} à un proche ?`
      : `Recommanderiez-vous ${brand} à un proche ?`,
    age,
  );
  const items = applyPolicyToCards(
    [
      card("Oui", "Oui", "⭐", "Sans hésiter"),
      card("Non", "Non", "😐", "Pas vraiment"),
    ],
    policy,
    params.sectorId,
  );
  return yesNoQ(label, "⭐ Encourage les avis positifs", items);
}

function futureIntentionsQuestion(
  params: GenerateQuizParams,
  ctx: BusinessContext,
  policy: EmojiPolicy,
): Question {
  const brand = brandRef(params);
  const age = params.clientAgeRange ?? "mixed";
  const label = tone(
    ctx.ecommerce
      ? `Qu'est-ce qui vous ferait commander à nouveau chez ${brand} ?`
      : `Qu'est-ce qui vous ferait revenir plus souvent ?`,
    age,
  );

  const items = ctx.ecommerce
    ? [
        card("Meilleur rapport qualité-prix", "Prix", "💶"),
        card("Livraison plus rapide", "Livraison", "📦"),
        card("Nouveautés / collections", "Nouveautés", "🆕"),
        card("Offres fidélité", "Fidélité", "🎁"),
        card("Plus de preuves / avis clients", "Confiance", "⭐"),
      ]
    : [
        card("Meilleur accueil", "Accueil", "🤝"),
        card("Prix plus attractifs", "Prix", "💶"),
        card("Nouveautés", "Nouveautés", "🆕"),
        card("Programme fidélité", "Fidélité", "🎁"),
        card("Rien, je reviens déjà", "Satisfait", "✅"),
      ];

  return multiQ(
    label,
    "📊 Mesure la fidélité",
    applyPolicyToCards(withOtherOption(items), policy, params.sectorId),
  );
}

function productPreferencesQuestion(
  group: SectorGroup,
  params: GenerateQuizParams,
  ctx: BusinessContext,
  policy: EmojiPolicy,
): Question {
  const age = params.clientAgeRange ?? "mixed";
  let label: string;
  let items: ChoiceCard[];

  if (ctx.healthSupplements) {
    label = "Quel objectif santé vous a motivé à essayer nos produits ?";
    items = [
      card("Énergie / vitalité", "Énergie", "⚡"),
      card("Sommeil / stress", "Sommeil", "😴"),
      card("Sport / performance", "Sport", "🏋️"),
      card("Bien-être général", "Bien-être", "🌿"),
    ];
  } else if (ctx.ecommerce) {
    label = "Qu'est-ce qui vous a donné confiance pour commander ?";
    items = [
      card("Les avis clients", "Avis", "⭐"),
      card("La qualité perçue", "Qualité", "✨"),
      card("Le prix", "Prix", "💶"),
      card("La recommandation", "Reco", "💬"),
      card("La pub vue sur les réseaux", "Pub", "📱"),
    ];
  } else if (group === "beauty" || ctx.beautyService) {
    label = "Qu'est-ce qui compte le plus pour vous dans une prestation ?";
    items = [
      card("Le résultat", "Résultat", "✨"),
      card("L'écoute du pro", "Écoute", "👂"),
      card("Le prix", "Prix", "💶"),
      card("L'ambiance", "Ambiance", "🌸"),
    ];
  } else if (group === "food" || ctx.foodService) {
    label = "Qu'avez-vous le plus apprécié lors de votre visite ?";
    items = [
      card("La qualité des plats", "Qualité", "🍽️"),
      card("L'accueil", "Accueil", "🤝"),
      card("Le rapport qualité-prix", "Prix", "💶"),
      card("L'ambiance", "Ambiance", "✨"),
    ];
  } else if (group === "retail") {
    label = "Quel type de produit vous intéresse le plus ?";
    items = [
      card("Nouveautés", "Nouveautés", "🆕"),
      card("Promotions", "Promos", "🏷️"),
      card("Produits premium", "Premium", "💎"),
      card("Essentiels du quotidien", "Essentiels", "🛒"),
    ];
  } else {
    label = "Qu'attendez-vous principalement de nous ?";
    items = [
      card("Qualité", "Qualité", "⭐"),
      card("Bon rapport qualité-prix", "Prix", "💶"),
      card("Rapidité", "Rapidité", "⚡"),
      card("Conseil personnalisé", "Conseil", "🤝"),
    ];
  }

  return multiQ(
    tone(label, age),
    "🎯 Segmente vos clients",
    applyPolicyToCards(withOtherOption(items), policy, params.sectorId),
  );
}

function contextualQuestion(
  ctx: BusinessContext,
  params: GenerateQuizParams,
  policy: EmojiPolicy,
): Question | null {
  const { sectorId } = params;
  const age = params.clientAgeRange ?? "mixed";

  if (ctx.vehicleElectric && sectorId === "garage") {
    return choiceQ(
      tone("Votre véhicule est-il électrique, hybride ou thermique ?", age),
      "🎯 Segmente vos clients",
      applyPolicyToCards(
        [
          card("Électrique", "Électrique", "⚡"),
          card("Hybride", "Hybride", "🔋"),
          card("Thermique", "Thermique", "⛽"),
          card("Je ne sais pas", "Inconnu", "❓"),
        ],
        policy,
        sectorId,
      ),
    );
  }

  if ((ctx.sauceMaison || ctx.grillades) && (ctx.foodService || ["restaurant", "fastfood", "cafe"].includes(sectorId))) {
    const label = ctx.sauceMaison
      ? tone("Avez-vous eu l'occasion de goûter notre sauce maison ?", age)
      : tone("Avez-vous testé nos grillades maison ?", age);
    return choiceQ(label, "💬 Insight qualitatif", applyPolicyToCards(
      [
        card("Oui, et j'ai adoré", "Adoré", "😍"),
        card("Oui, correct", "Correct", "👍"),
        card("Pas encore", "Pas encore", "🆕"),
        card("Ce n'est pas pour moi", "Non", "😐"),
      ],
      policy,
      sectorId,
    ));
  }

  if (ctx.nailArtJapanese) {
    return choiceQ(
      tone("Quel style de nail art préférez-vous ?", age),
      "🎯 Segmente vos clients",
      applyPolicyToCards(
        [
          card("Minimaliste", "Minimaliste", "✨"),
          card("Japonais", "Japonais", "🌸"),
          card("Floral", "Floral", "🌺"),
          card("Géométrique", "Géométrique", "◇"),
          card("French", "French", "💅"),
        ],
        policy,
        sectorId,
      ),
    );
  }

  if (ctx.healthSupplements && ctx.blob.includes("résultat")) {
    return choiceQ(
      tone("Avez-vous déjà ressenti des effets positifs avec nos produits ?", age),
      "💬 Insight qualitatif",
      applyPolicyToCards(
        [
          card("Oui, clairement", "Oui", "✅"),
          card("Un peu", "Un peu", "🙂"),
          card("Pas encore", "Pas encore", "⏳"),
          card("Trop tôt pour dire", "Tôt", "🤔"),
        ],
        policy,
        sectorId,
      ),
    );
  }

  if (ctx.familyRestaurant && !ctx.ecommerce) {
    return choiceQ(
      tone("Vous venez plutôt en famille, entre collègues ou en solo ?", age),
      "🎯 Segmente vos clients",
      applyPolicyToCards(
        [
          card("En famille", "Famille", "👨‍👩‍👧"),
          card("Déjeuner pro / collègues", "Professionnel", "💼"),
          card("En couple", "Couple", "💑"),
          card("Seul(e)", "Solo", "🧑"),
        ],
        policy,
        sectorId,
      ),
    );
  }

  return null;
}

function returnIntentQuestion(params: GenerateQuizParams, ctx: BusinessContext, policy: EmojiPolicy): Question {
  const age = params.clientAgeRange ?? "mixed";
  const label = tone(
    ctx.ecommerce
      ? "Envisagez-vous de commander à nouveau prochainement ?"
      : "Envisagez-vous de revenir prochainement ?",
    age,
  );
  const items = applyPolicyToCards(
    [
      card("Oui, très bientôt", "Très bientôt", "🔥"),
      card("Oui, dans le mois", "Ce mois-ci", "📅"),
      card("Peut-être", "Peut-être", "🤔"),
      card("Probablement pas", "Non", "❌"),
    ],
    policy,
    params.sectorId,
  );
  return choiceQ(label, "📊 Mesure la fidélité", items);
}

function openQuestion(params: GenerateQuizParams, ctx: BusinessContext): Question {
  const brand = brandRef(params);
  const age = params.clientAgeRange ?? "mixed";
  const label = tone(
    params.objective === "friction"
      ? "Qu'est-ce qu'on pourrait améliorer en priorité ? (libre)"
      : params.objective === "profile"
        ? "Décrivez en quelques mots votre profil ou vos attentes"
        : `Un dernier mot sur votre expérience chez ${brand} ?`,
    age,
  );
  return q("text", label, "💬 Insight qualitatif");
}

export function analyzeWebsite(
  url: string,
  sectorId: string,
  customActivity?: string,
  businessDescription?: string,
): string[] {
  const insights: string[] = [];
  const lower = url.toLowerCase();
  const desc = (businessDescription || customActivity || "").toLowerCase();

  if (/meta|facebook|instagram|tiktok/.test(desc)) insights.push("acquisition digitale (réseaux / pub)");
  if (/e-?commerce|en ligne|shopify/.test(desc)) insights.push("vente en ligne détectée");
  if (lower.includes("menu") || lower.includes("carte") || desc.includes("grillade")) {
    insights.push("carte et spécialités culinaires");
  }
  if (desc.includes("complément") || desc.includes("supplement")) insights.push("univers compléments / santé");
  if (insights.length === 0 && desc) insights.push(`contexte : ${desc.slice(0, 100)}`);
  return insights;
}

export function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function resolveEmojiPolicy(params: GenerateQuizParams, ctx: BusinessContext): EmojiPolicy {
  if (params.emojiPolicy) return params.emojiPolicy;
  if (params.forceEmojis === true) return "full";
  if (params.forceEmojis === false) return "none";
  if (params.sectorId === "other") {
    if (ctx.ecommerce || ctx.foodService || ctx.beautyService) return "full";
    if (ctx.healthSupplements) return "neutral";
    if (/cabinet|médical|garage|artisan|agence|immobilier/.test(ctx.blob)) return "none";
    return "full";
  }
  return getEmojiPolicy(params.sectorId);
}

export async function generateQuizWithAnalysis(
  params: GenerateQuizParams,
): Promise<{ questions: Question[]; websiteInsights: string[] }> {
  const activityDescription =
    params.activityDescription ||
    [params.customActivity, params.businessDescription].filter(Boolean).join(" ").trim();
  const ctx = parseBusinessContext({ ...params, activityDescription });
  const emojiPolicy = resolveEmojiPolicy(params, ctx);
  const enriched: GenerateQuizParams = {
    ...params,
    emojiPolicy,
    activityDescription,
  };

  let websiteInsights: string[] = [];
  if (params.website?.trim() || enriched.activityDescription) {
    websiteInsights = analyzeWebsite(
      params.website || "",
      params.sectorId,
      params.customActivity,
      enriched.activityDescription,
    );
    await delay(params.website?.trim() ? 2500 : 1200);
  }

  return { questions: buildTenQuestions(enriched), websiteInsights };
}

function buildTenQuestions(params: GenerateQuizParams): Question[] {
  const ctx = parseBusinessContext(params);
  const policy = params.emojiPolicy ?? getEmojiPolicy(params.sectorId);
  const group = sectorGroup(params.sectorId, ctx);

  const q8 = contextualQuestion(ctx, params, policy) ?? productPreferencesQuestion(group, params, ctx, policy);

  const raw: Question[] = [
    discoveryQuestion(params, ctx, policy),
    frequencyQuestion(group, params, policy),
    satisfactionQuestion(params, ctx),
    improvementQuestion(group, params, ctx, policy),
    spendingQuestion(group, params, ctx, policy),
    recommendQuestion(params, ctx, policy),
    futureIntentionsQuestion(params, ctx, policy),
    q8,
    returnIntentQuestion(params, ctx, policy),
    openQuestion(params, ctx),
  ];

  return applyPolicyToQuestions(raw, policy, params.sectorId);
}

export { emojisEnabledForSector, getEmojiPolicy };
