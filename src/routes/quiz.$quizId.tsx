import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, type CSSProperties } from "react";
import confetti from "canvas-confetti";
import { Star, Lock, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { ChoiceCard, CustomThemeConfig, QType, Question } from "@/lib/quiz-types";
import { OTHER_OPTION_VALUE } from "@/lib/quiz-types";
import { MOTIVATIONAL_MESSAGES, getRatingFeedbackCopy } from "@/lib/quiz-constants";
import { generateRedemptionCode } from "@/lib/redemption-code";
import { BIRTH_MONTHS, BIRTH_YEARS, calculateAgeFromBirth } from "@/lib/quiz-profile";
import { resolveQuizThemeStyle, type QuizThemeId } from "@/lib/quiz-themes";

export const Route = createFileRoute("/quiz/$quizId")({
  component: CustomerQuiz,
});

interface Quiz {
  id: string;
  name: string;
  free_gift: string | null;
  merchant_id: string;
  questions: Question[];
  theme?: string | null;
  theme_config?: CustomThemeConfig | null;
  custom_color_primary?: string | null;
  custom_color_background?: string | null;
  custom_color_text?: string | null;
  emojis_enabled?: boolean | null;
}

function answerOtherKey(questionId: string) {
  return `${questionId}_other_text`;
}

function answerWhyKey(questionId: string) {
  return `${questionId}_why`;
}

type Phase = "intro" | "questions" | "done";

interface ProfileStep {
  id: string;
  type: QType | "birthdate";
  label: string;
  helper?: string;
  options?: string[];
  choiceCards?: ChoiceCard[];
  plainCards?: boolean;
}

const PROFILE_STEPS: ProfileStep[] = [
  {
    id: "_first_name",
    type: "text",
    label: "Quel est votre prénom ?",
  },
  {
    id: "_birth",
    type: "birthdate",
    label: "Quelle est votre date de naissance ?",
    helper: "On utilise ça uniquement pour mieux comprendre notre clientèle 🙏",
  },
  {
    id: "_gender",
    type: "choice",
    label: "Vous êtes ?",
    plainCards: true,
    choiceCards: [
      { emoji: "", title: "Femme", value: "Femme" },
      { emoji: "", title: "Homme", value: "Homme" },
      { emoji: "", title: "Autre", value: "Autre" },
    ],
    options: ["Femme", "Homme", "Autre"],
  },
];

function resolveThemeId(raw: string | null | undefined): QuizThemeId {
  const ids: QuizThemeId[] = ["modern", "bold", "warm", "nature", "industrial", "custom"];
  return ids.includes(raw as QuizThemeId) ? (raw as QuizThemeId) : "modern";
}

function QuizProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs font-semibold mb-1.5 px-1" style={{ color: "var(--quiz-fg)" }}>
        <span>Progression</span>
        <span>{Math.round(percent)}%</span>
      </div>
      <div className="h-1 w-full quiz-progress-track rounded-full overflow-hidden">
        <div
          className="h-full quiz-progress-fill transition-all duration-300 ease-in-out rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function CustomerQuiz() {
  const { quizId } = Route.useParams();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [bizName, setBizName] = useState("");
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("intro");
  const [step, setStep] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [birthMonth, setBirthMonth] = useState<number>(0);
  const [birthYear, setBirthYear] = useState<number>(0);
  const [gender, setGender] = useState("");
  const [firstName, setFirstName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [redemptionCode, setRedemptionCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: q } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .eq("is_active", true)
        .maybeSingle();
      if (q) {
        setQuiz(q as unknown as Quiz);
        const { data: m } = await supabase
          .from("merchants")
          .select("business_name")
          .eq("id", (q as { merchant_id: string }).merchant_id)
          .maybeSingle();
        setBizName((m as { business_name: string | null } | null)?.business_name || "Notre commerce");
      }
      setLoading(false);
    })();
  }, [quizId]);

  const themeId = resolveThemeId(quiz?.theme);
  const themeStyle = resolveQuizThemeStyle(quiz?.theme, quiz?.theme_config ?? null, quiz ?? null) as CSSProperties;
  const showQuizEmojis = quiz?.emojis_enabled !== false;

  const quizQuestions = quiz?.questions || [];
  const allSteps: (ProfileStep | Question)[] = [...PROFILE_STEPS, ...quizQuestions];
  const calculatedAge =
    birthMonth > 0 && birthYear > 0 ? calculateAgeFromBirth(birthMonth, birthYear) : null;
  const totalSteps = allSteps.length;
  const questionCount = quizQuestions.length;
  const current = allSteps[step];
  const progressPercent = phase === "intro" ? 0 : ((step + 1) / totalSteps) * 100;

  const isProfileStep = step < PROFILE_STEPS.length;
  const profilePlainCards =
    isProfileStep && "plainCards" in (current || {}) && Boolean((current as ProfileStep).plainCards);
  const displayCardEmoji = (emoji: string) =>
    !isProfileStep && showQuizEmojis && Boolean(emoji);

  const hasGift = Boolean(quiz?.free_gift?.trim());
  const quizOnlyIndex = step - PROFILE_STEPS.length;
  const motivational =
    quizOnlyIndex >= 0 && quizOnlyIndex < MOTIVATIONAL_MESSAGES.length
      ? MOTIVATIONAL_MESSAGES[quizOnlyIndex]
      : step === 0
        ? "👋 Commençons par faire connaissance"
        : step === 1
          ? PROFILE_STEPS[1].helper ?? ""
          : step === 2
            ? hasGift
              ? "🎁 Une surprise vous attend à la fin"
              : "⭐ Encore quelques infos..."
            : "⭐ Encore quelques infos...";

  const goNext = useCallback(() => {
    setAnimKey((k) => k + 1);
    setStep((s) => s + 1);
  }, []);

  const setAns = (val: unknown) => {
    if (!current) return;
    if (current.id === "_first_name") setFirstName(String(val));
    else if (current.id === "_gender") setGender(String(val));
    else setAnswers((a) => ({ ...a, [current.id]: val, [current.label]: val }));
  };

  const toggleMulti = (optionValue: string) => {
    if (!current) return;
    const prev = (answers[current.id] as string[] | undefined) ?? [];
    const next = prev.includes(optionValue)
      ? prev.filter((v) => v !== optionValue)
      : [...prev, optionValue];
    setAnswers((a) => ({ ...a, [current.id]: next, [current.label]: next }));
  };

  const getMultiValue = (): string[] => {
    if (!current) return [];
    return (answers[current.id] as string[] | undefined) ?? [];
  };

  const getValue = (): string | number | string[] | undefined => {
    if (!current) return undefined;
    if (current.id === "_first_name") return firstName || undefined;
    if (current.id === "_birth") return birthMonth > 0 && birthYear > 0 ? `${birthMonth}-${birthYear}` : undefined;
    if (current.id === "_gender") return gender || undefined;
    if (current.type === "multichoice") return getMultiValue();
    return answers[current.id] as string | number | undefined;
  };

  const isSkipped = current ? skipped.has(current.id) : false;
  const value = getValue();
  const canContinue = (() => {
    if (!current || isSkipped) return true;
    if (current.type === "birthdate") return birthMonth > 0 && birthYear > 0;
    if (current.type === "text") {
      if (current.id === "_first_name") return firstName.trim().length > 0;
      return String((answers[current.id] as string | undefined) ?? "").trim().length > 0;
    }
    if (current.type === "multichoice") {
      const multi = getMultiValue();
      if (multi.length === 0) return false;
      if (multi.includes(OTHER_OPTION_VALUE)) {
        return String(answers[answerOtherKey(current.id)] ?? "").trim().length > 0;
      }
      return true;
    }
    if (current.type === "yesno") return value === "Oui" || value === "Non";
    return value !== undefined && value !== "";
  })();

  const copyRedemptionCode = async () => {
    if (!redemptionCode) return;
    try {
      await navigator.clipboard.writeText(redemptionCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      alert(redemptionCode);
    }
  };

  const submit = async () => {
    if (!quiz) return;
    setSubmitting(true);
    const code = hasGift ? generateRedemptionCode(quiz.id) : null;
    const { error } = await supabase.from("responses").insert({
      quiz_id: quiz.id,
      merchant_id: quiz.merchant_id,
      customer_first_name: firstName || null,
      customer_age: calculatedAge,
      customer_birth_month: birthMonth > 0 ? birthMonth : null,
      customer_birth_year: birthYear > 0 ? birthYear : null,
      customer_gender: gender || null,
      redemption_code: code,
      answers: answers as unknown as never,
    });
    setSubmitting(false);
    if (error) {
      alert("Erreur : " + error.message);
      return;
    }
    if (code) setRedemptionCode(code);
    setPhase("done");
    setTimeout(() => {
      confetti({
        particleCount: 180,
        spread: 90,
        origin: { y: 0.55 },
        colors: ["#FFD60A", "#111111", "#FF3B30"],
      });
    }, 150);
  };

  const handleContinue = () => {
    if (step < totalSteps - 1) goNext();
    else submit();
  };

  const handleSkip = () => {
    if (!current) return;
    setSkipped((s) => new Set(s).add(current.id));
    setAnimKey((k) => k + 1);
    if (step < totalSteps - 1) setStep((s) => s + 1);
    else submit();
  };

  const allowSkip = step >= PROFILE_STEPS.length;

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-white text-[#111111]">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-[#FFD60A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-white px-5 text-center text-[#111111]">
        <p>Ce quiz n'existe pas ou n'est plus actif.</p>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="quiz-themed min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center" style={themeStyle}>
        <p className="text-6xl mb-4">🎉</p>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">
          Félicitations {firstName} !
        </h1>
        {hasGift && redemptionCode ? (
          <>
            <p className="text-gray-500 mb-6 max-w-sm">
              Voici votre avantage de la part de <strong>{bizName}</strong>
            </p>
            <div className="w-full max-w-sm rounded-2xl bg-[#FFD60A] text-[#111111] px-6 py-8 shadow-[0_8px_0_#111111]">
              <p className="text-3xl sm:text-4xl font-black tracking-wider mb-4">{redemptionCode}</p>
              <button
                type="button"
                onClick={() => void copyRedemptionCode()}
                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#111111] text-[#FFD60A] font-bold text-sm hover:opacity-90 transition"
              >
                {codeCopied ? (
                  <>
                    <Check className="h-4 w-4" /> Copié !
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> 📋 Copier le code
                  </>
                )}
              </button>
            </div>
            <p className="mt-5 text-sm text-gray-500 max-w-xs">
              Montrez ce code à l'accueil pour bénéficier de votre avantage
            </p>
            {quiz.free_gift?.trim() && (
              <div className="w-full max-w-sm mt-6 rounded-2xl border-2 border-[#f0f0f0] bg-[#fafafa] px-6 py-5">
                <p className="text-4xl mb-2">🎁</p>
                <p className="text-lg font-bold leading-snug">{quiz.free_gift}</p>
              </div>
            )}
          </>
        ) : (
          <p className="text-gray-500 mb-8 max-w-sm leading-relaxed">
            Merci pour vos réponses ! Votre avis aide <strong>{bizName}</strong> à mieux vous servir.
          </p>
        )}
        <button
          type="button"
          onClick={() => window.close()}
          className="btn-quiz-continue max-w-sm mt-8"
        >
          J'ai compris ✓
        </button>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="quiz-themed min-h-[100dvh] flex flex-col" style={themeStyle}>
        <header className="px-5 pt-5 pb-2">
          <div className="inline-flex items-center gap-2 font-bold text-lg">
            <img src="/logo.png" alt="Scano" className="h-8 w-8 shrink-0" />
            {bizName}
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 pb-8 max-w-lg mx-auto w-full text-center">
          <p className="text-7xl mb-6">{hasGift ? "🎁" : "💬"}</p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            {hasGift ? "Une surprise vous attend" : "Votre avis compte"}
          </h1>
          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            Répondez à <strong>{questionCount + PROFILE_STEPS.length}</strong> questions rapides
            {hasGift ? " et découvrez votre avantage à la fin." : " pour nous aider à nous améliorer."}
          </p>

          {hasGift ? (
          <div className="w-full mb-8 p-5 rounded-2xl border-2 border-[#FFD60A]/40 bg-[#FFD60A]/10 text-center">
            <p className="text-xl font-bold">🎁 Une surprise vous attend à la fin</p>
            <p className="text-sm text-gray-500 mt-2">Complétez le quiz pour la découvrir</p>
          </div>
          ) : (
            <div className="w-full mb-8 p-5 rounded-2xl border-2 border-[#f0f0f0] bg-[#fafafa] text-left">
              <p className="font-bold mb-1">Quiz sans cadeau</p>
              <p className="text-sm text-gray-500">
                Vos réponses restent précieuses pour {bizName}. Merci de prendre 2 minutes pour nous aider.
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-1 text-[#FFD60A] mb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="h-5 w-5 fill-[#FFD60A]" />
            ))}
          </div>
          <p className="text-sm text-gray-500 mb-10">Déjà +500 clients satisfaits</p>

          <button
            type="button"
            onClick={() => {
              setPhase("questions");
              setStep(0);
            }}
            className="btn-quiz-continue max-w-sm"
          >
            {hasGift ? "Débloquer mon cadeau →" : "Commencer le quiz →"}
          </button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mt-4">
            <Lock className="h-3.5 w-3.5" /> Vos données restent privées
          </p>
        </main>
      </div>
    );
  }

  const isQuizQuestion = step >= PROFILE_STEPS.length;
  const displayStepNum = isQuizQuestion ? quizOnlyIndex + 1 : step + 1;
  const displayTotal = isQuizQuestion ? questionCount : PROFILE_STEPS.length;
  const stepLabel = isQuizQuestion
    ? `Question ${displayStepNum} / ${questionCount}`
    : `Étape ${displayStepNum} / ${PROFILE_STEPS.length}`;

  return (
    <div className="quiz-themed min-h-[100dvh] flex flex-col" style={themeStyle}>
      <header className="px-5 pt-4 pb-3 border-b quiz-footer">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="inline-flex items-center gap-2 font-bold text-base truncate">
            <img src="/logo.png" alt="Scano" className="h-8 w-8 shrink-0" />
            <span className="truncate">{bizName}</span>
          </div>
        </div>
        <QuizProgressBar percent={progressPercent} />
      </header>

      <main className="flex-1 flex flex-col px-5 py-6 max-w-lg mx-auto w-full overflow-hidden">
        <div key={animKey} className="quiz-slide-enter flex-1 flex flex-col">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{stepLabel}</p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 leading-tight">{current.label}</h2>
          {"businessLabel" in current && current.businessLabel && (
            <p className="text-xs font-medium text-gray-400 mb-2">{current.businessLabel}</p>
          )}
          <p className="text-sm text-gray-500 mb-6">{motivational}</p>

          <div className="flex-1 flex flex-col">
            {current.type === "text" && (
              <input
                autoFocus
                value={
                  current.id === "_first_name"
                    ? firstName
                    : String((answers[current.id] as string | undefined) ?? "")
                }
                onChange={(e) => setAns(e.target.value)}
                placeholder={current.id === "_first_name" ? "Votre prénom" : "Votre réponse…"}
                className="w-full px-5 py-5 text-xl rounded-2xl border-2 quiz-input outline-none"
              />
            )}

            {current.type === "birthdate" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={birthMonth || ""}
                    onChange={(e) => setBirthMonth(Number(e.target.value))}
                    className="w-full px-4 py-4 text-base rounded-2xl border-2 quiz-input outline-none"
                  >
                    <option value="">Mois</option>
                    {BIRTH_MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    value={birthYear || ""}
                    onChange={(e) => setBirthYear(Number(e.target.value))}
                    className="w-full px-4 py-4 text-base rounded-2xl border-2 quiz-input outline-none"
                  >
                    <option value="">Année</option>
                    {BIRTH_YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                {calculatedAge != null && birthMonth > 0 && birthYear > 0 && (
                  <p className="text-xs quiz-muted">Âge estimé : {calculatedAge} ans</p>
                )}
              </div>
            )}

            {current.type === "multichoice" && (
              <div className="space-y-3">
                <p className="text-xs text-gray-400 mb-1">Plusieurs réponses possibles</p>
                {(current.choiceCards ||
                  (current.options || []).map((opt) => ({
                    emoji: "•",
                    title: opt,
                    value: opt,
                  }))).map((card) => {
                  const c = card as ChoiceCard;
                  const selected = getMultiValue().includes(c.value);
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => toggleMulti(c.value)}
                      className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 quiz-card ${
                        selected ? "quiz-card--selected" : ""
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-sm font-bold ${
                            selected ? "quiz-card--selected" : ""
                          }`}
                          style={
                            selected
                              ? { borderColor: "var(--quiz-card-selected-border)", background: "var(--quiz-accent)" }
                              : undefined
                          }
                        >
                          {selected ? "✓" : ""}
                        </span>
                        {displayCardEmoji(c.emoji) && <span className="text-2xl">{c.emoji}</span>}
                        <div>
                          <p className="font-bold text-base sm:text-lg">{c.title}</p>
                          {c.subtitle && (
                            <p className="text-sm mt-0.5 text-gray-500">{c.subtitle}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {getMultiValue().includes(OTHER_OPTION_VALUE) && (
                  <input
                    autoFocus
                    value={String(answers[answerOtherKey(current.id)] ?? "")}
                    onChange={(e) =>
                      setAnswers((a) => ({
                        ...a,
                        [answerOtherKey(current.id)]: e.target.value,
                      }))
                    }
                    placeholder="Dites-nous ce qui ne va pas..."
                    className="w-full px-4 py-4 text-base rounded-2xl border-2 quiz-input outline-none mt-2"
                  />
                )}
              </div>
            )}

            {current.type === "choice" && (
              <div className="space-y-3">
                {(current.choiceCards ||
                  (current.options || []).map((opt) => ({
                    emoji: "•",
                    title: opt,
                    value: opt,
                  }))).map((card) => {
                  const c = card as ChoiceCard;
                  const selected = value === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setAns(c.value)}
                      className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 quiz-card ${
                        selected ? "quiz-card--selected shadow-[0_4px_0_0_var(--quiz-shadow)]" : ""
                      } ${profilePlainCards ? "text-center" : ""}`}
                    >
                      <div className={`flex items-start gap-4 ${profilePlainCards ? "justify-center" : ""}`}>
                        {displayCardEmoji(c.emoji) && (
                          <span className="text-2xl sm:text-3xl">{c.emoji}</span>
                        )}
                        <div>
                          <p className="font-bold text-base sm:text-lg">{c.title}</p>
                          {c.subtitle && !profilePlainCards && (
                            <p className="text-sm mt-0.5 quiz-muted">{c.subtitle}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {current.type === "rating" && (
              <div className="py-4">
                <p className="text-center text-sm text-gray-500 mb-3">
                  Note de 1 à {("ratingMax" in current && current.ratingMax) || 10}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                {Array.from(
                  { length: ("ratingMax" in current && current.ratingMax) || 10 },
                  (_, i) => i + 1,
                ).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAns(n)}
                    className={`h-11 w-11 sm:h-12 sm:w-12 rounded-xl border-2 flex items-center justify-center transition-all font-bold ${
                      Number(value) === n
                        ? "border-[#111111] bg-[#FFD60A] shadow-[0_2px_0_#111111]"
                        : "border-[#e5e5e5] bg-white text-gray-500"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                </div>
                {typeof value === "number" && value >= 1 && (() => {
                  const feedback = getRatingFeedbackCopy(value);
                  return (
                    <div className="mt-5 space-y-2">
                      <label className="text-sm font-medium quiz-muted block text-left">
                        {feedback.label}
                      </label>
                      <input
                        autoFocus
                        value={String(answers[answerWhyKey(current.id)] ?? "")}
                        onChange={(e) =>
                          setAnswers((a) => ({
                            ...a,
                            [answerWhyKey(current.id)]: e.target.value,
                          }))
                        }
                        placeholder={feedback.placeholder}
                        className="w-full px-4 py-4 text-base rounded-2xl border-2 quiz-input outline-none"
                      />
                    </div>
                  );
                })()}
              </div>
            )}

            {current.type === "yesno" && (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {(current.choiceCards || [
                  { emoji: "✅", title: "Oui", subtitle: "Absolument", value: "Oui" },
                  { emoji: "❌", title: "Non", subtitle: "Pas pour le moment", value: "Non" },
                ]).map((c) => {
                  const selected = value === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setAns(c.value)}
                      className={`p-6 sm:p-8 rounded-2xl border-2 font-bold transition-all ${
                        selected
                          ? "border-[#111111] bg-[#FFD60A] shadow-[0_4px_0_#111111]"
                          : "border-[#e5e5e5] bg-white"
                      }`}
                    >
                      {displayCardEmoji(c.emoji) && <span className="text-3xl block mb-2">{c.emoji}</span>}
                      <span className="text-xl">{c.title}</span>
                      {c.subtitle && (
                        <span className="block text-xs font-normal text-gray-500 mt-1">{c.subtitle}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {current.type === "yesno" && (value === "Oui" || value === "Non") && (
              <div className="mt-4 space-y-2">
                <label className="text-sm font-medium quiz-muted block">
                  Pourquoi ? (optionnel)
                </label>
                <input
                  value={String(answers[answerWhyKey(current.id)] ?? "")}
                  onChange={(e) =>
                    setAnswers((a) => ({
                      ...a,
                      [answerWhyKey(current.id)]: e.target.value,
                    }))
                  }
                  placeholder="En quelques mots…"
                  className="w-full px-4 py-4 text-base rounded-2xl border-2 quiz-input outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="sticky bottom-0 px-5 pb-6 pt-3 quiz-footer border-t max-w-lg mx-auto w-full">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue || submitting}
          className="btn-quiz-continue"
        >
          {submitting
            ? "Envoi en cours…"
            : step === totalSteps - 1
              ? hasGift
                ? "Terminer & recevoir mon cadeau 🎁"
                : "Terminer le quiz ✓"
              : "Continuer →"}
        </button>
        {allowSkip && (
          <button
            type="button"
            onClick={handleSkip}
            className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600 transition"
          >
            Passer cette question →
          </button>
        )}
      </footer>
    </div>
  );
}
