import Link from "next/link";

export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-lg bg-ink" style={{ width: size, height: size }} aria-hidden>
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
        <path d="M3 10 12 3l9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" stroke="#FF5C1A" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M10 10.5v6l5-3z" fill="#FF5C1A" />
      </svg>
    </span>
  );
}

export default function Logo({ dark = false, href = "/" }: { dark?: boolean; href?: string }) {
  return (
    <Link href={href} className="flex min-h-11 items-center gap-2.5" aria-label="BuildProof home">
      <LogoMark />
      <span className={`font-display text-[19px] font-extrabold tracking-tight ${dark ? "text-white" : "text-ink"}`}>BuildProof</span>
    </Link>
  );
}
