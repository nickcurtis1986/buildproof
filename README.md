# BuildProof

Homeowners in South Jersey and the Philadelphia suburbs find contractors by watching short videos of real, finished jobs.
It's a mobile-first web app that installs to the home screen (PWA) on iPhone and Android.

**Trust rules:** no ads, no sponsored placement, no paid ranking. See "How ranking works" below.

Stack: Next.js 16 (App Router) + TypeScript + Tailwind CSS 4, Supabase (database, login, file storage), Resend (email), Vercel (hosting).

---

## 1. Install the tools on Windows (once)

1. **Node.js 20 or newer** → https://nodejs.org → download the "LTS" installer → run it (accept defaults).
2. **Git** → https://git-scm.com/download/win → run the installer (accept defaults).
3. Open **PowerShell** and check:
   ```powershell
   node -v
   git --version
   ```
   `node -v` must print v20 or higher.

## 2. Create the Supabase project (once, ~10 minutes)

1. Go to https://supabase.com → sign up → **New project**. Pick a region near you (East US). Save the database password somewhere safe.
2. When it finishes, open **SQL Editor** → **New query**. Open `supabase/migrations/001_init.sql` from this project in Notepad, copy everything, paste it in, and press **Run**. You should see "Success". Then do the same with `supabase/migrations/002_grants.sql`.
3. **Login settings** → *Authentication* → *URL Configuration*:
   - Site URL: `http://localhost:3000` (change to your Vercel address later)
   - Redirect URLs: add `http://localhost:3000/auth/callback` (and later `https://YOUR-SITE.vercel.app/auth/callback`)
4. **Google sign-in (optional, can do later)**: *Authentication* → *Providers* → *Google* → turn on. It asks for a Client ID and Secret from Google Cloud Console (APIs & Services → Credentials → OAuth client ID → Web application; authorized redirect URI is shown on the Supabase screen). Email sign-in links work without this.
5. **Your keys**: *Project Settings* → *API*. You need the Project URL, the `anon`/publishable key, and the `service_role`/secret key.

## 3. Set up `.env.local`

In the project folder:
```powershell
Copy-Item .env.example .env.local
notepad .env.local
```
Fill in the three Supabase values and set `CRON_SECRET` to any long random text. Save.
`.env.local` holds secrets and is never committed to git.

## 4. Run it on your computer

```powershell
npm install
```
```powershell
npm run dev
```
Open http://localhost:3000. To test on your phone, use the deployed Vercel version (step 6).

### Demo data
```powershell
npm run seed:demo
```
Adds 6 contractors and 7 placeholder clips, all named "Demo — …" and showing a **Demo** badge. They have no reviews, views or ratings. Remove everything with:
```powershell
npm run clear:demo
```
Run `clear:demo` before launch.

### Make yourself an admin
Sign in once, then in Supabase SQL Editor run (with your email):
```sql
update profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
```

## 5. Email for quote requests (optional)

Sign up at https://resend.com, create an API key, put it in `RESEND_API_KEY`. Until then, lead emails are printed in the PowerShell window running `npm run dev`, and leads are still saved.

## 6. Deploy to Vercel

1. Put the code on GitHub: create an empty repo at https://github.com/new, then in PowerShell:
   ```powershell
   git remote add origin https://github.com/YOUR-NAME/buildproof.git
   ```
   ```powershell
   git push -u origin main
   ```
2. https://vercel.com → sign in with GitHub → **Add New → Project** → pick the repo → open **Environment Variables** and add every line from your `.env.local` (set `NEXT_PUBLIC_SITE_URL` to your Vercel address) → **Deploy**.
3. Add the Vercel address to Supabase (step 2.3: Site URL + Redirect URL).
4. On your phone, open the site → Share → **Add to Home Screen** (iPhone) or menu → **Install app** (Android).

The rank cron in `vercel.json` runs daily and recalculates rankings.

---

## How ranking works

Computed in the SQL function `recompute_rank_scores()` (`supabase/migrations/001_init.sql`):

```
rank_score = 3.0 × verified_reviews
           + 1.0 × unverified_published_reviews
           + 1.5 × (total_views / 1000)
           + 2.0 × likes
           + 2.5 × saves
           + 1.0 × avg_completion_pct / 10
           + newcomer boost (up to +5, fades to 0 over the first 60 days)
```
Video engagement is weighted by age (halves every 180 days). **There is no payment, plan, tier or ad input**, and the database has no column that could supply one. Database triggers stop contractors from editing their own `rank_score`, `is_verified`, `status` or view/like counts.

Feed order: `rank_score`, then newest first. Public explanation: `/how-ranking-works`.

Scheduling: Vercel cron (`vercel.json`, daily on the free plan) calls `/api/cron/rank`. For hourly, enable `pg_cron` in Supabase and run:
`select cron.schedule('recompute-rank', '0 * * * *', 'select public.recompute_rank_scores()');`

## Project map

| Path | What it is |
|---|---|
| `src/app/page.tsx` | Landing page (stats only appear once real counts reach 10) |
| `src/app/(app)/feed` | Vertical video feed |
| `src/app/(app)/c/[slug]` | Contractor profile + quote form |
| `src/app/(app)/search`, `saved`, `account` | Other tabs |
| `src/app/api/leads` | Quote requests: honeypot + 5 per hour per connection |
| `src/lib/video.ts` | All video logic (swap for Cloudflare Stream/Mux here) |
| `src/lib/config.ts` | Categories, launch niche, stat threshold |
| `supabase/migrations/001_init.sql` | Tables, security rules, ranking |
| `scripts/` | Demo seed / clear |

## Upgrade path

The PWA covers iPhone and Android for the MVP. A native React Native (Expo) app is the planned upgrade once there's traction; it can reuse the same Supabase backend.
