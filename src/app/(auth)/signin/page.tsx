"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-provider";

export default function SignInPage() {
  const router = useRouter();
  const { user, signInWithPassword, signUpWithPassword } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isSignup = mode === "signup";
  const passwordsMismatch =
    isSignup &&
    confirmPassword.length > 0 &&
    password.length > 0 &&
    confirmPassword !== password;

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [router, user]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      if (mode === "signin") {
        await signInWithPassword({ email, password });
        setMessage("Welcome back! Redirecting…");
      } else {
        if (passwordsMismatch) {
          setStatus("error");
          setMessage("Passwords must match.");
          return;
        }
        await signUpWithPassword({ email, password });
        setMessage(
          "Account created. Redirecting you now—check your inbox only if your project still requires confirmation."
        );
      }
      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Something went wrong. Try again."
      );
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500">
        ← Back to home
      </Link>
      <div className="glass-panel space-y-6 p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            {mode === "signin" ? "Sign in to Life Planner" : "Start your planner"}
          </h1>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-700">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-700">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
          </label>
          {isSignup && (
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-700">
                Confirm password
              </span>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`rounded-xl border px-4 py-3 text-sm ${
                  passwordsMismatch ? "border-rose-400" : "border-slate-200"
                }`}
              />
              {passwordsMismatch && (
                <span className="text-xs font-medium text-rose-600">
                  Passwords must match.
                </span>
              )}
            </label>
          )}

          <button
            type="submit"
            disabled={status === "loading" || passwordsMismatch}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait"
          >
            {status === "loading"
              ? "Please wait…"
              : mode === "signin"
              ? "Sign in"
              : "Create account"}
          </button>
        </form>

        {message && (
          <p
            className={`text-sm ${
              status === "error" ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {message}
          </p>
        )}

        <button
          type="button"
          className="text-sm font-semibold text-slate-600 underline-offset-4 hover:underline"
          onClick={() => {
            setMode((prev) => (prev === "signin" ? "signup" : "signin"));
            setStatus("idle");
            setMessage("");
            setConfirmPassword("");
          }}
        >
          {mode === "signin"
            ? "Need an account? Sign up."
            : "Already have an account? Sign in."}
        </button>
      </div>
    </main>
  );
}
