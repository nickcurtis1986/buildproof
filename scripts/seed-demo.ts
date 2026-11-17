/**
 * Adds 6 clearly labeled DEMO contractors and a few placeholder videos.
 * Run:   npm run seed:demo
 * Undo:  npm run clear:demo
 * Every row created here has is_demo = true and a "Demo —" name prefix.
 */
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });
export const DEMO_EMAIL = "demo-owner@buildproof.invalid";

const contractors = [
  { slug: "demo-ridgeline-roofing", business_name: "Demo — Ridgeline Roofing", categories: ["roofing"], city: "Cherry Hill", state: "NJ", zips: ["08002", "08003", "08034"], bio: "Sample profile for testing. Shingle and metal roofing." },
  { slug: "demo-summit-roof-works", business_name: "Demo — Summit Roof Works", categories: ["roofing"], city: "Voorhees", state: "NJ", zips: ["08043", "08053"], bio: "Sample profile for testing. Storm repair and replacements." },
  { slug: "demo-keystone-exteriors", business_name: "Demo — Keystone Exteriors", categories: ["roofing", "painting"], city: "Media", state: "PA", zips: ["19063", "19086"], bio: "Sample profile for testing. Roofing and exterior paint." },
  { slug: "demo-clearline-plumbing", business_name: "Demo — Clearline Plumbing", categories: ["plumbing"], city: "Haddonfield", state: "NJ", zips: ["08033", "08108"], bio: "Sample profile for testing. Repairs and water heaters." },
  { slug: "demo-northfield-remodeling", business_name: "Demo — Northfield Remodeling", categories: ["remodeling"], city: "Marlton", state: "NJ", zips: ["08053", "08054"], bio: "Sample profile for testing. Kitchens and baths." },
  { slug: "demo-greenway-landscapes", business_name: "Demo — Greenway Landscapes", categories: ["landscaping"], city: "King of Prussia", state: "PA", zips: ["19406"], bio: "Sample profile for testing. Patios and planting." },
];

const videos = [
  { c: 0, media: 1, title: "Demo video: roof replacement walkthrough", type: "walkthrough", zip: "08002" },
  { c: 0, media: 2, title: "Demo video: ridge vent install", type: "project", zip: "08034" },
  { c: 1, media: 3, title: "Demo video: storm damage repair", type: "before_after", zip: "08043" },
  { c: 2, media: 4, title: "Demo video: metal roof detail", type: "project", zip: "19063" },
  { c: 3, media: 5, title: "Demo video: water heater swap", type: "project", zip: "08033" },
  { c: 4, media: 6, title: "Demo video: kitchen before and after", type: "before_after", zip: "08053" },
  { c: 5, media: 1, title: "Demo video: paver patio", type: "project", zip: "19406" },
];

async function main() {
  // 1. A demo owner account (cannot receive email: .invalid domain)
  let ownerId: string | undefined;
  const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 });
  ownerId = list?.users.find((u) => u.email === DEMO_EMAIL)?.id;
  if (!ownerId) {
    const { data, error } = await db.auth.admin.createUser({ email: DEMO_EMAIL, email_confirm: true, user_metadata: { full_name: "Demo owner" } });
    if (error) throw error;
    ownerId = data.user.id;
  }
  await db.from("profiles").update({ role: "contractor" }).eq("id", ownerId);

  // 2. Upload placeholder media once
  for (let i = 1; i <= 6; i++) {
    const mp4 = readFileSync(join("scripts", "demo-media", `demo-${i}.mp4`));
    const jpg = readFileSync(join("scripts", "demo-media", `demo-${i}.jpg`));
    const a = await db.storage.from("videos").upload(`demo/demo-${i}.mp4`, mp4, { contentType: "video/mp4", upsert: true });
    const b = await db.storage.from("thumbnails").upload(`demo/demo-${i}.jpg`, jpg, { contentType: "image/jpeg", upsert: true });
    if (a.error || b.error) throw a.error ?? b.error;
  }

  // 3. Contractors + videos (no fake reviews, views, likes or ratings)
  const ids: string[] = [];
  for (const c of contractors) {
    const { data, error } = await db
      .from("contractors")
      .upsert(
        { owner_id: ownerId, slug: c.slug, business_name: c.business_name, bio: c.bio, categories: c.categories, service_zips: c.zips, city: c.city, state: c.state, status: "active", is_demo: true },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (error) throw error;
    ids.push(data.id);
  }
  await db.from("videos").delete().in("contractor_id", ids);
  const rows = videos.map((v) => ({
    contractor_id: ids[v.c],
    title: v.title,
    description: "Placeholder clip for testing the feed. Not real work.",
    video_type: v.type,
    category: contractors[v.c].categories[0],
    storage_path: `demo/demo-${v.media}.mp4`,
    thumbnail_path: `demo/demo-${v.media}.jpg`,
    duration_seconds: 8,
    zip_code: v.zip,
    city: contractors[v.c].city,
    status: "active",
    is_demo: true,
  }));
  const { error } = await db.from("videos").insert(rows);
  if (error) throw error;
  await db.rpc("recompute_rank_scores");
  console.log(`Seeded ${contractors.length} demo contractors and ${rows.length} demo videos. Remove them any time with: npm run clear:demo`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
