import { supabase } from "@/integrations/supabase/client";

export type MerchantSignupInput = {
  email: string;
  password: string;
  name: string;
  businessName: string;
  businessType: string;
};

/**
 * Inscription sans envoi d'email (dev) via Admin API si VITE_SUPABASE_SERVICE_ROLE_KEY est défini.
 * Sinon signUp classique (nécessite « Confirm email » désactivé dans le dashboard Supabase).
 */
export async function signUpMerchant(input: MerchantSignupInput) {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string | undefined;

  if (import.meta.env.DEV && url && serviceKey) {
    const adminRes = await fetch(`${url}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        email_confirm: true,
        user_metadata: {
          name: input.name,
          business_name: input.businessName,
          business_type: input.businessType,
        },
      }),
    });

    if (!adminRes.ok) {
      const body = (await adminRes.json().catch(() => ({}))) as { msg?: string; message?: string };
      const msg = body.msg ?? body.message ?? adminRes.statusText;
      const alreadyExists =
        adminRes.status === 422 ||
        /already|registered|exists/i.test(msg);

      if (!alreadyExists) {
        return { error: new Error(msg), session: null };
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    return { error, session: data.session };
  }

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        name: input.name,
        business_name: input.businessName,
        business_type: input.businessType,
      },
    },
  });

  if (error?.message?.toLowerCase().includes("rate limit")) {
    const retry = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (!retry.error && retry.data.session) {
      return { error: null, session: retry.data.session };
    }
  }

  return { error, session: data.session };
}
