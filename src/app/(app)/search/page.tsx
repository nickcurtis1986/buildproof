import type { Metadata } from "next";
import ContractorCard from "@/components/ContractorCard";
import SetupNotice from "@/components/SetupNotice";
import { isCategory, isZip, orderedCategories } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import type { Contractor } from "@/lib/types";

export const metadata: Metadata = { title: "Find contractors" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const category = isCategory(sp.category) ? sp.category : null;
  const zip = isZip(sp.zip) ? sp.zip : null;
  const supabase = await createClient();
  if (!supabase) return <SetupNotice />;

  let query = supabase.from("contractors").select("*").eq("status", "active").order("rank_score", { ascending: false }).limit(40);
  if (q) query = query.ilike("business_name", `%${q.replace(/[%_,()]/g, " ")}%`);
  if (category) query = query.contains("categories", [category]);
  if (zip) query = query.contains("service_zips", [zip]);
  const { data } = await query;
  const results = (data ?? []) as Contractor[];

  const field = "min-h-12 w-full rounded-xl border-[1.5px] border-rule bg-white px-3.5 text-[15px] placeholder:text-ink-3 focus:border-ink focus:outline-none";
  return (
    <main className="pb-nav mx-auto max-w-2xl px-4 pt-[max(20px,env(safe-area-inset-top))]">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Find contractors</h1>
      <form className="mt-4 space-y-3" action="/search">
        <label className="sr-only" htmlFor="s-q">Business name</label>
        <input id="s-q" name="q" defaultValue={q} placeholder="Search by business name" className={field} />
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <label className="sr-only" htmlFor="s-zip">ZIP code</label>
          <input id="s-zip" name="zip" defaultValue={zip ?? ""} inputMode="numeric" pattern="\d{5}" maxLength={5} placeholder="ZIP code" className={field} />
          <button className="min-h-12 rounded-xl bg-orange px-5 font-bold text-ink">Search</button>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="radiogroup" aria-label="Service">
          {[{ id: "", label: "All" }, ...orderedCategories()].map((c) => (
            <label key={c.id} className="shrink-0 cursor-pointer">
              <input type="radio" name="category" value={c.id} defaultChecked={(category ?? "") === c.id} className="peer sr-only" />
              <span className="flex min-h-10 items-center rounded-full border border-rule bg-white px-3.5 text-[13px] font-semibold text-ink-2 peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline-3 peer-focus-visible:outline-orange-text">
                {c.label}
              </span>
            </label>
          ))}
        </div>
      </form>

      <p className="mt-6 text-sm text-ink-3">Ordered by verified reviews and real engagement — never by payment.</p>
      <div className="mt-3 grid gap-3">
        {results.map((c) => <ContractorCard key={c.id} c={c} />)}
      </div>
      {results.length === 0 && (
        <div className="py-16 text-center">
          <p className="font-display text-lg font-bold">No contractors found</p>
          <p className="mt-1 text-sm text-ink-3">Try a different name, another service, or remove the ZIP code.</p>
        </div>
      )}
    </main>
  );
}
