import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

type PlanId = "starter" | "growth" | "pro";

const PLAN_CONFIG: Record<PlanId, { priceId: string; label: string }> = {
  starter: { priceId: "price_1TbiZ3CoGC7y1zXTs3q8JpeX", label: "Starter" },
  growth: { priceId: "price_1TbiZjCoGC7y1zXTXWZKr6Gd", label: "Growth" },
  pro: { priceId: "price_1TbiaBCoGC7y1zXTs6iQmo3B", label: "Pro" },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return res.status(500).json({ error: "STRIPE_SECRET_KEY manquant" });

  const stripe = new Stripe(secretKey);
  const { plan, merchantId, email } = req.body as {
    plan?: PlanId;
    merchantId?: string;
    email?: string;
  };

  if (!plan || !(plan in PLAN_CONFIG)) {
    return res.status(400).json({ error: "Plan invalide" });
  }
  if (!merchantId || !email) {
    return res.status(400).json({ error: "merchantId et email requis" });
  }

  try {
    const origin = (req.headers.origin as string) || `https://${req.headers.host}`;
    const cfg = PLAN_CONFIG[plan];
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
      customer_email: email,
      metadata: {
        merchant_id: merchantId,
        plan,
      },
      line_items: [
        {
          price: cfg.priceId,
          quantity: 1,
        },
      ],
    });

    return res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error("[create-checkout-session]", error);
    return res.status(500).json({ error: "Erreur Stripe Checkout" });
  }
}
