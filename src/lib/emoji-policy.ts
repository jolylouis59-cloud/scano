export type EmojiPolicy = "full" | "none" | "neutral";

const FRIENDLY_SECTORS = new Set([
  "restaurant",
  "boulangerie",
  "cafe",
  "mode",
  "nail",
  "beaute",
  "animalerie",
  "yoga",
  "epicerie",
  "librairie",
  "creche",
  "formation",
  "fastfood",
]);

const NO_EMOJI_SECTORS = new Set([
  "garage",
  "station",
  "artisan",
  "informatique",
  "medical",
  "immobilier",
  "nettoyage",
  "dentaire",
  "lavage",
]);

const NEUTRAL_SECTORS = new Set([
  "barbershop",
  "fitness",
  "pharmacie",
  "evenementiel",
  "photo",
  "coiffure",
]);

export function getEmojiPolicy(sectorId: string): EmojiPolicy {
  if (NO_EMOJI_SECTORS.has(sectorId)) return "none";
  if (NEUTRAL_SECTORS.has(sectorId)) return "neutral";
  if (FRIENDLY_SECTORS.has(sectorId)) return "full";
  return "full";
}

export function emojisEnabledForSector(sectorId: string): boolean {
  return getEmojiPolicy(sectorId) !== "none";
}

const NEUTRAL_BY_SECTOR: Record<string, string[]> = {
  barbershop: ["💈", "✂️", "🪒", "⭐"],
  fitness: ["🏋️", "💪", "⏱️", "🎯"],
  pharmacie: ["💊", "🩺", "✓", "📋"],
  evenementiel: ["🎪", "🎤", "📅", "✓"],
  photo: ["📷", "🖼️", "✨", "📋"],
  coiffure: ["✂️", "💇", "⭐", "📅"],
};

export function neutralEmojiFor(sectorId: string, index: number): string {
  const list = NEUTRAL_BY_SECTOR[sectorId] ?? ["•", "◦", "▪", "▫"];
  return list[index % list.length];
}

export function stripBusinessLabelEmoji(label: string): string {
  return label.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, "").trim();
}

export function formatBusinessLabel(label: string, policy: EmojiPolicy): string {
  if (policy === "none") return stripBusinessLabelEmoji(label);
  return label;
}
