/**
 * Applique la migration SQL sur le projet Supabase distant.
 * Nécessite SUPABASE_DB_URL dans .env (Settings → Database → Connection string URI)
 * ou : npx supabase db push --project-ref iebbxvxnyjagkebkjfkk
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const envPath = resolve(root, ".env");
  if (!existsSync(envPath)) return {};
  const out = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0) out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

const env = loadEnv();
const dbUrl = process.env.SUPABASE_DB_URL || env.SUPABASE_DB_URL;

const sqlPath = resolve(root, "supabase/migrations/20250519000006_ensure_quiz_columns.sql");
const sql = readFileSync(sqlPath, "utf8");

async function runWithPg() {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query(sql);
  await client.query("NOTIFY pgrst, 'reload schema'");
  await client.end();
  console.log("Migration appliquée via PostgreSQL.");
}

async function runWithFetch() {
  const ref = (env.VITE_SUPABASE_URL || "").match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!ref || !serviceKey) return false;

  const res = await fetch(`https://${ref}.supabase.co/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  if (res.ok) {
    console.log("Migration via RPC exec_sql.");
    return true;
  }
  return false;
}

async function main() {
  if (dbUrl) {
    try {
      await runWithPg();
      return;
    } catch (e) {
      console.error("Erreur pg:", e.message);
    }
  }

  if (await runWithFetch()) return;

  console.log(`
Impossible d'appliquer automatiquement la migration.

Option A — Supabase Dashboard → SQL Editor, coller le fichier :
  supabase/migrations/20250519000006_ensure_quiz_columns.sql

Option B — CLI (avec mot de passe base) :
  npx supabase link --project-ref iebbxvxnyjagkebkjfkk
  npx supabase db push

Option C — Ajouter SUPABASE_DB_URL dans .env puis relancer :
  node scripts/apply-migration.mjs
`);
  process.exit(1);
}

main();
