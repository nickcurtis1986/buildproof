/**
 * All video handling lives here so the storage backend (Supabase Storage today)
 * can be swapped for Cloudflare Stream or Mux later without touching the UI.
 */
import { SUPABASE_URL } from "@/lib/supabase/env";

export const VIDEO_BUCKET = "videos";
export const THUMB_BUCKET = "thumbnails";
export const MAX_VIDEO_SECONDS = 60;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime"];

function publicUrl(bucket: string, path: string | null | undefined) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export const videoUrl = (path: string | null | undefined) => publicUrl(VIDEO_BUCKET, path);
export const thumbUrl = (path: string | null | undefined) => publicUrl(THUMB_BUCKET, path);

/** Browser-only: checks type, size and duration. Returns an error message or null. */
export async function validateVideoFile(file: File): Promise<string | null> {
  if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) return "Please choose an MP4 or MOV video.";
  if (file.size > MAX_VIDEO_BYTES) return "That video is over 100 MB. Trim it or export at a lower quality.";
  const seconds = await readDuration(file).catch(() => null);
  if (seconds == null) return "We couldn't read that video. Try exporting it as MP4.";
  if (seconds > MAX_VIDEO_SECONDS + 0.5) return `Videos can be up to ${MAX_VIDEO_SECONDS} seconds. This one is ${Math.round(seconds)}.`;
  return null;
}

function readDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const el = document.createElement("video");
    el.preload = "metadata";
    el.muted = true;
    const url = URL.createObjectURL(file);
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(el.duration);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable"));
    };
    el.src = url;
  });
}

/** Browser-only: grabs a JPEG frame (default 1s in) to use as the thumbnail. */
export function captureThumbnail(file: File, atSeconds = 1): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const el = document.createElement("video");
    el.muted = true;
    el.playsInline = true;
    el.preload = "auto";
    const url = URL.createObjectURL(file);
    el.onloadeddata = () => {
      el.currentTime = Math.min(atSeconds, Math.max(0, el.duration - 0.1));
    };
    el.onseeked = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 720 / Math.max(el.videoWidth, el.videoHeight));
      canvas.width = Math.round(el.videoWidth * scale);
      canvas.height = Math.round(el.videoHeight * scale);
      canvas.getContext("2d")?.drawImage(el, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (b) => {
          URL.revokeObjectURL(url);
          if (b) resolve(b);
          else reject(new Error("thumbnail failed"));
        },
        "image/jpeg",
        0.8,
      );
    };
    el.onerror = () => reject(new Error("unreadable"));
    el.src = url;
  });
}
