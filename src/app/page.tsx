export const dynamic = "force-dynamic";

import Link from "next/link";
import ContractorCard from "@/components/ContractorCard";
import { DemoBadge, VerifiedBadge } from "@/components/Badges";
import { PinIcon, PlayIcon, SearchIcon } from "@/components/icons";
import Logo from "@/components/Logo";
import { categoryLabel, LAUNCH_CATEGORY, LAUNCH_MARKET, MIN_PUBLIC_STAT, orderedCategories } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import type { Contractor, FeedVideo } from "@/lib/types";
import { thumbUrl } from "@/lib/video";

async function loadData() {
  const supabase = await createClient();
  if (!supabase) return { stats: [], hero: null, featured: [] as { c: Contractor; thumb: string | null }[] };
  const [contractors, videos, reviews, heroRes, topRes] = await Promise.all([
    supabase.from("contractors").select("id", { count: "exact", head: true }).eq("status", "active").eq("is_demo", false),
    supabase.from("videos").select("id", { count: "exact", head: true }).eq("status", "active").eq("is_demo", false),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "published").eq("is_verified", true),
    supabase.rpc("feed_videos", { p_category: null, p_zip: null, p_limit: 1, p_offset: 0 }),
    supabase.from("contractors").select("*").eq("status", "active").order("rank_score", { ascending: false }).limit(3),
  ]);
  // Real counts only, and only once they're big enough to mean something.
  const stats = [
    { n: contractors.count ?? 0, label: "Active contractors" },
    { n: videos.count ?? 0, label: "Project videos" },
    { n: reviews.count ?? 0, label: "Verified-job reviews" },
  ].filter((s) => s.n >= MIN_PUBLIC_STAT);

  const top = (topRes.data ?? []) as Contractor[];
  const { data: thumbs } = top.length
    ? await supabase.from("videos").select("contractor_id, thumbnail_path").in("contractor_id", top.map((c) => c.id)).eq("status", "active").order("created_at", { ascending: false })
    : { data: [] };
  const featured = top.map((c) => ({ c, thumb: thumbUrl(thumbs?.find((t) => t.contractor_id === c.id)?.thumbnail_path) }));
  return { stats, hero: ((heroRes.data ?? []) as FeedVideo[])[0] ?? null, featured };
}

const steps = [
  { n: "01", title: "Watch real work", body: "Scroll short videos of finished jobs from local contractors. See the quality before you pick up the phone." },
  { n: "02", title: "Check verified reviews", body: "A review marked “Verified job” came through an invite the contractor sent for a real, completed job." },
  { n: "03", title: "Request a quote", body: "Your request goes straight to the contractor you chose. We don't sell your details to anyone." },
];

const promises = [
  { title: "No paid placement", body: "Nobody can buy a higher spot, a badge or a featured slot. Ranking ignores money entirely." },
  { title: "Video first", body: "Contractors show finished jobs on video, so you can judge the work yourself." },
  { title: "Reviews tied to jobs", body: "Verified reviews come from job-specific invite links that work once and expire." },
  { title: "Local", body: `Built for ${LAUNCH_MARKET}, starting with ${categoryLabel(LAUNCH_CATEGORY).toLowerCase()}.` },
];

