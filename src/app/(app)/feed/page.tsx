import type { Metadata } from "next";
import Feed from "@/components/feed/Feed";
import SetupNotice from "@/components/SetupNotice";
import { isCategory, isZip } from "@/lib/config";
import { getViewer } from "@/lib/supabase/server";
import type { FeedVideo } from "@/lib/types";

export const metadata: Metadata = { title: "Feed" };

export default async function FeedPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const category = isCategory(sp.category) ? sp.category : null;
  const zip = isZip(sp.zip) ? sp.zip : null;
  const { supabase, user } = await getViewer();
  if (!supabase) return <SetupNotice />;

  const { data, error } = await supabase.rpc("feed_videos", { p_category: category, p_zip: zip, p_limit: 30, p_offset: 0 });
  if (error) console.error("feed_videos failed:", error.message);
  const videos = (data ?? []) as FeedVideo[];

  let likedIds: string[] = [];
  let savedIds: string[] = [];
  if (user && videos.length) {
    const { data: ev } = await supabase
      .from("video_events")
      .select("video_id, event")
      .eq("user_id", user.id)
      .in("event", ["like", "save"])
      .in("video_id", videos.map((v) => v.id));
    likedIds = (ev ?? []).filter((e) => e.event === "like").map((e) => e.video_id);
    savedIds = (ev ?? []).filter((e) => e.event === "save").map((e) => e.video_id);
  }

  return <Feed videos={videos} likedIds={likedIds} savedIds={savedIds} signedIn={!!user} category={category} zip={zip} />;
}
