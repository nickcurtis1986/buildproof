import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoBadge, VerifiedBadge } from "@/components/Badges";
import { ArrowLeftIcon, PinIcon } from "@/components/icons";
import QuoteForm from "@/components/QuoteForm";
import SaveContractorButton from "@/components/SaveContractorButton";
import SetupNotice from "@/components/SetupNotice";
import { categoryLabel, VIDEO_TYPE_LABEL } from "@/lib/config";
import { getViewer } from "@/lib/supabase/server";
import type { Contractor, Video } from "@/lib/types";
import { thumbUrl, videoUrl } from "@/lib/video";

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug.replace(/-/g, " ") };
}

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n));

export default async function ContractorPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const sp = await searchParams;
  const { supabase, user } = await getViewer();
  if (!supabase) return <SetupNotice />;

  const { data: c } = await supabase.from("contractors").select("*").eq("slug", slug).maybeSingle<Contractor>();
  if (!c) notFound();

  const [{ data: vids }, { count: reviewCount }, saved] = await Promise.all([
    supabase.from("videos").select("*").eq("contractor_id", c.id).eq("status", "active").order("created_at", { ascending: false }),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("contractor_id", c.id).eq("status", "published"),
    user
      ? supabase.from("saved_contractors").select("contractor_id").eq("user_id", user.id).eq("contractor_id", c.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const videos = (vids ?? []) as Video[];
  const totalViews = videos.reduce((s, v) => s + v.view_count, 0);
  const videoId = videos.some((v) => v.id === sp.video) ? sp.video! : null;

  return (
    <main className="pb-nav">
      <div className="relative h-36 overflow-hidden bg-ink">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-size-[48px_48px]" />
        <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,92,26,.3),transparent_70%)]" />
        <Link href="/feed" className="absolute left-3 top-[max(12px,env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white" aria-label="Back to feed">
          <ArrowLeftIcon />
        </Link>
      </div>

      <div className="mx-auto max-w-5xl px-4">
        <div className="relative -mt-10 flex items-end gap-4">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-canvas bg-sand font-display text-3xl font-extrabold text-ink-2 shadow-lg">
            {c.business_name.replace(/^Demo\s*[—-]\s*/i, "").charAt(0)}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-extrabold tracking-tight">{c.business_name}</h1>
          {c.is_verified && <VerifiedBadge />}
          {c.is_demo && <DemoBadge />}
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-3">
          {c.categories.map(categoryLabel).join(" · ")}
          <span className="flex items-center gap-1"><PinIcon size={13} /> {[c.city, c.state].filter(Boolean).join(", ") || "Location not set"}</span>
        </p>
        {c.is_demo && (
          <p className="mt-3 rounded-xl border border-rule bg-sand p-3 text-sm text-ink-2">
            This is a demo profile for testing. It is not a real business, and quote requests to it go nowhere useful.
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <a href="#quote" className="inline-flex min-h-11 items-center rounded-xl bg-orange px-5 font-bold text-ink">Request a quote</a>
          <SaveContractorButton contractorId={c.id} initialSaved={!!saved.data} userId={user?.id ?? null} next={`/c/${c.slug}`} />
        </div>

        <dl className="mt-5 grid grid-cols-3 overflow-hidden rounded-2xl border border-rule bg-rule [&>div]:bg-white" style={{ gap: 1 }}>
          {[
            ["Videos", videos.length],
            ["Video views", fmt(totalViews)],
            ["Published reviews", reviewCount ?? 0],
          ].map(([k, v]) => (
            <div key={k} className="p-3 text-center">
              <dd className="font-display text-xl font-extrabold">{v}</dd>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">{k}</dt>
            </div>
          ))}
        </dl>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
          <section>
            {c.bio && <p className="mb-5 text-[15px] leading-relaxed text-ink-2">{c.bio}</p>}
            <h2 className="font-display text-lg font-bold">Project videos</h2>
            {videos.length ? (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {videos.map((v) => (
                  <figure key={v.id} className="overflow-hidden rounded-xl border border-rule bg-white">
                    <video src={videoUrl(v.storage_path) ?? undefined} poster={thumbUrl(v.thumbnail_path) ?? undefined} controls playsInline preload="none" className="aspect-[3/4] w-full bg-ink object-cover" />
                    <figcaption className="p-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-text">{VIDEO_TYPE_LABEL[v.video_type]}</span>
                      <p className="line-clamp-2 text-[13px] font-semibold">{v.title}</p>
                      <p className="text-xs text-ink-3">{v.view_count} views</p>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-ink-3">No videos posted yet.</p>
            )}
          </section>

          <aside id="quote" className="scroll-mt-4 rounded-2xl border-[1.5px] border-rule bg-white p-5 lg:sticky lg:top-4 lg:self-start">
            <h2 className="font-display text-xl font-extrabold">Request a free quote</h2>
            <p className="mb-4 mt-1 text-sm text-ink-3">Goes straight to {c.business_name}. Not sold to anyone.</p>
            <QuoteForm contractorId={c.id} contractorName={c.business_name} videoId={videoId} defaultCategory={categoryLabel(c.categories[0])} />
          </aside>
        </div>
      </div>
    </main>
  );
}