export default async function Home() {
  const { stats, hero, featured } = await loadData();
  return (
    <>
      <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-rule bg-canvas/90 px-4 backdrop-blur-lg sm:px-10">
        <Logo />
        <div className="flex items-center gap-1">
          <Link href="/search" className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-medium text-ink-3 hover:bg-sand hover:text-ink sm:flex">Browse contractors</Link>
          <Link href="#how-it-works" className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-medium text-ink-3 hover:bg-sand hover:text-ink sm:flex">How it works</Link>
          <Link href="/login" className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-medium text-ink-3 hover:bg-sand hover:text-ink md:flex">For contractors</Link>
          <Link href="/feed" className="flex min-h-11 items-center rounded-lg bg-ink px-4 text-sm font-semibold text-white hover:bg-ink-2">Watch videos</Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-16 pt-10 sm:px-10 lg:grid-cols-[1fr_420px] lg:pt-16">
        <div>
          <p className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-orange-text">
            <span className="h-px w-5 bg-orange" /> {LAUNCH_MARKET}
          </p>
          <h1 className="font-display text-[36px] font-extrabold leading-[0.98] min-[400px]:text-[42px] tracking-tight sm:text-7xl">
            Hire with<br />
            <span className="text-orange-text">video proof,</span>
            <span className="block text-transparent [-webkit-text-stroke:2px_var(--color-ink)]">not guesswork.</span>
          </h1>
          <p className="mt-6 max-w-md text-[17px] leading-relaxed text-ink-3">
            Watch short videos of real, finished jobs from local contractors before you hire. No paid rankings — ever.
          </p>

          <form action="/feed" className="mt-8 flex flex-col overflow-hidden rounded-2xl border-[1.5px] border-rule-mid bg-white shadow-lg focus-within:border-ink sm:flex-row">
            <label className="flex flex-1 items-center gap-2 border-b border-rule px-4 sm:border-b-0 sm:border-r">
              <PinIcon size={16} className="text-ink-3" />
              <span className="sr-only">ZIP code</span>
              <input name="zip" inputMode="numeric" pattern="\d{5}" maxLength={5} placeholder="ZIP code, e.g. 08002" className="min-h-13 w-full bg-transparent outline-none placeholder:text-ink-3" />
            </label>
            <label className="flex flex-[1.3] items-center gap-2 px-4">
              <SearchIcon size={16} className="text-ink-3" />
              <span className="sr-only">Service</span>
              <select name="category" defaultValue={LAUNCH_CATEGORY} className="min-h-13 w-full bg-transparent outline-none">
                <option value="">All services</option>
                {orderedCategories().map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </label>
            <button className="min-h-13 bg-orange px-6 font-display font-bold text-ink hover:bg-orange-h">Watch videos</button>
          </form>

          <div className="mt-5 flex flex-wrap gap-2">
            {orderedCategories().slice(0, 6).map((c) => (
              <Link key={c.id} href={`/feed?category=${c.id}`} className="flex min-h-10 items-center rounded-full border border-rule bg-sand px-3.5 text-[13px] font-medium text-ink-2 hover:border-ink hover:bg-ink hover:text-white">
                {c.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="relative hidden lg:block">
          {hero ? (
            <Link href="/feed" className="relative block aspect-[4/5] overflow-hidden rounded-3xl bg-ink shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {hero.thumbnail_path && <img src={thumbUrl(hero.thumbnail_path)!} alt="" className="h-full w-full object-cover opacity-80" />}
              <div className="absolute inset-0 bg-linear-to-t from-black/90 to-transparent to-60%" />
              <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 pl-1 text-white backdrop-blur"><PlayIcon size={22} /></span>
              <div className="absolute left-4 top-4 flex gap-1.5">
                <span className="rounded-md bg-orange px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink">Top of the feed</span>
                {hero.is_demo && <DemoBadge onDark />}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="flex items-center gap-2 font-display text-lg font-bold">{hero.contractor_name} {hero.contractor_verified && <VerifiedBadge onDark />}</p>
                <p className="text-sm text-white/70">{hero.title}</p>
              </div>
            </Link>
          ) : (
            <div className="flex aspect-[4/5] flex-col items-center justify-center rounded-3xl bg-ink p-10 text-center text-white">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-orange pl-1 text-ink"><PlayIcon size={22} /></span>
              <p className="mt-5 font-display text-xl font-bold">Project videos from local contractors appear here.</p>
              <p className="mt-2 text-sm text-white/60">We&apos;re just getting started.</p>
            </div>
          )}
        </div>
      </section>

      {stats.length > 0 && (
        <section className="border-y border-rule bg-white px-4 py-8 sm:px-10">
          <dl className="mx-auto grid max-w-7xl overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-3" style={{ gap: 1 }}>
            {stats.map((s) => (
              <div key={s.label} className="bg-white p-6 text-center">
                <dd className="font-display text-4xl font-extrabold tracking-tight">{s.n.toLocaleString()}</dd>
                <dt className="text-sm text-ink-3">{s.label}</dt>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section id="how-it-works" className="scroll-mt-16 bg-ink px-4 py-16 text-white sm:px-10 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-orange"><span className="h-px w-5 bg-orange" /> How it works</p>
          <h2 className="max-w-xl font-display text-4xl font-extrabold leading-none tracking-tight sm:text-5xl">Three steps to a contractor you can trust.</h2>
          <ol className="mt-12 grid overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-3" style={{ gap: 1 }}>
            {steps.map((s) => (
              <li key={s.n} className="relative bg-ink-2 p-8">
                <span className="absolute right-6 top-5 font-display text-6xl font-extrabold text-white/5" aria-hidden>{s.n}</span>
                <h3 className="font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-10 sm:py-20">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-orange-text"><span className="h-px w-5 bg-orange" /> Ranked by merit</p>
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Contractors near you</h2>
          </div>
          <Link href="/search" className="flex min-h-11 items-center text-sm font-semibold text-orange-text hover:underline">Browse all contractors →</Link>
        </div>
        {featured.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map(({ c, thumb }) => <ContractorCard key={c.id} c={c} thumb={thumb} />)}
          </div>
        ) : (
          <p className="rounded-2xl border border-rule bg-white p-6 text-ink-3">No contractors listed yet. Are you a contractor? <Link href="/login" className="font-semibold text-ink underline">Create your profile</Link>.</p>
        )}
      </section>

      <section className="border-y border-rule bg-sand px-4 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="max-w-2xl font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">Our promises, in plain words.</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {promises.map((p) => (
              <div key={p.title} className="rounded-2xl border border-rule bg-white p-5">
                <h3 className="font-bold">{p.title}</h3>
                <p className="mt-1 text-sm text-ink-3">{p.body}</p>
              </div>
            ))}
          </div>
          <Link href="/how-ranking-works" className="mt-6 inline-flex min-h-11 items-center font-semibold text-orange-text hover:underline">See exactly how ranking works →</Link>
        </div>
      </section>

      <section className="bg-ink px-4 py-16 text-center sm:px-10">
        <h2 className="mx-auto max-w-xl font-display text-4xl font-extrabold leading-tight tracking-tight text-white">Find a contractor you can <span className="text-orange">actually trust.</span></h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/feed" className="flex min-h-12 items-center rounded-xl bg-orange px-7 font-bold text-ink hover:bg-orange-h">Watch project videos</Link>
          <Link href="/login" className="flex min-h-12 items-center rounded-xl border border-white/20 bg-white/10 px-7 font-semibold text-white hover:bg-white/15">I&apos;m a contractor</Link>
        </div>
      </section>

      <footer className="flex flex-col gap-4 px-4 py-8 text-sm text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <Logo />
        <div className="flex flex-wrap gap-5">
          <Link href="/search" className="hover:text-ink">Browse contractors</Link>
          <Link href="/how-ranking-works" className="hover:text-ink">How ranking works</Link>
        </div>
        <p>© {new Date().getFullYear()} BuildProof</p>
      </footer>
    </>
  );
}
