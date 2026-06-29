import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { sendTransactionalEmail } from "./send-email";
import { evaluateQuizOutcome } from "../src/lib/quiz-response-outcome";
import type { Question } from "../src/lib/quiz-types";

const ALERT_WINDOW_MS = 3 * 60 * 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceRole =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRole) {
    return res.status(500).json({ error: "Supabase non configuré" });
  }

  const { merchantId, quizId } = req.body as { merchantId?: string; quizId?: string };

  if (!merchantId || !quizId) {
    return res.status(400).json({ error: "merchantId et quizId requis" });
  }

  const admin = createClient(supabaseUrl, supabaseServiceRole);

  const since = new Date(Date.now() - ALERT_WINDOW_MS).toISOString();

  const { data: response, error: responseError } = await admin
    .from("responses")
    .select("id, answers, completed_at")
    .eq("merchant_id", merchantId)
    .eq("quiz_id", quizId)
    .gte("completed_at", since)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (responseError) {
    console.error("[notify-merchant-alert] response lookup", responseError.message);
    return res.status(500).json({ error: "Impossible de charger la réponse" });
  }

  if (!response) {
    return res.status(404).json({ error: "Réponse introuvable ou expirée" });
  }

  const [{ data: quiz, error: quizError }, { data: merchant, error: merchantError }] =
    await Promise.all([
      admin.from("quizzes").select("questions").eq("id", quizId).maybeSingle(),
      admin
        .from("merchants")
        .select("email, business_name")
        .eq("id", merchantId)
        .maybeSingle(),
    ]);

  if (quizError || merchantError) {
    console.error("[notify-merchant-alert] lookup", quizError?.message, merchantError?.message);
    return res.status(500).json({ error: "Données commerce introuvables" });
  }

  if (!quiz || !merchant?.email) {
    return res.status(404).json({ error: "Commerce ou quiz introuvable" });
  }

  const questions = (quiz.questions as Question[]) || [];
  const answers = (response.answers as Record<string, unknown>) || {};
  const outcome = evaluateQuizOutcome(answers, questions);

  if (!outcome.triggerMerchantAlert || outcome.satisfactionRating == null) {
    return res.status(200).json({ ok: true, skipped: true });
  }

  try {
    await sendTransactionalEmail({
      type: "dissatisfied_response",
      to: merchant.email,
      businessName: merchant.business_name?.trim() || "Votre commerce",
      satisfactionRating: outcome.satisfactionRating,
      improvementText: outcome.improvementText,
      openText: outcome.openText,
    });
  } catch (error) {
    console.error("[notify-merchant-alert] email", error);
    return res.status(500).json({ error: "Erreur envoi email" });
  }

  return res.status(200).json({ ok: true });
}
