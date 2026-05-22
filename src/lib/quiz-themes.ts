import type { CustomThemeConfig } from "./quiz-types";

export type QuizThemeId = "modern" | "bold" | "warm" | "nature" | "industrial" | "custom";

export interface QuizThemeOption {
  id: QuizThemeId;
  emoji: string;
  name: string;
  tagline: string;
  recommendedFor: string;
  preview: {
    bg: string;
    fg: string;
    accent: string;
    muted: string;
  };
}

export const QUIZ_THEME_OPTIONS: QuizThemeOption[] = [
  {
    id: "modern",
    emoji: "🎨",
    name: "Moderne & Épuré",
    tagline: "Fond blanc, texte noir, accent jaune — typographie clean",
    recommendedFor: "boutiques mode, agences, services pro",
    preview: { bg: "#FFFFFF", fg: "#111111", accent: "#FFD60A", muted: "#6B7280" },
  },
  {
    id: "bold",
    emoji: "🔥",
    name: "Bold & Dynamique",
    tagline: "Fond noir, texte blanc, gros titres plein d'énergie",
    recommendedFor: "sport, barbershop, garage, fast-food",
    preview: { bg: "#111111", fg: "#FFFFFF", accent: "#FFD60A", muted: "#9CA3AF" },
  },
  {
    id: "warm",
    emoji: "🌸",
    name: "Doux & Chaleureux",
    tagline: "Fond crème, accent rose, ambiance douce et accueillante",
    recommendedFor: "beauté, nail art, bien-être, pâtisserie",
    preview: { bg: "#FFF8F0", fg: "#2D2D2D", accent: "#FF6B8A", muted: "#8B7355" },
  },
  {
    id: "nature",
    emoji: "🌿",
    name: "Nature & Frais",
    tagline: "Blanc cassé, vert foncé, ambiance naturelle et saine",
    recommendedFor: "bio, naturopathe, yoga, épicerie saine",
    preview: { bg: "#F7FAF8", fg: "#1A3C2A", accent: "#4CAF50", muted: "#5C7A6A" },
  },
  {
    id: "industrial",
    emoji: "⚙️",
    name: "Industriel & Pro",
    tagline: "Gris foncé, accent orange, sérieux et technique",
    recommendedFor: "garage, artisan, station-service, réparation",
    preview: { bg: "#2A2A2A", fg: "#FFFFFF", accent: "#FF6B35", muted: "#A3A3A3" },
  },
  {
    id: "custom",
    emoji: "✏️",
    name: "Personnalisé",
    tagline: "Vos couleurs, votre style",
    recommendedFor: "marques avec charte graphique propre",
    preview: { bg: "#FFFFFF", fg: "#111111", accent: "#FFD60A", muted: "#6B7280" },
  },
];

export function getThemeOption(id: string): QuizThemeOption {
  return QUIZ_THEME_OPTIONS.find((t) => t.id === id) ?? QUIZ_THEME_OPTIONS[0];
}

export function buildCustomThemeVars(config: CustomThemeConfig): Record<string, string> {
  const accentFg = config.bg === "#FFFFFF" || config.bg.toLowerCase() === "#fff" ? "#111111" : "#FFFFFF";
  return {
    "--quiz-bg": config.bg,
    "--quiz-fg": config.fg,
    "--quiz-muted": "#6B7280",
    "--quiz-accent": config.accent,
    "--quiz-accent-fg": accentFg,
    "--quiz-border": "#E5E5E5",
    "--quiz-card-selected-bg": `${config.accent}33`,
    "--quiz-card-selected-border": config.accent,
    "--quiz-progress": config.accent,
    "--quiz-shadow": config.fg,
    "--quiz-font": '"Inter", system-ui, sans-serif',
  };
}

