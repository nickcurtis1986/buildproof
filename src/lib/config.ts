export const CATEGORIES = [
  { id: "roofing", label: "Roofing" },
  { id: "plumbing", label: "Plumbing" },
  { id: "remodeling", label: "Remodeling" },
  { id: "landscaping", label: "Landscaping" },
  { id: "electrical", label: "Electrical" },
  { id: "hvac", label: "HVAC" },
  { id: "painting", label: "Painting" },
  { id: "flooring", label: "Flooring" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function isCategory(v: unknown): v is CategoryId {
  return typeof v === "string" && CATEGORIES.some((c) => c.id === v);
}

const envLaunch = process.env.NEXT_PUBLIC_LAUNCH_CATEGORY;
/** The one niche we launch with. Change it in .env.local — the data model supports all categories. */
export const LAUNCH_CATEGORY: CategoryId = isCategory(envLaunch) ? envLaunch : "roofing";

export const LAUNCH_MARKET = "South Jersey and the Philadelphia suburbs";

export function categoryLabel(id: string | null | undefined) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id ?? "";
}

/** Launch niche first, the rest after. */
export function orderedCategories() {
  return [...CATEGORIES].sort((a, b) => (a.id === LAUNCH_CATEGORY ? -1 : b.id === LAUNCH_CATEGORY ? 1 : 0));
}

/** Public stats stay hidden until the real number reaches this. */
export const MIN_PUBLIC_STAT = 10;

export const isZip = (z: unknown): z is string => typeof z === "string" && /^\d{5}$/.test(z);

export const VIDEO_TYPE_LABEL: Record<string, string> = {
  project: "Project",
  before_after: "Before & after",
  walkthrough: "Walkthrough",
  review: "Customer review",
};

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
