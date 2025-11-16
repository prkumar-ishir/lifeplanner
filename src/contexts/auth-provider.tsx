"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { isAuthApiError, type Session, type User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithPassword: (params: { email: string; password: string }) => Promise<void>;
  signUpWithPassword: (params: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(() => Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signInWithPassword = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      if (!supabase) {
        throw new Error("Supabase is not configured yet.");
      }
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        throw error;
      }
    },
    [supabase]
  );

  const signUpWithPassword = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      if (!supabase) {
        throw new Error("Supabase is not configured yet.");
      }

      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/signin` : undefined;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        ...(redirectTo
          ? {
              options: {
                emailRedirectTo: redirectTo,
              },
            }
          : {}),
      });

      if (error) {
        const isDuplicateSignup =
          isAuthApiError(error) &&
          ["identity_already_exists", "email_exists", "user_already_exists", "conflict"].includes(
            error.code ?? ""
          );

        if (isDuplicateSignup) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInError) {
            throw signInError;
          }
          return;
        }

        throw error;
      }
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signInWithPassword,
      signUpWithPassword,
      signOut,
    }),
    [loading, session, signInWithPassword, signOut, signUpWithPassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