export function resolveQuizThemeStyle(
  themeId: string | null | undefined,
  themeConfig?: CustomThemeConfig | null,
  flatColors?: {
    custom_color_primary?: string | null;
    custom_color_background?: string | null;
    custom_color_text?: string | null;
  } | null,
): Record<string, string> {
  const fromFlat =
    flatColors?.custom_color_primary &&
    flatColors?.custom_color_background &&
    flatColors?.custom_color_text
      ? {
          accent: flatColors.custom_color_primary,
          bg: flatColors.custom_color_background,
          fg: flatColors.custom_color_text,
        }
      : null;

  if (themeId === "custom" && (fromFlat || themeConfig)) {
    return buildCustomThemeVars(fromFlat ?? themeConfig!);
  }
  const id = (themeId as QuizThemeId) || "modern";
  return THEME_CSS_VARS[id in THEME_CSS_VARS ? id : "modern"];
}

export const THEME_CSS_VARS: Record<
  Exclude<QuizThemeId, "custom">,
  Record<string, string>
> = {
  modern: {
    "--quiz-bg": "#FFFFFF",
    "--quiz-fg": "#111111",
    "--quiz-muted": "#6B7280",
    "--quiz-accent": "#FFD60A",
    "--quiz-accent-fg": "#111111",
    "--quiz-border": "#E5E5E5",
    "--quiz-card-selected-bg": "rgba(255, 214, 10, 0.3)",
    "--quiz-card-selected-border": "#FFD60A",
    "--quiz-progress": "#FFD60A",
    "--quiz-shadow": "#111111",
    "--quiz-font": '"Inter", system-ui, sans-serif',
  },
  bold: {
    "--quiz-bg": "#111111",
    "--quiz-fg": "#FFFFFF",
    "--quiz-muted": "#9CA3AF",
    "--quiz-accent": "#FFD60A",
    "--quiz-accent-fg": "#111111",
    "--quiz-border": "#333333",
    "--quiz-card-selected-bg": "rgba(255, 214, 10, 0.25)",
    "--quiz-card-selected-border": "#FFD60A",
    "--quiz-progress": "#FFD60A",
    "--quiz-shadow": "#000000",
    "--quiz-font": '"Inter", system-ui, sans-serif',
  },
  warm: {
    "--quiz-bg": "#FFF8F0",
    "--quiz-fg": "#2D2D2D",
    "--quiz-muted": "#8B7355",
    "--quiz-accent": "#FF6B8A",
    "--quiz-accent-fg": "#FFFFFF",
    "--quiz-border": "#F0E0D6",
    "--quiz-card-selected-bg": "rgba(255, 107, 138, 0.15)",
    "--quiz-card-selected-border": "#FF6B8A",
    "--quiz-progress": "#FF6B8A",
    "--quiz-shadow": "#2D2D2D",
    "--quiz-font": '"Nunito", "Inter", system-ui, sans-serif',
  },
  nature: {
    "--quiz-bg": "#F7FAF8",
    "--quiz-fg": "#1A3C2A",
    "--quiz-muted": "#5C7A6A",
    "--quiz-accent": "#4CAF50",
    "--quiz-accent-fg": "#FFFFFF",
    "--quiz-border": "#D4E8DC",
    "--quiz-card-selected-bg": "rgba(76, 175, 80, 0.15)",
    "--quiz-card-selected-border": "#4CAF50",
    "--quiz-progress": "#4CAF50",
    "--quiz-shadow": "#1A3C2A",
    "--quiz-font": '"Inter", system-ui, sans-serif',
  },
  industrial: {
    "--quiz-bg": "#2A2A2A",
    "--quiz-fg": "#FFFFFF",
    "--quiz-muted": "#A3A3A3",
    "--quiz-accent": "#FF6B35",
    "--quiz-accent-fg": "#111111",
    "--quiz-border": "#444444",
    "--quiz-card-selected-bg": "rgba(255, 107, 53, 0.2)",
    "--quiz-card-selected-border": "#FF6B35",
    "--quiz-progress": "#FF6B35",
    "--quiz-shadow": "#000000",
    "--quiz-font": '"Inter", system-ui, sans-serif',
  },
};
