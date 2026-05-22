import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  Globe,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { BusinessObjective, QType, Question } from "@/lib/quiz-types";
import {
  GIFT_PLACEHOLDERS,
  GIFT_QUICK_PICKS,
  GIFT_SUGGESTIONS,
  OBJECTIVE_OPTIONS,
  SECTOR_OPTIONS,
  getContextTextForAI,
  getSectorDisplayForSummary,
  getSectorLabel,
} from "@/lib/quiz-constants";
import { CLIENT_AGE_OPTIONS } from "@/lib/quiz-age-tone";
import { emojisEnabledForSector } from "@/lib/emoji-policy";
import { generateQuizWithAnalysis } from "@/lib/quiz-generator";
import { QUIZ_THEME_OPTIONS, type QuizThemeId } from "@/lib/quiz-themes";
import type { ClientAgeRange, CustomThemeConfig } from "@/lib/quiz-types";

export const Route = createFileRoute("/dashboard/quiz")({
  component: QuizBuilder,
});

interface Quiz {
  id: string;
  name: string;
  business_type: string | null;
  free_gift: string | null;
  is_active: boolean;
  questions: Question[];
}

type WizardPhase = 1 | 2 | 3;
type OnboardingSub = "1a" | "1c" | "1b";

function StepIndicator({ current }: { current: WizardPhase }) {
  const steps = [
    { n: 1, label: "Votre commerce" },
    { n: 2, label: "Génération IA" },
    { n: 3, label: "Personnalisation" },
  ] as const;

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:items-center justify-between mb-8">
      {steps.map((s, i) => {
        const done = current > s.n;
        const active = current === s.n;
        return (
          <div key={s.n} className="flex items-center gap-3 flex-1">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                done ? "bg-primary text-primary-foreground" : active ? "bg-dark text-dark-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              {done ? <Check className="h-4 w-4" /> : s.n}
            </div>
            <div className="min-w-0">
              <div className={`text-sm font-semibold truncate ${active ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </div>
            </div>
            {i < steps.length - 1 && <div className="hidden sm:block flex-1 h-0.5 mx-4 bg-border rounded" />}
          </div>
        );
      })}
    </div>
  );
}

function QuizBuilder() {
  const { user, merchant } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  const [phase, setPhase] = useState<WizardPhase>(1);
  const [onboardingSub, setOnboardingSub] = useState<OnboardingSub>("1a");

  const [storeName, setStoreName] = useState("");
  const [website, setWebsite] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [quizTheme, setQuizTheme] = useState<QuizThemeId>("modern");
  const [customTheme, setCustomTheme] = useState<CustomThemeConfig>({
    accent: "#FFD60A",
    bg: "#FFFFFF",
    fg: "#111111",
  });
  const [customUseEmojis, setCustomUseEmojis] = useState(true);
  const [clientAgeRange, setClientAgeRange] = useState<ClientAgeRange>("mixed");
  const [sectorId, setSectorId] = useState("restaurant");
  const [customActivity, setCustomActivity] = useState("");
  const [objective, setObjective] = useState<BusinessObjective>("loyalty");
  const [offerGift, setOfferGift] = useState(true);
  const [gift, setGift] = useState("");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [analyzingWebsite, setAnalyzingWebsite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drag, setDrag] = useState<string | null>(null);

  const sectorSummary = getSectorDisplayForSummary(sectorId, customActivity);
  const activityContext = getContextTextForAI(sectorId, customActivity, businessDescription);
  const giftSuggestions = GIFT_SUGGESTIONS[sectorId] ?? GIFT_SUGGESTIONS.other;

  useEffect(() => {
    if (merchant?.business_name) setStoreName(merchant.business_name);
  }, [merchant]);

  useEffect(() => {
    if (offerGift && !gift.trim()) {
      const ph = GIFT_PLACEHOLDERS[sectorId];
      if (ph) setGift(ph);
    }
  }, [sectorId, offerGift]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("quizzes")
      .select("*")
      .eq("merchant_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setQuizzes((data as unknown as Quiz[]) || []));
  }, [user]);

  const addQ = () => {
    if (questions.length >= 12) return toast.error("Maximum 12 questions");
    setQuestions((q) => [...q, { id: crypto.randomUUID(), type: "text", label: "Nouvelle question" }]);
  };
  const removeQ = (id: string) => setQuestions((q) => q.filter((x) => x.id !== id));
  const updateQ = (id: string, patch: Partial<Question>) =>
    setQuestions((q) => q.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const onDragOver = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    if (!drag || drag === overId) return;
    setQuestions((q) => {
      const from = q.findIndex((x) => x.id === drag);
      const to = q.findIndex((x) => x.id === overId);
      const copy = [...q];
      const [m] = copy.splice(from, 1);
      copy.splice(to, 0, m);
      return copy;
    });
  };

  const validate1a = () => {
    if (!storeName.trim()) {
      toast.error("Indiquez le nom de votre enseigne");
      return false;
    }
    if (sectorId === "other" && !customActivity.trim()) {
      toast.error("Décrivez votre activité");
      return false;
    }
    return true;
  };

  const validate1b = () => {
    if (offerGift && !gift.trim()) {
      toast.error("Décrivez le cadeau ou désactivez l'option");
      return false;
    }
    return true;
  };

  const handleGenerate = async () => {
    setGenerating(true);
    if (website.trim() || businessDescription.trim()) setAnalyzingWebsite(true);

    try {
      const { questions: qs } = await generateQuizWithAnalysis({
        sectorId,
        sectorLabel: sectorId === "other" ? "" : getSectorLabel(sectorId),
        customActivity: sectorId === "other" ? customActivity.trim() : undefined,
        activityDescription: activityContext || undefined,
        objective,
        website: website.trim() || undefined,
        storeName: storeName.trim(),
        businessDescription: businessDescription.trim() || undefined,
        theme: quizTheme,
        clientAgeRange,
        forceEmojis: quizTheme === "custom" ? customUseEmojis : undefined,
        emojiPolicy: quizTheme === "custom" ? (customUseEmojis ? "full" : "none") : undefined,
      });
      setQuestions(qs);
      setGenerated(true);
      setPhase(3);
      toast.success("10 questions générées ! Personnalisez-les si besoin.");
    } catch {
      toast.error("Erreur lors de la génération");
    } finally {
      setGenerating(false);
      setAnalyzingWebsite(false);
    }
  };

  const save = async () => {
    if (!user) return;
    if (!storeName.trim()) return toast.error("Nom de l'enseigne requis");
    if (questions.length === 0) return toast.error("Ajoutez au moins une question");
    setSaving(true);
    const { data, error } = await supabase
      .from("quizzes")
      .insert({
        merchant_id: user.id,
        name: storeName.trim(),
        business_type: sectorSummary,
        free_gift: offerGift ? gift.trim() : null,
        questions: questions as unknown as never,
        is_active: true,
        theme: quizTheme,
        business_description: businessDescription.trim() || null,
        target_age_range: clientAgeRange,
        emojis_enabled:
          quizTheme === "custom" ? customUseEmojis : emojisEnabledForSector(sectorId),
        custom_color_primary: quizTheme === "custom" ? customTheme.accent : null,
        custom_color_background: quizTheme === "custom" ? customTheme.bg : null,
        custom_color_text: quizTheme === "custom" ? customTheme.fg : null,
      })
      .select()
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Quiz enregistré !");
    if (data) navigate({ to: "/dashboard/qrcode", search: { id: data.id } });
  };

  const resetWizard = () => {
    setPhase(1);
    setOnboardingSub("1a");
    setQuestions([]);
    setGenerated(false);
    setAnalyzingWebsite(false);
  };

  const objectiveLabel = OBJECTIVE_OPTIONS.find((o) => o.id === objective)?.title ?? objective;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Mes Quiz</h1>
        <p className="text-muted-foreground mt-1">
          Onboarding intelligent, génération IA de 10 questions, puis personnalisation libre.
        </p>
      </div>

      {quizzes.length > 0 && (
        <div className="bg-background border border-border rounded-2xl p-5">
          <h2 className="font-bold mb-3">Vos quiz existants</h2>
          <div className="space-y-2">
            {quizzes.map((q) => (
              <div key={q.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <div className="font-semibold">{q.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {(q.questions || []).length} questions · {q.business_type || "—"} ·{" "}
                    {q.free_gift ? `cadeau : ${q.free_gift}` : "sans cadeau"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/dashboard/qrcode", search: { id: q.id } })}
                  className="text-sm font-semibold underline"
                >
                  Voir le QR code
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-background border border-border rounded-2xl p-5 sm:p-8">
        <div className="flex items-center justify-between gap-4 mb-2">
          <h2 className="font-bold text-lg">Créer un nouveau quiz</h2>
          {phase > 1 && (
            <button type="button" onClick={resetWizard} className="text-sm text-muted-foreground hover:underline">
              Recommencer
            </button>
          )}
        </div>

        <StepIndicator current={phase} />

        {phase === 1 && (
          <div className="space-y-6 max-w-2xl">
            <div className="flex gap-2 text-sm font-medium flex-wrap">
              <button
                type="button"
                onClick={() => setOnboardingSub("1a")}
                className={`px-3 py-1.5 rounded-full ${onboardingSub === "1a" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
              >
                Infos commerce
              </button>
              <button
                type="button"
                onClick={() => validate1a() && setOnboardingSub("1c")}
                className={`px-3 py-1.5 rounded-full ${onboardingSub === "1c" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
              >
                Style du quiz
              </button>
              <button
                type="button"
                onClick={() => validate1a() && setOnboardingSub("1b")}
                className={`px-3 py-1.5 rounded-full ${onboardingSub === "1b" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
              >
                Le cadeau
              </button>
            </div>

            {onboardingSub === "1a" && (
              <div className="space-y-5">
                <div className="rounded-xl border border-border p-5 space-y-5 bg-secondary/30">
                  <div>
                    <label className="text-sm font-semibold mb-1 block">
                      Nom de l'enseigne <span className="text-urgent">*</span>
                    </label>
                    <input
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Ex : Le Moulin de Lesquin"
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background outline-none focus:border-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-1 block flex items-center gap-2">
                      <Globe className="h-4 w-4" /> Site web ou lien Google Maps
                      <span className="text-muted-foreground font-normal">(facultatif)</span>
                    </label>
                    <input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://moncommerce.fr ou lien Google Maps"
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background outline-none focus:border-foreground"
                    />
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      💡 On analyse votre site pour créer des questions encore plus précises sur votre activité et vos clients.
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-1 block">
                      Décrivez votre entreprise en quelques mots
                    </label>
                    <textarea
                      value={businessDescription}
                      onChange={(e) => setBusinessDescription(e.target.value)}
                      rows={4}
                      placeholder="Ex : On est un restaurant familial spécialisé dans les grillades, ouvert depuis 2018, clientèle surtout des familles et des travailleurs le midi. On est connu pour notre sauce maison et notre ambiance chaleureuse."
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background outline-none focus:border-foreground resize-y min-h-[6rem]"
                    />
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      💡 Plus vous êtes précis, plus les questions du quiz seront pertinentes et utiles. L'IA analyse votre
                      description pour créer un quiz unique à votre image.
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-1 block">
                      Secteur d'activité <span className="text-urgent">*</span>
                    </label>
                    <select
                      value={sectorId}
                      onChange={(e) => setSectorId(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background outline-none focus:border-foreground"
                    >
                      {SECTOR_OPTIONS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.emoji} {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {sectorId === "other" && (
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
                      <label className="text-sm font-semibold block">
                        Décrivez votre activité <span className="text-urgent">*</span>
                      </label>
                      <textarea
                        value={customActivity}
                        onChange={(e) => setCustomActivity(e.target.value)}
                        rows={3}
                        placeholder="Ex : Je vends des compléments alimentaires en ligne via Meta Ads, clientèle 35-55 ans..."
                        className="w-full px-4 py-3 rounded-lg border border-input bg-background outline-none focus:border-foreground resize-y"
                      />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        ✨ L'IA utilise exactement ce texte pour vos questions (e-commerce, Meta Ads, prestation…). Pas de questions « magasin physique » si vous vendez en ligne.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-semibold mb-3 block">
                      Objectif principal <span className="text-urgent">*</span>
                    </label>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {OBJECTIVE_OPTIONS.map((obj) => (
                        <button
                          key={obj.id}
                          type="button"
                          onClick={() => setObjective(obj.id)}
                          className={`text-left p-4 rounded-xl border-2 transition ${
                            objective === obj.id
                              ? "border-foreground bg-primary/15 shadow-sm"
                              : "border-border hover:border-foreground/40"
                          }`}
                        >
                          <span className="text-2xl">{obj.emoji}</span>
                          <p className="font-bold text-sm mt-2">{obj.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-snug">{obj.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button type="button" onClick={() => validate1a() && setOnboardingSub("1c")} className="btn-yellow">
                  Continuer <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {onboardingSub === "1c" && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-bold text-lg mb-1">Style de votre quiz</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choisissez l'ambiance visuelle que vos clients verront sur mobile.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {QUIZ_THEME_OPTIONS.map((t) => {
                      const selected = quizTheme === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setQuizTheme(t.id)}
                          className={`text-left rounded-xl border-2 p-4 transition ${
                            selected ? "border-[#FFD60A] shadow-md bg-primary/10" : "border-border hover:border-foreground/30"
                          }`}
                        >
                          <div
                            className="rounded-lg p-3 mb-3 border"
                            style={{
                              background: t.preview.bg,
                              color: t.preview.fg,
                              borderColor: t.preview.accent,
                            }}
                          >
                            <p className="text-xs font-bold mb-2" style={{ color: t.preview.fg }}>
                              Aperçu
                            </p>
                            <p className="text-sm font-bold leading-tight">Votre question ici ?</p>
                            <span
                              className="inline-block mt-2 text-xs font-bold px-2 py-1 rounded"
                              style={{ background: t.preview.accent, color: t.preview.bg === "#FFFFFF" ? "#111" : "#fff" }}
                            >
                              Continuer
                            </span>
                          </div>
                          <span className="text-xl">{t.emoji}</span>
                          <p className="font-bold text-sm mt-1">{t.name}</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-snug">{t.tagline}</p>
                          <p className="text-xs mt-2 text-muted-foreground">
                            <span className="font-semibold">Recommandé pour :</span> {t.recommendedFor}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {quizTheme === "custom" && (
                    <div className="rounded-xl border border-border p-4 space-y-4 bg-background">
                      <p className="text-sm font-semibold">Personnalisation des couleurs</p>
                      <div className="grid sm:grid-cols-3 gap-4">
                        {(
                          [
                            ["accent", "Couleur principale", customTheme.accent],
                            ["bg", "Couleur de fond", customTheme.bg],
                            ["fg", "Couleur du texte", customTheme.fg],
                          ] as const
                        ).map(([key, label, value]) => (
                          <div key={key}>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={value}
                                onChange={(e) =>
                                  setCustomTheme((t) => ({ ...t, [key]: e.target.value }))
                                }
                                className="h-10 w-14 rounded border border-border cursor-pointer"
                              />
                              <input
                                type="text"
                                value={value}
                                onChange={(e) =>
                                  setCustomTheme((t) => ({ ...t, [key]: e.target.value }))
                                }
                                className="flex-1 px-2 py-1.5 text-xs rounded border border-input font-mono"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div>
                        <label className="text-sm font-semibold block mb-2">Utiliser des emojis dans le quiz ?</label>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setCustomUseEmojis(true)}
                            className={`flex-1 py-2 rounded-lg font-semibold border-2 text-sm ${customUseEmojis ? "border-foreground bg-primary" : "border-border"}`}
                          >
                            Oui
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomUseEmojis(false)}
                            className={`flex-1 py-2 rounded-lg font-semibold border-2 text-sm ${!customUseEmojis ? "border-foreground bg-secondary" : "border-border"}`}
                          >
                            Non
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-semibold mb-3 block">
                      Quelle est la tranche d'âge principale de vos clients ?
                    </label>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {CLIENT_AGE_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setClientAgeRange(opt.id)}
                          className={`text-left p-3 rounded-xl border-2 transition ${
                            clientAgeRange === opt.id
                              ? "border-[#FFD60A] bg-primary/10"
                              : "border-border hover:border-foreground/30"
                          }`}
                        >
                          <span className="text-xl">{opt.emoji}</span>
                          <p className="font-bold text-sm mt-1">{opt.title}</p>
                          <p className="text-xs text-muted-foreground leading-snug">{opt.subtitle}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => setOnboardingSub("1a")} className="btn-outline-dark">
                    <ChevronLeft className="h-4 w-4" /> Retour
                  </button>
                  <button type="button" onClick={() => setOnboardingSub("1b")} className="btn-yellow flex-1 sm:flex-none">
                    Continuer <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {onboardingSub === "1b" && (
              <div className="space-y-5">
                <div className="rounded-xl border border-border p-5 bg-secondary/30 space-y-4">
                  <label className="text-sm font-semibold block">Offrir un cadeau à mes clients ?</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setOfferGift(true)}
                      className={`flex-1 py-3 rounded-lg font-semibold border-2 ${offerGift ? "border-foreground bg-primary" : "border-border"}`}
                    >
                      Oui
                    </button>
                    <button
                      type="button"
                      onClick={() => setOfferGift(false)}
                      className={`flex-1 py-3 rounded-lg font-semibold border-2 ${!offerGift ? "border-foreground bg-secondary" : "border-border"}`}
                    >
                      Non
                    </button>
                  </div>

                  {offerGift ? (
                    <>
                      <div>
                        <p className="text-sm font-semibold mb-1">Quel cadeau ou avantage offrez-vous ?</p>
                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                          💡 Le cadeau est révélé uniquement à la fin du quiz. C'est ce qui motive vos clients à répondre jusqu'au bout.
                          Choisissez quelque chose de simple mais qui a de la valeur à leurs yeux — pas besoin que ça coûte cher.
                        </p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {GIFT_QUICK_PICKS.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setGift(s)}
                              className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-primary/30 hover:border-primary transition"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">Suggestions par secteur :</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {giftSuggestions.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setGift(s)}
                              className="text-xs px-3 py-1.5 rounded-full border border-dashed border-border bg-secondary/50 hover:bg-primary/20 transition"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                        <input
                          value={gift}
                          onChange={(e) => setGift(e.target.value)}
                          placeholder={GIFT_PLACEHOLDERS[sectorId]}
                          className="w-full px-4 py-3 rounded-lg border border-input bg-background outline-none focus:border-foreground"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          Soyez précis et généreux dans la formulation — ça augmente le taux de scan de 40%.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-lg bg-secondary p-4 text-sm text-muted-foreground leading-relaxed">
                      👍 Pas de problème. Le quiz fonctionnera sans cadeau. Vos clients répondront pour donner leur avis et vous
                      aider à vous améliorer. Certains commerces préfèrent cette approche plus directe.
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => setOnboardingSub("1c")} className="btn-outline-dark">
                    <ChevronLeft className="h-4 w-4" /> Retour
                  </button>
                  <button type="button" onClick={() => validate1b() && setPhase(2)} className="btn-yellow flex-1 sm:flex-none">
                    Passer à la génération <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {phase === 2 && (
          <div className="max-w-lg mx-auto text-center space-y-6 py-6">
            {analyzingWebsite ? (
              <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-10">
                <Loader2 className="h-12 w-12 mx-auto text-primary mb-4 animate-spin" />
                <h3 className="text-xl font-bold mb-2">
                  🔍 On analyse votre site pour personnaliser les questions…
                </h3>
                <p className="text-sm text-muted-foreground">
                  Recherche de vos services, spécialités et positionnement en ligne.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-8">
                  <Sparkles className="h-12 w-12 mx-auto text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-2">Prêt à générer votre quiz</h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    <strong>{storeName}</strong> · {sectorSummary}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">Objectif : {objectiveLabel}</p>
                  {(website.trim() || businessDescription.trim()) && (
                    <p className="text-xs text-primary font-medium mb-2">
                      {website.trim() ? "🌐 Site fourni" : "📝 Description fournie"} — analyse IA activée
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    L'IA va créer <strong>10 questions</strong> couvrant acquisition, fidélité, satisfaction, panier moyen et plus.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="btn-yellow w-full text-base py-4"
                >
                  <Sparkles className="h-5 w-5" />
                  {generating ? "Génération en cours…" : "Générer mon quiz ✨"}
                </button>

                <button type="button" onClick={() => setPhase(1)} className="text-sm text-muted-foreground hover:underline">
                  Modifier les informations
                </button>
              </>
            )}
          </div>
        )}

        {phase === 3 && (
          <div className="space-y-6">
            {generated && (
              <div className="rounded-xl bg-primary/10 border border-primary/30 px-4 py-3 text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0" />
                10 questions générées pour <strong>{storeName}</strong>
              </div>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div className="rounded-lg border border-border p-3">
                <span className="text-muted-foreground">Enseigne</span>
                <p className="font-semibold">{storeName}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <span className="text-muted-foreground">Secteur</span>
                <p className="font-semibold line-clamp-3">{sectorSummary}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <span className="text-muted-foreground">Thème</span>
                <p className="font-semibold">{QUIZ_THEME_OPTIONS.find((t) => t.id === quizTheme)?.name ?? quizTheme}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <span className="text-muted-foreground">Cadeau</span>
                <p className="font-semibold">{offerGift ? gift : "Aucun"}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold">Questions ({questions.length}/12)</label>
                <button type="button" onClick={addQ} className="text-sm font-semibold flex items-center gap-1 hover:underline">
                  <Plus className="h-4 w-4" /> Ajouter
                </button>
              </div>
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    draggable
                    onDragStart={() => setDrag(q.id)}
                    onDragEnd={() => setDrag(null)}
                    onDragOver={(e) => onDragOver(e, q.id)}
                    className="border border-border rounded-lg p-4 bg-secondary/50"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab mt-2 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-primary">Q{idx + 1}</span>
                          {q.businessLabel && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-dark/10 text-muted-foreground">
                              {q.businessLabel}
                            </span>
                          )}
                        </div>
                        <input
                          value={q.label}
                          onChange={(e) => updateQ(q.id, { label: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-input bg-background outline-none focus:border-foreground"
                        />
                        <select
                          value={q.type}
                          onChange={(e) => updateQ(q.id, { type: e.target.value as QType })}
                          className="w-full sm:w-auto px-3 py-2 rounded-lg border border-input bg-background outline-none focus:border-foreground"
                        >
                          <option value="text">Texte libre</option>
                          <option value="choice">Choix unique</option>
                          <option value="multichoice">Choix multiple</option>
                          <option value="rating">Note 1-10</option>
                          <option value="yesno">Oui / Non</option>
                        </select>
                        {(q.type === "choice" || q.type === "multichoice") && (
                          <input
                            value={(q.options || []).join(", ")}
                            onChange={(e) =>
                              updateQ(q.id, {
                                options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                                choiceCards: undefined,
                              })
                            }
                            placeholder="Options séparées par des virgules"
                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:border-foreground"
                          />
                        )}
                      </div>
                      <button type="button" onClick={() => removeQ(q.id)} className="p-2 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button type="button" onClick={() => setPhase(2)} className="btn-outline-dark">
                <ChevronLeft className="h-4 w-4" /> Régénérer
              </button>
              <button type="button" onClick={save} disabled={saving} className="btn-yellow flex-1 sm:flex-none">
                <Save className="h-4 w-4" /> {saving ? "Enregistrement..." : "Enregistrer & Générer QR Code"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
