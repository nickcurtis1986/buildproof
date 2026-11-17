"use client";
import { useState } from "react";
import { orderedCategories } from "@/lib/config";

type Props = { contractorId: string; contractorName: string; videoId?: string | null; defaultCategory?: string };

export default function QuoteForm({ contractorId, contractorName, videoId, defaultCategory }: Props) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setState("sending");
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, contractor_id: contractorId, video_id: videoId ?? null }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Something went wrong. Please try again.");
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div role="status" className="py-6 text-center">
        <p className="font-display text-xl font-extrabold text-green">Request sent</p>
        <p className="mt-2 text-sm text-ink-3">
          {contractorName} gets your details directly and will contact you. We don&apos;t share them with anyone else.
        </p>
      </div>
    );
  }

  const field = "w-full min-h-11 rounded-xl border-[1.5px] border-rule bg-canvas px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none";
  const label = "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-3";
  return (
    <form onSubmit={onSubmit} className="space-y-3.5" noValidate={false}>
      {/* Honeypot: hidden from people, bots fill it in */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Company website<input name="company_website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div>
        <label className={label} htmlFor="q-name">Your name</label>
        <input id="q-name" name="name" required maxLength={120} autoComplete="name" className={field} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label} htmlFor="q-phone">Phone</label>
          <input id="q-phone" name="phone" type="tel" required autoComplete="tel" inputMode="tel" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="q-zip">ZIP code</label>
          <input id="q-zip" name="zip_code" required inputMode="numeric" pattern="\d{5}" maxLength={5} autoComplete="postal-code" className={field} />
        </div>
      </div>
      <div>
        <label className={label} htmlFor="q-email">Email (optional)</label>
        <input id="q-email" name="email" type="email" autoComplete="email" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="q-service">Service needed</label>
        <select id="q-service" name="service_needed" defaultValue={defaultCategory ?? ""} className={field}>
          <option value="">Choose a service…</option>
          {orderedCategories().map((c) => (
            <option key={c.id} value={c.label}>{c.label}</option>
          ))}
          <option value="Other">Other</option>
        </select>
      </div>
      <div>
        <label className={label} htmlFor="q-msg">About the job</label>
        <textarea id="q-msg" name="message" rows={3} maxLength={2000} placeholder="What needs doing, rough size, timeline…" className={field} />
      </div>
      {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={state === "sending"}
        className="min-h-12 w-full rounded-xl bg-orange font-display text-base font-bold text-ink transition hover:bg-orange-h disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : "Request a quote"}
      </button>
      <p className="text-center text-xs text-ink-3">Free, no obligation. Your details go only to {contractorName}.</p>
    </form>
  );
}
