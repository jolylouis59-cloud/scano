import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

type WelcomePayload = {
  type: "welcome_signup";
  to: string;
  name?: string;
  businessName?: string;
};

type SubscriptionPayload = {
  type: "subscription_active";
  to: string;
  plan: string;
  businessName?: string;
};

type SendEmailPayload = WelcomePayload | SubscriptionPayload;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function welcomeHtml(payload: WelcomePayload): string {
  const recipient = payload.name?.trim() || payload.businessName?.trim() || "vous";
  return `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; color: #111111;">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom: 20px;">
        <img src="https://tryscano.com/logo.png" alt="Scano" width="32" height="32" />
        <strong style="font-size:20px;">Scano</strong>
      </div>
      <h1 style="font-size:24px; margin:0 0 12px;">Bienvenue sur Scano 👋</h1>
      <p style="font-size:16px; line-height:1.6; margin:0 0 16px;">
        Bonjour ${escapeHtml(recipient)}, votre compte est bien créé.
      </p>
      <p style="font-size:16px; line-height:1.6; margin:0 0 24px;">
        Pour activer votre dashboard complet, choisissez votre abonnement.
      </p>
      <a href="https://tryscano.com/pricing"
         style="display:inline-block; background:#FFD60A; color:#111111; text-decoration:none; font-weight:700; padding:12px 18px; border-radius:10px;">
        Choisir mon plan
      </a>
    </div>
  `;
}

function planLabel(plan: string): string {
  const p = plan.toLowerCase();
  if (p === "starter") return "Starter";
  if (p === "growth") return "Growth";
  if (p === "pro") return "Pro";
  return plan;
}

function subscriptionHtml(payload: SubscriptionPayload): string {
  const name = payload.businessName?.trim() || "Votre commerce";
  return `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; color: #111111;">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom: 20px;">
        <img src="https://tryscano.com/logo.png" alt="Scano" width="32" height="32" />
        <strong style="font-size:20px;">Scano</strong>
      </div>
      <h1 style="font-size:24px; margin:0 0 12px;">Votre abonnement Scano est actif ✅</h1>
      <p style="font-size:16px; line-height:1.6; margin:0 0 8px;">
        ${escapeHtml(name)}, votre plan <strong>${escapeHtml(planLabel(payload.plan))}</strong> est maintenant actif.
      </p>
      <p style="font-size:16px; line-height:1.6; margin:0 0 24px;">
        Vous pouvez accéder immédiatement à votre dashboard.
      </p>
      <a href="https://tryscano.com/dashboard"
         style="display:inline-block; background:#FFD60A; color:#111111; text-decoration:none; font-weight:700; padding:12px 18px; border-radius:10px;">
        Ouvrir mon dashboard
      </a>
    </div>
  `;
}

export async function sendTransactionalEmail(payload: SendEmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY manquant");
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL || "Scano <onboarding@resend.dev>";

  if (payload.type === "welcome_signup") {
    return resend.emails.send({
      from,
      to: payload.to,
      subject: "Bienvenue sur Scano 👋",
      html: welcomeHtml(payload),
    });
  }

  return resend.emails.send({
    from,
    to: payload.to,
    subject: "Votre abonnement Scano est actif ✅",
    html: subscriptionHtml(payload),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payload = req.body as SendEmailPayload;
    if (!payload?.to || !payload?.type) {
      return res.status(400).json({ error: "Payload email invalide" });
    }
    await sendTransactionalEmail(payload);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[send-email]", error);
    return res.status(500).json({ error: "Erreur envoi email" });
  }
}
