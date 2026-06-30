import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendTransactionalEmail, type SendEmailPayload } from "./_lib/transactional-email.js";

export { sendTransactionalEmail } from "./_lib/transactional-email.js";

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
