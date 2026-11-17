import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import { getViewer } from "@/lib/supabase/server";
import { chooseRole } from "./actions";

export const metadata: Metadata = { title: "Welcome" };

export default async function Onboarding({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { user, profile } = await getViewer();
  if (!user) redirect("/login");
  if (profile?.role) redirect("/feed");
  const field = "min-h-12 w-full rounded-xl border-[1.5px] border-rule bg-white px-3.5 focus:border-ink focus:outline-none";
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-10">
      <Logo />
      <h1 className="mt-8 font-display text-3xl font-extrabold tracking-tight">Welcome to BuildProof</h1>
      <p className="mt-2 text-sm text-ink-3">Tell us a little about you. You can change this later.</p>
      <form action={chooseRole} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={sp.next ?? ""} />
        <div>
          <label htmlFor="o-name" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-3">Your name (optional)</label>
          <input id="o-name" name="full_name" defaultValue={profile?.full_name ?? ""} autoComplete="name" className={field} />
        </div>
        <div>
          <label htmlFor="o-zip" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-3">Your ZIP code (optional)</label>
          <input id="o-zip" name="zip_code" inputMode="numeric" pattern="\d{5}" maxLength={5} autoComplete="postal-code" className={field} />
        </div>
        <fieldset>
          <legend className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-3">I am a…</legend>
          <div className="grid grid-cols-2 gap-3">
            <button name="role" value="homeowner" className="min-h-14 rounded-xl bg-orange font-display text-base font-bold text-ink hover:bg-orange-h">Homeowner</button>
            <button name="role" value="contractor" className="min-h-14 rounded-xl border-[1.5px] border-ink bg-white font-display text-base font-bold hover:bg-sand">Contractor</button>
          </div>
        </fieldset>
      </form>
    </main>
  );
}
