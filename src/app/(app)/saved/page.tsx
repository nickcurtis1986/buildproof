export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import ContractorCard from "@/components/ContractorCard";
import SetupNotice from "@/components/SetupNotice";
import { getViewer } from "@/lib/supabase/server";
import type { Contractor, Video } from "@/lib/types";
import { thumbUrl } from "@/lib/video";

export const metadata: Metadata = { title: "Saved" };

export default async function SavedPage() {
  const { supabase, user } = await getViewer();
  if (!supabase) return <SetupNotice />;
  if (!user) {
    return (
      <main className="pb-nav mx-auto max-w-2xl px-4 pt-[max(20px,env(safe-area-inset-top))]">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Saved</h1>
        <div className="mt-8 rounded-2xl border border-rule bg-white p-6 text-center">
          <p className="font-semibold">Sign in to keep a shortlist of contractors and videos.</p>
          <Link href="/login?next=/saved" className="mt-4 inline-flex min-h-12 items-center rounded-xl bg-orange px-6 font-bold text-ink">Sign in</Link>
        </div>
      </main>
    );
  }

  const [{ data: savedC }, { data: savedV }] = await Promise.all([
    supabase.from("saved_contractors").select("contractor:contractors(*)").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("video_events").select("video:videos(id,title,thumbnail_path,contractor:contractors(slug,business_name))").eq("user_id", user.id).eq("event", "save").order("created_at", { ascending: false }),
  ]);
  const contractors = (savedC ?? []).map((r) => r.contractor as unknown as Contractor).filter(Boolean);
  type SV = Pick<Video, "id" | "title" | "thumbnail_path"> & { contractor: { slug: string; business_name: string } | null };
  const videos = (savedV ?? []).map((r) => r.video as unknown as SV).filter(Boolean);

  return (
    <main className="pb-nav mx-auto max-w-2xl px-4 pt-[max(20px,env(safe-area-inset-top))]">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Saved</h1>

      <h2 className="mt-6 font-display text-lg font-bold">Contractors</h2>
      {contractors.length ? (
        <div className="mt-3 grid gap-3">{contractors.map((c) => <ContractorCard key={c.id} c={c} />)}</div>
      ) : (
        <p className="mt-2 text-sm text-ink-3">None yet. Open a contractor&apos;s profile and tap &ldquo;Save contractor&rdquo;.</p>
      )}

      <h2 className="mt-8 font-display text-lg font-bold">Videos</h2>
      {videos.length ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {videos.map((v) => (
            <Link key={v.id} href={`/c/${v.contractor?.slug ?? ""}`} className="overflow-hidden rounded-xl border border-rule bg-white">
              <div className="aspect-[3/4] bg-sand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {v.thumbnail_path && <img src={thumbUrl(v.thumbnail_path)!} alt="" className="h-full w-full object-cover" />}
              </div>
              <p className="line-clamp-2 p-2 text-[13px] font-semibold">{v.title}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-ink-3">None yet. Tap the bookmark on any video in the feed.</p>
      )}
    </main>
  );
}
