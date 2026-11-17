import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata: Metadata = { title: "How ranking works" };

const rows = [
  ["Verified-job reviews", "3.0 points each", "Reviews left through a contractor's one-time invite link for a real job"],
  ["Other published reviews", "1.0 point each", "Reviews that passed moderation but didn't come through an invite"],
  ["Video views", "1.5 points per 1,000", "One view per browser per video per day"],
  ["Likes", "2.0 points each", "One per signed-in person per video"],
  ["Saves", "2.5 points each", "One per signed-in person per video"],
  ["Completion rate", "Up to 10 points", "Share of views that watched to the end, divided by 10"],
  ["Newcomer boost", "Up to 5 points", "Fades to zero over a contractor's first 60 days so new businesses can be seen"],
];

export default function HowRankingWorks() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Logo />
      <h1 className="mt-8 font-display text-4xl font-extrabold tracking-tight">How ranking works</h1>
      <p className="mt-4 rounded-2xl border border-green/30 bg-green/10 p-4 font-semibold text-ink">
        Nothing on BuildProof can be bought. There are no ads, no sponsored spots and no paid boosts. A paid plan, if we ever offer one, will never change where anyone appears.
      </p>
      <p className="mt-6 text-ink-2">The feed and search results are ordered by a score worked out from reviews and how real people engage with a contractor&apos;s videos. Then newer videos come first.</p>
      <div className="mt-6 overflow-hidden rounded-2xl border border-rule bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand text-[11px] uppercase tracking-wider text-ink-3"><tr><th className="p-3">Signal</th><th className="p-3">Weight</th></tr></thead>
          <tbody>
            {rows.map(([s, w, d]) => (
              <tr key={s} className="border-t border-rule align-top">
                <td className="p-3"><p className="font-semibold">{s}</p><p className="text-xs text-ink-3">{d}</p></td>
                <td className="whitespace-nowrap p-3 font-semibold">{w}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-ink-3">Video engagement counts a little less as videos get older (it halves every 180 days), so recent work matters most. Scores are recalculated automatically.</p>
      <h2 className="mt-8 font-display text-xl font-bold">What the badges mean</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-2">
        <li><strong>Verified</strong> (on a contractor): our team checked their license and insurance by hand.</li>
        <li><strong>Verified job</strong> (on a review): it came through a single-use invite the contractor sent for a specific completed job.</li>
        <li><strong>Demo</strong>: sample data used while we test. Not a real business.</li>
      </ul>
      <Link href="/feed" className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-orange px-6 font-bold text-ink">Watch project videos</Link>
    </main>
  );
}
