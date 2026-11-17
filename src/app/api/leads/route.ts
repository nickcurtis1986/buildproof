import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { sendEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/config";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const MAX_PER_IP_PER_HOUR = 5;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  // Honeypot: real people never see this field. Pretend success so bots move on.
  if (str(body.company_website, 200)) return NextResponse.json({ ok: true });

  const lead = {
    contractor_id: str(body.contractor_id, 64),
    video_id: str(body.video_id, 64) || null,
    name: str(body.name, 120),
    phone: str(body.phone, 30),
    email: str(body.email, 200) || null,
    zip_code: str(body.zip_code, 5),
    service_needed: str(body.service_needed, 120) || null,
    message: str(body.message, 2000) || null,
  };
  if (lead.name.length < 2) return NextResponse.json({ error: "Please add your name." }, { status: 400 });
  if (lead.phone.replace(/\D/g, "").length < 10) return NextResponse.json({ error: "Please add a phone number with area code." }, { status: 400 });
  if (!/^\d{5}$/.test(lead.zip_code)) return NextResponse.json({ error: "Please add a 5-digit ZIP code." }, { status: 400 });
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Quote requests aren't set up yet (missing server key)." }, { status: 503 });

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  const ip_hash = createHash("sha256").update(`${process.env.CRON_SECRET ?? "bp"}:${ip}`).digest("hex").slice(0, 32);

  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await admin.from("leads").select("id", { count: "exact", head: true }).eq("ip_hash", ip_hash).gte("created_at", since);
  if ((count ?? 0) >= MAX_PER_IP_PER_HOUR) {
    return NextResponse.json({ error: "Too many requests from this connection. Please try again in an hour." }, { status: 429 });
  }

  const { data: contractor } = await admin.from("contractors").select("id, business_name, email, status, is_demo").eq("id", lead.contractor_id).maybeSingle();
  if (!contractor || contractor.status !== "active") return NextResponse.json({ error: "This contractor isn't taking requests right now." }, { status: 404 });

  const supabase = await createClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  const { error } = await admin.from("leads").insert({ ...lead, homeowner_id: user?.id ?? null, ip_hash, status: "new" });
  if (error) {
    console.error("lead insert failed", error.message);
    return NextResponse.json({ error: "Couldn't send your request. Please try again." }, { status: 500 });
  }

  if (contractor.email && !contractor.is_demo) {
    await sendEmail({
      to: contractor.email,
      replyTo: lead.email ?? undefined,
      subject: `New quote request from ${lead.name} (${lead.zip_code})`,
      text: [
        `${lead.name} asked for a quote through BuildProof.`,
        "",
        `Phone: ${lead.phone}`,
        lead.email ? `Email: ${lead.email}` : null,
        `ZIP: ${lead.zip_code}`,
        lead.service_needed ? `Service: ${lead.service_needed}` : null,
        lead.message ? `\n${lead.message}` : null,
        "",
        `See all your leads: ${SITE_URL}/account`,
      ].filter((l) => l !== null).join("\n"),
    }).catch((e) => console.error("lead email failed", e));
  } else {
    console.log(`[lead] saved for ${contractor.business_name}${contractor.is_demo ? " (demo — no email sent)" : " (no contractor email on file)"}`);
  }
  return NextResponse.json({ ok: true });
}
