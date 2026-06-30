/**
 * Alias de compatibilité : Stripe peut encore pointer vers /api/webhook.
 * Handler identique à /api/stripe-webhook.
 */
import stripeWebhookHandler from "./_lib/stripe-webhook-handler.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default stripeWebhookHandler;
