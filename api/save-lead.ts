import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

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

  const { email } = req.body as { email?: string };
  const normalized = email?.trim().toLowerCase() ?? "";

  if (!isValidEmail(normalized)) {
    return res.status(400).json({ error: "Email invalide" });
  }

  const admin = createClient(supabaseUrl, supabaseServiceRole);
  const { error } = await admin.from("leads").insert({ email: normalized });

  if (error) {
    console.error("[save-lead]", error.message);
    return res.status(500).json({ error: "Enregistrement impossible" });
  }

  return res.status(200).json({ ok: true });
}
