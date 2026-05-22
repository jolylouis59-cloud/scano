import type { EmojiPolicy } from "./emoji-policy";
import type { QuizThemeId } from "./quiz-themes";

export type QType = "text" | "choice" | "multichoice" | "rating" | "yesno";

export interface ChoiceCard {
  emoji: string;
  title: string;
  subtitle?: string;
  value: string;
}

export const OTHER_OPTION_VALUE = "__other__";

export type ClientAgeRange = "18-25" | "26-35" | "36-50" | "50+" | "mixed";

export interface CustomThemeConfig {
  accent: string;
  bg: string;
  fg: string;
}

export interface Question {
  id: string;
  type: QType;
  label: string;
  options?: string[];
  choiceCards?: ChoiceCard[];
  businessLabel?: string;
  ratingMax?: number;
  allowOtherOption?: boolean;
  yesNoWhyOptional?: boolean;
}

export type BusinessObjective =
  | "revenue"
  | "loyalty"
  | "profile"
  | "reviews"
  | "friction"
  | "acquisition";

export interface SectorOption {
  id: string;
  emoji: string;
  label: string;
  isOther?: boolean;
}

export interface ObjectiveOption {
  id: BusinessObjective;
  emoji: string;
  title: string;
  description: string;
}

export interface GenerateQuizParams {
  sectorId: string;
  sectorLabel: string;
  customActivity?: string;
  activityDescription?: string;
  objective: BusinessObjective;
  website?: string;
  storeName?: string;
  businessDescription?: string;
  theme?: QuizThemeId;
  emojiPolicy?: EmojiPolicy;
  clientAgeRange?: ClientAgeRange;
  forceEmojis?: boolean;
}

export interface BusinessContext {
  blob: string;
  ecommerce: boolean;
  metaAds: boolean;
  physicalStore: boolean;
  healthSupplements: boolean;
  beautyService: boolean;
  foodService: boolean;
  vehicleElectric: boolean;
  sauceMaison: boolean;
  grillades: boolean;
  nailArtJapanese: boolean;
  premiumTone: boolean;
  streetwearBarber: boolean;
  familyRestaurant: boolean;
  keywords: string[];
}
