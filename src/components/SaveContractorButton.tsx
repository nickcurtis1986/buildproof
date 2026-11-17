"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import { BookmarkIcon } from "./icons";

export default function SaveContractorButton({ contractorId, initialSaved, userId, next }: { contractorId: string; initialSaved: boolean; userId: string | null; next: string }) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function toggle() {
    const supabase = getBrowserClient();
    if (!userId || !supabase) return router.push(`/login?next=${encodeURIComponent(next)}`);
    setBusy(true);
    const { error } = saved
      ? await supabase.from("saved_contractors").delete().eq("user_id", userId).eq("contractor_id", contractorId)
      : await supabase.from("saved_contractors").insert({ user_id: userId, contractor_id: contractorId });
    if (!error) setSaved(!saved);
    setBusy(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      className={`inline-flex min-h-11 items-center gap-2 rounded-xl border-[1.5px] px-4 text-sm font-semibold transition ${
        saved ? "border-green bg-green/10 text-green" : "border-rule-mid bg-white text-ink-2 hover:border-ink"
      }`}
    >
      <BookmarkIcon size={18} filled={saved} />
      {saved ? "Saved" : "Save contractor"}
    </button>
  );
}
