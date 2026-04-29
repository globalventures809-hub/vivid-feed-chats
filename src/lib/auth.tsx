import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  id: string;
  username: string | null;
  name: string | null;
  bio: string | null;
  photo_url: string | null;
  cover_url: string | null;
  country: string | null;
  location: string | null;
  setup_complete: boolean;
  verified?: boolean | null;
  verified_until?: string | null;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const PROFILE_CACHE_KEY = "verde:profile:v1";

function readCachedProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

function writeCachedProfile(p: Profile | null) {
  if (typeof window === "undefined") return;
  try {
    if (p) window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(p));
    else window.localStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(() => readCachedProfile());
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    const p = (data as Profile) ?? null;
    setProfile(p);
    writeCachedProfile(p);
  };

  useEffect(() => {
    // Set listener BEFORE getSession (per Lovable Cloud guidance)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        // defer to avoid deadlock — non-blocking
        setTimeout(() => loadProfile(sess.user.id), 0);
      } else {
        setProfile(null);
        writeCachedProfile(null);
      }
    });

    // Don't block UI on profile fetch — release loading as soon as session is known.
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setLoading(false);
      if (sess?.user) {
        // refresh profile in background; cached profile shows immediately
        loadProfile(sess.user.id);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    refreshProfile: async () => {
      if (session?.user) await loadProfile(session.user.id);
    },
    signOut: async () => {
      writeCachedProfile(null);
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
