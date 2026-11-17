import Link from "next/link";
import { categoryLabel } from "@/lib/config";
import type { Contractor } from "@/lib/types";
import { DemoBadge, VerifiedBadge } from "./Badges";
import { PinIcon } from "./icons";

export default function ContractorCard({ c, thumb }: { c: Contractor; thumb?: string | null }) {
  return (
    <Link href={`/c/${c.slug}`} className="group block overflow-hidden rounded-2xl border border-rule bg-white transition hover:-translate-y-0.5 hover:border-rule-mid hover:shadow-lg">
      {thumb !== undefined && (
        <div className="relative aspect-video bg-sand">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-ink-3">No videos yet</div>
          )}
          {c.categories[0] && (
            <span className="absolute left-2.5 top-2.5 rounded-md bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-2">
              {categoryLabel(c.categories[0])}
            </span>
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sand font-display text-lg font-bold text-ink-2">
            {c.business_name.replace(/^Demo\s*[—-]\s*/i, "").charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-base font-bold">{c.business_name}</p>
            <p className="flex items-center gap-1 text-xs text-ink-3">
              <PinIcon size={12} /> {[c.city, c.state].filter(Boolean).join(", ") || "Location not set"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {c.is_verified && <VerifiedBadge />}
            {c.is_demo && <DemoBadge />}
          </div>
        </div>
        {c.bio && <p className="mt-3 line-clamp-2 text-[13px] text-ink-3">{c.bio}</p>}
      </div>
    </Link>
  );
}
