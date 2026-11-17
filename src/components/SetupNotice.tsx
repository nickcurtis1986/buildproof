export default function SetupNotice() {
  return (
    <div className="m-4 rounded-2xl border border-rule bg-white p-5 text-sm text-ink-2">
      <p className="font-display text-base font-bold text-ink">Database not connected yet</p>
      <p className="mt-1">
        Add your Supabase keys to <code className="rounded bg-sand px-1">.env.local</code> (see README, step 3), then restart{" "}
        <code className="rounded bg-sand px-1">npm run dev</code>.
      </p>
    </div>
  );
}
