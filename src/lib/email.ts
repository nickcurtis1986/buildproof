/** Sends email through Resend if RESEND_API_KEY is set; otherwise prints it to the server console. */
export async function sendEmail(msg: { to: string; subject: string; text: string; replyTo?: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`\n[email:not-sent — no RESEND_API_KEY]\nTo: ${msg.to}\nSubject: ${msg.subject}\n\n${msg.text}\n`);
    return { sent: false };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "BuildProof <onboarding@resend.dev>",
      to: [msg.to],
      subject: msg.subject,
      text: msg.text,
      reply_to: msg.replyTo,
    }),
  });
  if (!res.ok) console.error("[email] Resend error", res.status, await res.text().catch(() => ""));
  return { sent: res.ok };
}
