export type Role = "homeowner" | "contractor" | "admin";

export type Profile = {
  id: string;
  role: Role | null;
  full_name: string | null;
  zip_code: string | null;
};

export type Contractor = {
  id: string;
  owner_id: string;
  business_name: string;
  slug: string;
  bio: string | null;
  phone: string | null;
  email: string | null;
  license_number: string | null;
  website: string | null;
  categories: string[];
  service_zips: string[];
  city: string | null;
  state: string | null;
  is_verified: boolean;
  status: "pending" | "active" | "suspended";
  rank_score: number;
  is_demo: boolean;
  created_at: string;
};

export type Video = {
  id: string;
  contractor_id: string;
  title: string;
  description: string | null;
  video_type: "project" | "before_after" | "walkthrough" | "review";
  category: string;
  storage_path: string;
  thumbnail_path: string | null;
  duration_seconds: number | null;
  zip_code: string | null;
  city: string | null;
  status: string;
  view_count: number;
  like_count: number;
  save_count: number;
  is_demo: boolean;
  created_at: string;
};

/** Row shape returned by the feed_videos() SQL function. */
export type FeedVideo = Omit<Video, "contractor_id" | "status"> & {
  contractor_id: string;
  contractor_name: string;
  contractor_slug: string;
  contractor_verified: boolean;
  contractor_city: string | null;
  contractor_is_demo: boolean;
};
