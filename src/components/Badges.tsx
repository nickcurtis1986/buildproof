import { CheckIcon } from "./icons";

/** Admin-checked license + insurance. */
export function VerifiedBadge({ onDark = false }: { onDark?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        onDark ? "bg-green text-white" : "border border-green/30 bg-green/10 text-green"
      }`}
      title="License and insurance checked by BuildProof"
    >
      <CheckIcon size={10} /> Verified
    </span>
  );
}

/** Marks seed data so nobody mistakes it for a real business. */
export function DemoBadge({ onDark = false }: { onDark?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        onDark ? "bg-white/90 text-ink" : "border border-ink/20 bg-sand text-ink-2"
      }`}
      title="Sample data for testing — not a real business"
    >
      Demo
    </span>
  );
}
