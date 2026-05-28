import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

interface Merchant {
  id: string;
  email: string;
  name: string | null;
  business_name: string | null;
  business_type: string | null;
  plan: string | null;
  objective: string | null;
  objective_target: string | null;
  objective_date: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  merchant: Merchant | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshMerchant: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMerchant = async (uid: string) => {
    const { data } = await supabase.from("merchants").select("*").eq("id", uid).maybeSingle();
    setMerchant(data as Merchant | null);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => fetchMerchant(s.user.id), 0);
      } else {
        setMerchant(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchMerchant(s.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshMerchant = async () => {
    if (user) await fetchMerchant(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, session, merchant, loading, signOut, refreshMerchant }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

