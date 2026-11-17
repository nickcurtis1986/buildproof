"use client";
/** Anonymous per-browser id used to de-duplicate views. Falls back to a per-tab id. */
let memo: string | null = null;
export function getSessionId() {
  if (memo) return memo;
  try {
    memo = localStorage.getItem("bp_sid");
    if (!memo) {
      memo = crypto.randomUUID();
      localStorage.setItem("bp_sid", memo);
    }
  } catch {
    memo = crypto.randomUUID();
  }
  return memo;
}
