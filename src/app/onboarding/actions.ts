"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function chooseRole(formData: FormData) {
  const role = formData.get("role");
  if (role !== "homeowner" && role !== "contractor") return;
  const supabase = await createClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!supabase || !user) redirect("/login");

  const name = String(formData.get("full_name") ?? "").trim().slice(0, 120) || null;
  const zip = String(formData.get("zip_code") ?? "").trim();
  await supabase.from("profiles").update({ role, full_name: name, zip_code: /^\d{5}$/.test(zip) ? zip : null }).eq("id", user.id);

  const n = String(formData.get("next") ?? "");
  redirect(role === "contractor" ? "/account" : n.startsWith("/") && !n.startsWith("//") ? n : "/feed");
}
