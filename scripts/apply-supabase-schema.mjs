/**
 * Applique supabase/RUN_IN_DASHBOARD.sql sur le projet distant.
 *
 * Prérequis (une des options) :
 * - SUPABASE_ACCESS_TOKEN dans .env (token perso : https://supabase.com/dashboard/account/tokens)
 * - ou : npx supabase login puis npx supabase db query --linked -f supabase/RUN_IN_DASHBOARD.sql
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  for (const name of [".env", ".env.local"]) {
    try {
      const text = readFileSync(resolve(root, name), "utf8");
      for (const line of text.split("\n")) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (!m) continue;
        const key = m[1];
        let val = m[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      }
    } catch {
      /* ignore */
    }
  }
}

loadEnv();

const projectRef =
  process.env.SUPABASE_PROJECT_REF ||
  (process.env.VITE_SUPABASE_URL || "").replace(/^https?:\/\/([^.]+)\.supabase\.co\/?$/, "$1");

const token = process.env.SUPABASE_ACCESS_TOKEN;

if (!projectRef) {
  console.error("Impossible de déduire le project ref (VITE_SUPABASE_URL manquant).");
  process.exit(1);
}

if (!token) {
  console.error(
    "SUPABASE_ACCESS_TOKEN manquant.\n" +
      "1. Créez un token : https://supabase.com/dashboard/account/tokens\n" +
      "2. Ajoutez SUPABASE_ACCESS_TOKEN=... dans .env\n" +
      "3. Relancez : npm run db:apply-schema\n\n" +
      "Alternative : collez supabase/RUN_IN_DASHBOARD.sql dans Supabase → SQL Editor → Run.",
  );
  process.exit(1);
}

const sql = readFileSync(resolve(root, "supabase/RUN_IN_DASHBOARD.sql"), "utf8");

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: sql }),
});

const body = await res.text();
if (!res.ok) {
  console.error("Échec Management API", res.status, body);
  process.exit(1);
}

console.log("Migration appliquée sur", projectRef);
console.log(body || "(ok)");
