"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/Logo";
import { DemoBadge, VerifiedBadge } from "@/components/Badges";
import { BookmarkIcon, HeartIcon, MutedIcon, PinIcon, PlayIcon, ShareIcon, SoundIcon } from "@/components/icons";
import { orderedCategories, VIDEO_TYPE_LABEL } from "@/lib/config";
import { getBrowserClient } from "@/lib/supabase/client";
import { getSessionId } from "@/lib/session";
import type { FeedVideo } from "@/lib/types";
import { thumbUrl, videoUrl } from "@/lib/video";

type Props = {
  videos: FeedVideo[];
  likedIds: string[];
  savedIds: string[];
  signedIn: boolean;
  category: string | null;
  zip: string | null;
};

function logEvent(videoId: string, event: "view" | "complete" | "share", pct?: number) {
  const supabase = getBrowserClient();
  if (!supabase) return;
  supabase
    .rpc("log_video_event", { p_video_id: videoId, p_session_id: getSessionId(), p_event: event, p_watch_pct: pct ?? null })
    .then(({ error }) => error && console.warn("event not logged", error.message));
}

export default function Feed({ videos, likedIds, savedIds, signedIn, category, zip }: Props) {
  const router = useRouter();
  const [muted, setMuted] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [zipOpen, setZipOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const on = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  function go(nextCategory: string | null, nextZip: string | null) {
    const p = new URLSearchParams();
    if (nextCategory) p.set("category", nextCategory);
    if (nextZip) p.set("zip", nextZip);
    const qs = p.toString();
    router.push(`/feed${qs ? `?${qs}` : ""}`);
  }

  const chip = (active: boolean) =>
    `shrink-0 min-h-9 rounded-full px-3.5 text-[13px] font-bold transition ${
      active ? "bg-orange text-ink" : "border border-white/20 bg-black/40 text-white/85 backdrop-blur"
    }`;

  return (
    <div className="relative h-dvh overflow-hidden bg-black text-white">
      <header className="absolute inset-x-0 top-0 z-20 bg-linear-to-b from-black/85 via-black/50 to-transparent px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex min-h-11 items-center gap-2" aria-label="BuildProof home">
            <LogoMark size={30} />
            <span className="font-display text-lg font-extrabold">BuildProof</span>
          </Link>
          <button
            onClick={() => setZipOpen((o) => !o)}
            aria-expanded={zipOpen}
            className="flex min-h-11 items-center gap-1.5 rounded-full bg-black/40 px-3 text-[13px] font-semibold text-white/90 backdrop-blur"
          >
            <PinIcon /> {zip ?? "Any ZIP"}
          </button>
        </div>
        {zipOpen && (
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const v = String(new FormData(e.currentTarget).get("zip") ?? "").trim();
              setZipOpen(false);
              go(category, /^\d{5}$/.test(v) ? v : null);
            }}
          >
            <label htmlFor="feed-zip" className="sr-only">ZIP code</label>
            <input
              id="feed-zip"
              name="zip"
              defaultValue={zip ?? ""}
              inputMode="numeric"
              pattern="\d{5}"
              maxLength={5}
              placeholder="ZIP code, e.g. 08002"
              className="min-h-11 flex-1 rounded-xl border border-white/20 bg-black/60 px-3 text-white placeholder:text-white/50"
              autoFocus
            />
            <button className="min-h-11 rounded-xl bg-orange px-4 font-bold text-ink">Apply</button>
            {zip && (
              <button type="button" onClick={() => { setZipOpen(false); go(category, null); }} className="min-h-11 rounded-xl border border-white/20 px-3 text-sm">
                Clear
              </button>
            )}
          </form>
        )}
        <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4" role="group" aria-label="Filter by service">
          <button className={chip(!category)} aria-pressed={!category} onClick={() => go(null, zip)}>All</button>
          {orderedCategories().map((c) => (
            <button key={c.id} className={chip(category === c.id)} aria-pressed={category === c.id} onClick={() => go(c.id, zip)}>
              {c.label}
            </button>
          ))}
        </div>
      </header>

      <div className="no-scrollbar h-full snap-y snap-mandatory overflow-y-scroll">
        {videos.map((v) => (
          <FeedItem
            key={v.id}
            video={v}
            muted={muted}
            onToggleMute={() => setMuted((m) => !m)}
            autoplay={!reduceMotion}
            initialLiked={likedIds.includes(v.id)}
            initialSaved={savedIds.includes(v.id)}
            signedIn={signedIn}
          />
        ))}
        {videos.length === 0 && (
          <div className="flex h-full snap-start flex-col items-center justify-center px-8 text-center">
            <p className="font-display text-xl font-bold">No videos here yet</p>
            <p className="mt-2 max-w-xs text-sm text-white/70">
              {zip ? "No videos in this area yet. Try a nearby ZIP or clear the ZIP filter." : category ? "Nobody has posted in this category yet. Try another service." : "Contractors haven't posted videos yet. Check back soon."}
            </p>
            {(zip || category) && (
              <button onClick={() => go(null, null)} className="mt-5 min-h-11 rounded-xl bg-orange px-5 font-bold text-ink">
                Show all videos
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FeedItem({
  video, muted, onToggleMute, autoplay, initialLiked, initialSaved, signedIn,
}: {
  video: FeedVideo; muted: boolean; onToggleMute: () => void; autoplay: boolean;
  initialLiked: boolean; initialSaved: boolean; signedIn: boolean;
}) {
  const router = useRouter();
  const wrap = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const logged = useRef({ view: false, complete: false });
  const [liked, setLiked] = useState(initialLiked);
  const [saved, setSaved] = useState(initialSaved);
  const [likes, setLikes] = useState(video.like_count);
  const [saves, setSaves] = useState(video.save_count);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = vid.current;
    if (!el) return;
    if (visible && autoplay) el.play().catch(() => setPlaying(false));
    else el.pause();
  }, [visible, autoplay]);

  useEffect(() => {
    if (vid.current) vid.current.muted = muted;
  }, [muted]);

  function onTime() {
    const el = vid.current;
    if (!el) return;
    if (!logged.current.view && el.currentTime >= 2) {
      logged.current.view = true;
      logEvent(video.id, "view");
    }
    if (!logged.current.complete && el.duration && el.currentTime / el.duration >= 0.95) {
      logged.current.complete = true;
      logEvent(video.id, "complete", 100);
    }
  }

  function onTap() {
    const el = vid.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else onToggleMute();
  }

  async function react(kind: "like" | "save") {
    const supabase = getBrowserClient();
    if (!signedIn || !supabase) return router.push(`/login?next=${encodeURIComponent("/feed")}`);
    const was = kind === "like" ? liked : saved;
    (kind === "like" ? setLiked : setSaved)(!was);
    (kind === "like" ? setLikes : setSaves)((n) => n + (was ? -1 : 1));
    const { data, error } = await supabase.rpc("toggle_reaction", { p_video_id: video.id, p_event: kind });
    if (error || data === was) {
      (kind === "like" ? setLiked : setSaved)(was);
      (kind === "like" ? setLikes : setSaves)((n) => n + (was ? 1 : -1));
    }
  }

  async function share() {
    const url = `${window.location.origin}/c/${video.contractor_slug}`;
    try {
      if (navigator.share) await navigator.share({ title: video.title, url });
      else await navigator.clipboard.writeText(url);
      logEvent(video.id, "share");
    } catch {
      /* dismissed */
    }
  }

  const src = videoUrl(video.storage_path) ?? undefined;
  const poster = thumbUrl(video.thumbnail_path) ?? undefined;
  const isReview = video.video_type === "review";
  const rail = "flex min-h-11 min-w-11 flex-col items-center gap-1 text-xs font-bold";
  const bubble = (on: boolean) => `flex h-12 w-12 items-center justify-center rounded-full backdrop-blur ${on ? "bg-white/25" : "bg-black/45"}`;

  return (
    <section ref={wrap} className="relative h-dvh w-full snap-start overflow-hidden bg-black" aria-label={`${video.title} by ${video.contractor_name}`}>
      <video
        ref={vid}
        src={src}
        poster={poster}
        muted
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={onTime}
        onEnded={() => {
          const el = vid.current;
          if (el && visible && autoplay) { el.currentTime = 0; el.play().catch(() => {}); }
        }}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <button onClick={onTap} className="absolute inset-0 z-0 h-full w-full cursor-pointer" aria-label={playing ? (muted ? "Turn sound on" : "Turn sound off") : "Play video"} />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/90 via-black/10 to-black/30" />

      {!playing && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 pl-1">
          <PlayIcon />
        </div>
      )}
      <div className="pointer-events-none absolute left-4 top-[calc(128px+env(safe-area-inset-top))] flex gap-1.5">
        <span className={`rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wider ${isReview ? "bg-green text-white" : "bg-orange text-ink"}`}>
          {VIDEO_TYPE_LABEL[video.video_type]}
        </span>
        {video.is_demo && <DemoBadge onDark />}
      </div>
      {playing && (
        <span className="pointer-events-none absolute right-4 top-[calc(128px+env(safe-area-inset-top))] flex h-9 w-9 items-center justify-center rounded-full bg-black/50" aria-hidden>
          {muted ? <MutedIcon size={18} /> : <SoundIcon size={18} />}
        </span>
      )}

      <div className="absolute bottom-[calc(190px+env(safe-area-inset-bottom))] right-3 z-10 flex flex-col items-center gap-4">
        <button className={rail} onClick={() => react("like")} aria-pressed={liked} aria-label={liked ? "Unlike" : "Like"}>
          <span className={bubble(liked)}><HeartIcon filled={liked} className={liked ? "text-orange" : ""} /></span>{likes}
        </button>
        <button className={rail} onClick={() => react("save")} aria-pressed={saved} aria-label={saved ? "Remove from saved" : "Save video"}>
          <span className={bubble(saved)}><BookmarkIcon filled={saved} /></span>{saves}
        </button>
        <button className={rail} onClick={share} aria-label="Share contractor">
          <span className={bubble(false)}><ShareIcon /></span>Share
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-[calc(84px+env(safe-area-inset-bottom))]">
        <Link href={`/c/${video.contractor_slug}`} className="mb-2 inline-flex min-h-11 items-center gap-2 pr-16">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-orange bg-ink-2 font-display font-bold">
            {video.contractor_name.replace(/^Demo\s*[—-]\s*/i, "").charAt(0)}
          </span>
          <span>
            <span className="flex flex-wrap items-center gap-1.5 font-bold leading-tight">
              {video.contractor_name}
              {video.contractor_verified && <VerifiedBadge onDark />}
            </span>
            <span className="flex items-center gap-1 text-xs text-white/70">
              <PinIcon size={12} /> {video.city ?? video.contractor_city ?? "Local"} · {video.view_count} views
            </span>
          </span>
        </Link>
        <h2 className="pr-16 text-base font-bold leading-snug">{video.title}</h2>
        {video.description && <p className="mt-1 line-clamp-2 pr-16 text-sm text-white/75">{video.description}</p>}
        <Link
          href={`/c/${video.contractor_slug}?video=${video.id}#quote`}
          className="mt-3 flex min-h-12 w-full items-center justify-center rounded-xl bg-orange font-display text-base font-bold text-ink"
        >
          Request a quote
        </Link>
      </div>
    </section>
  );
}
