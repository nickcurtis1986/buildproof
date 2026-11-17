/** Deletes everything created by seed-demo.ts. Run: npm run clear:demo */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  // Videos, events, leads and saves cascade from contractors.
  const { data, error } = await db.from("contractors").delete().eq("is_demo", true).select("id");
  if (error) throw error;
  await db.from("videos").delete().eq("is_demo", true);
  const files = Array.from({ length: 6 }, (_, i) => `demo/demo-${i + 1}`);
  await db.storage.from("videos").remove(files.map((f) => `${f}.mp4`));
  await db.storage.from("thumbnails").remove(files.map((f) => `${f}.jpg`));
  const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 });
  const demo = list?.users.find((u) => u.email === "demo-owner@buildproof.invalid");
  if (demo) await db.auth.admin.deleteUser(demo.id);
  console.log(`Removed ${data?.length ?? 0} demo contractors, their videos and the demo account.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
