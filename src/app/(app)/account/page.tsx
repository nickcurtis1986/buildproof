export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import SetupNotice from "@/components/SetupNotice";
import { getViewer } from "@/lib/supabase/server";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const { supabase, user, profile } = await getViewer();
  if (!supabase) return <SetupNotice />;
  const wrap = "pb-nav mx-auto max-w-2xl px-4 pt-[max(20px,env(safe-area-inset-top))]";
  if (!user) {
    return (
      <main className={wrap}>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Your account</h1>
        <div className="mt-8 rounded-2xl border border-rule bg-white p-6 text-center">
          <p className="font-semibold">Sign in to save contractors, like videos and track your quote requests.</p>
          <Link href="/login?next=/account" className="mt-4 inline-flex min-h-12 items-center rounded-xl bg-orange px-6 font-bold text-ink">Sign in</Link>
        </div>
      </main>
    );
  }
  const isContractor = profile?.role === "contractor";
  return (
    <main className={wrap}>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">{isContractor ? "Dashboard" : "Your account"}</h1>
      <div className="mt-6 rounded-2xl border border-rule bg-white p-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-3">Signed in as</p>
        <p className="mt-1 font-semibold">{profile?.full_name || user.email}</p>
        <p className="text-sm text-ink-3">{user.email} · {profile?.role ?? "no role yet"}</p>
      </div>
      {isContractor && (
        <div className="mt-4 rounded-2xl border border-orange/40 bg-orange/10 p-5">
          <p className="font-display text-lg font-bold">Contractor tools are on the way</p>
          <p className="mt-1 text-sm text-ink-2">Business profile setup, video uploads and your leads dashboard are coming next.</p>
        </div>
      )}
      <form action={signOut} className="mt-6">
        <button className="min-h-12 w-full rounded-xl border-[1.5px] border-rule-mid bg-white font-semibold text-ink-2 hover:border-ink">Sign out</button>
      </form>
      <p className="mt-6 text-center text-sm"><Link className="underline" href="/how-ranking-works">How ranking works</Link></p>
    </main>
  );
}
