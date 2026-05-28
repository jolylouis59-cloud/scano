import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendTransactionalEmail } from "./send-email";

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceRole =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!secretKey || !webhookSecret || !supabaseUrl || !supabaseServiceRole) {
    return res.status(500).json({
      error:
        "Variables manquantes: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY",
    });
  }

  const stripe = new Stripe(secretKey);
  const rawBody = await readRawBody(req);
  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    return res.status(400).json({ error: "Signature Stripe manquante" });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe-webhook] signature error", err);
    return res.status(400).json({ error: "Invalid signature" });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const merchantId = session.metadata?.merchant_id;
      const plan = session.metadata?.plan?.toLowerCase();

      if (
        merchantId &&
        plan &&
        (plan === "starter" || plan === "growth" || plan === "pro")
      ) {
        const admin = createClient(supabaseUrl, supabaseServiceRole);
        const { data: merchant, error } = await admin
          .from("merchants")
          .update({ plan })
          .eq("id", merchantId)
          .select("email, business_name, plan")
          .maybeSingle();
        if (error) {
          console.error("[stripe-webhook] supabase update failed", error.message);
          return res.status(500).json({ error: "Supabase update failed" });
        }

        const to =
          (merchant as { email?: string | null } | null)?.email ||
          session.customer_details?.email ||
          session.customer_email ||
          null;
        if (to) {
          await sendTransactionalEmail({
            type: "subscription_active",
            to,
            plan,
            businessName: (merchant as { business_name?: string | null } | null)?.business_name || undefined,
          });
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("[stripe-webhook] handler error", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}
