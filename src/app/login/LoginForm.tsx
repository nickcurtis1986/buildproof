"use client";
import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";

export default function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const supabase = getBrowserClient();
  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  if (!supabase) return <p className="text-sm text-ink-3">Sign-in needs the Supabase keys in .env.local (README step 3).</p>;

  async function emailLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setState("sending");
    const { error } = await supabase!.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } });
    if (error) { setError(error.message); setState("idle"); } else setState("sent");
  }

  async function google() {
    setError(null);
    const { error } = await supabase!.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } });
    if (error) setError(error.message);
  }

  if (state === "sent") {
    return (
      <div role="status" className="rounded-2xl border border-green/30 bg-green/10 p-5">
        <p className="font-bold text-green">Check your email</p>
        <p className="mt-1 text-sm text-ink-2">We sent a sign-in link to {email}. Open it on this device.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={google} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-rule-mid bg-white font-semibold hover:border-ink">
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.2l7.8 6C12.3 13.6 17.6 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.2z"/><path fill="#FBBC05" d="M10.4 28.8a14.5 14.5 0 0 1 0-9.6l-7.8-6a24 24 0 0 0 0 21.6z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.1 1.4-4.8 2.3-8.5 2.3-6.4 0-11.7-4.1-13.6-9.8l-7.8 6C6.6 42.6 14.6 48 24 48z"/></svg>
        Continue with Google
      </button>
      <div className="flex items-center gap-3 text-xs text-ink-3"><span className="h-px flex-1 bg-rule" />or<span className="h-px flex-1 bg-rule" /></div>
      <form onSubmit={emailLink} className="space-y-3">
        <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-wider text-ink-3">Email</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="min-h-12 w-full rounded-xl border-[1.5px] border-rule bg-white px-3.5 focus:border-ink focus:outline-none" />
        <button disabled={state === "sending"} className="min-h-12 w-full rounded-xl bg-orange font-display font-bold text-ink hover:bg-orange-h disabled:opacity-60">
          {state === "sending" ? "Sending…" : "Email me a sign-in link"}
        </button>
      </form>
      {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
    </div>
  );
}
