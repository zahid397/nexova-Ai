import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
}

interface AuthCtx {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(() => {
          supabase.from("profiles").select("*").eq("id", sess.user.id).maybeSingle()
            .then(({ data }) => setProfile(data as Profile | null));
        }, 0);
      } else {
        setProfile(null);
      }
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        supabase.from("profiles").select("*").eq("id", s.user.id).maybeSingle()
          .then(({ data }) => setProfile(data as Profile | null));
      }
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  };
  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name }, emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    return error ? { error: error.message } : {};
  };
  const signOut = async () => { await supabase.auth.signOut(); };

  return <Ctx.Provider value={{ user, session, profile, loading, signIn, signUp, signOut }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
}
