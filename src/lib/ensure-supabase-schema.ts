import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

let schemaChecked = false;

/**
 * Applique les colonnes manquantes via RPC scano_ensure_schema (après 1er run SQL Dashboard),
 * puis force un SELECT * pour rafraîchir le cache PostgREST côté client.
 */
export async function ensureSupabaseSchema(): Promise<boolean> {
  if (!isSupabaseConfigured || schemaChecked) return schemaChecked;

  const { error: rpcError } = await supabase.rpc("scano_ensure_schema");
  if (rpcError) {
    console.warn(
      "[Scano] Schéma Supabase : exécutez supabase/RUN_IN_DASHBOARD.sql dans le SQL Editor, ou `npm run db:apply-schema` avec SUPABASE_ACCESS_TOKEN.",
      rpcError.message,
    );
  }

  const { error: quizError } = await supabase.from("quizzes").select("*").limit(1);
  const { error: responsesError } = await supabase.from("responses").select("*").limit(1);

  if (!quizError && !responsesError) {
    schemaChecked = true;
    return true;
  }

  if (quizError) console.warn("[Scano] Cache quizzes :", quizError.message);
  if (responsesError) console.warn("[Scano] Cache responses :", responsesError.message);
  return false;
}
