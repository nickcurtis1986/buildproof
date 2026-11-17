-- BuildProof — initial schema
-- Run once in Supabase → SQL Editor (paste the whole file, press Run).
-- Trust rules baked in here: no ads, no sponsored placement, no paid ranking.

create extension if not exists pgcrypto with schema extensions;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helpers
-- ─────────────────────────────────────────────────────────────────────────────

-- profiles first, because is_admin() reads it
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text check (role in ('homeowner','contractor','admin')),  -- null until first-sign-in choice
  full_name   text check (char_length(full_name) <= 120),
  zip_code    text check (zip_code ~ '^\d{5}$'),
  created_at  timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- True for the database owner / service role (server code, cron, seed scripts) and for admins.
create or replace function public.is_privileged() returns boolean
language sql stable as $$
  select current_user in ('postgres','service_role','supabase_admin') or public.is_admin();
$$;

-- New auth user → profile row
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), 120))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Nobody can make themselves an admin.
create or replace function public.protect_profile_role() returns trigger
language plpgsql as $$
begin
  if not public.is_privileged()
     and new.role is distinct from old.role
     and (new.role = 'admin' or old.role = 'admin') then
    raise exception 'Only an admin can grant or remove the admin role';
  end if;
  new.id := old.id;
  new.created_at := old.created_at;
  return new;
end $$;

create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ─────────────────────────────────────────────────────────────────────────────
-- Contractors
-- ─────────────────────────────────────────────────────────────────────────────
create table public.contractors (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.profiles(id) on delete cascade,
  business_name   text not null check (char_length(business_name) between 2 and 120),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  bio             text check (char_length(bio) <= 2000),
  phone           text,
  email           text,
  license_number  text,
  website         text,
  categories      text[] not null default '{}',
  service_zips    text[] not null default '{}',
  city            text,
  state           text,
  is_verified     boolean not null default false,  -- set ONLY by an admin after checking license + insurance
  status          text not null default 'active' check (status in ('pending','active','suspended')),
  rank_score      numeric not null default 0,     -- written ONLY by recompute_rank_scores()
  is_demo         boolean not null default false, -- seed data; removed by scripts/clear-demo.ts
  created_at      timestamptz not null default now()
  -- Note: there is deliberately no plan / tier / payment column that ranking could read.
);
create index contractors_owner_idx on public.contractors (owner_id);
create index contractors_rank_idx on public.contractors (status, rank_score desc);
create index contractors_categories_idx on public.contractors using gin (categories);
create index contractors_zips_idx on public.contractors using gin (service_zips);

create or replace function public.protect_contractor_columns() returns trigger
language plpgsql as $$
begin
  if public.is_privileged() then return new; end if;
  if tg_op = 'INSERT' then
    new.is_verified := false;
    new.rank_score  := 0;
    new.status      := 'active';
    new.is_demo     := false;
  else
    new.owner_id    := old.owner_id;
    new.is_verified := old.is_verified;
    new.rank_score  := old.rank_score;
    new.status      := old.status;
    new.is_demo     := old.is_demo;
    new.created_at  := old.created_at;
  end if;
  return new;
end $$;

create trigger contractors_protect before insert or update on public.contractors
  for each row execute function public.protect_contractor_columns();

-- ─────────────────────────────────────────────────────────────────────────────
-- Videos
-- ─────────────────────────────────────────────────────────────────────────────
create table public.videos (
  id                uuid primary key default gen_random_uuid(),
  contractor_id     uuid not null references public.contractors(id) on delete cascade,
  title             text not null check (char_length(title) between 2 and 120),
  description       text check (char_length(description) <= 1000),
  video_type        text not null default 'project' check (video_type in ('project','before_after','walkthrough','review')),
  category          text not null,
  tags              text[] not null default '{}',
  storage_path      text not null,
  thumbnail_path    text,
  duration_seconds  numeric check (duration_seconds is null or duration_seconds <= 61),
  zip_code          text,
  city              text,
  status            text not null default 'processing' check (status in ('processing','active','flagged','removed')),
  view_count        integer not null default 0,
  like_count        integer not null default 0,
  save_count        integer not null default 0,
  complete_count    integer not null default 0,
  avg_completion    numeric not null default 0,  -- % of views that watched to the end
  is_demo           boolean not null default false,
  created_at        timestamptz not null default now()
);
create index videos_contractor_idx on public.videos (contractor_id, created_at desc);
create index videos_feed_idx on public.videos (status, category, created_at desc);
create index videos_zip_idx on public.videos (zip_code);

create or replace function public.protect_video_columns() returns trigger
language plpgsql as $$
begin
  if public.is_privileged() then return new; end if;
  if tg_op = 'INSERT' then
    new.view_count := 0; new.like_count := 0; new.save_count := 0;
    new.complete_count := 0; new.avg_completion := 0; new.is_demo := false;
    if new.status not in ('processing','active') then new.status := 'processing'; end if;
  else
    new.contractor_id  := old.contractor_id;
    new.view_count     := old.view_count;
    new.like_count     := old.like_count;
    new.save_count     := old.save_count;
    new.complete_count := old.complete_count;
    new.avg_completion := old.avg_completion;
    new.is_demo        := old.is_demo;
    new.created_at     := old.created_at;
    -- owners may publish or remove their own videos, but cannot clear a flag or restore a removal
    if old.status in ('flagged','removed') and new.status <> 'removed' then new.status := old.status; end if;
    if new.status = 'flagged' and old.status <> 'flagged' then new.status := old.status; end if;
  end if;
  return new;
end $$;

create trigger videos_protect before insert or update on public.videos
  for each row execute function public.protect_video_columns();

-- ─────────────────────────────────────────────────────────────────────────────
-- Engagement events
-- ─────────────────────────────────────────────────────────────────────────────
create table public.video_events (
  id          bigint generated always as identity primary key,
  video_id    uuid not null references public.videos(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete set null,
  session_id  text,
  event       text not null check (event in ('view','like','save','share','complete')),
  watch_pct   numeric check (watch_pct between 0 and 100),
  created_at  timestamptz not null default now()
);
-- one like and one save per user per video
create unique index video_events_one_reaction on public.video_events (video_id, user_id, event)
  where event in ('like','save') and user_id is not null;
create index video_events_session_idx on public.video_events (video_id, session_id, event, created_at desc);
create index video_events_user_idx on public.video_events (user_id, event);

-- Views / completes / shares. One of each per browser session per video per 24h.
create or replace function public.log_video_event(p_video_id uuid, p_session_id text, p_event text, p_watch_pct numeric default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_event not in ('view','complete','share') then
    raise exception 'Use toggle_reaction() for likes and saves';
  end if;
  if p_session_id is null or char_length(p_session_id) not between 8 and 64 then
    raise exception 'Invalid session id';
  end if;
  if not exists (select 1 from videos v join contractors c on c.id = v.contractor_id
                 where v.id = p_video_id and v.status = 'active' and c.status = 'active') then
    return;
  end if;
  if exists (select 1 from video_events where video_id = p_video_id and session_id = p_session_id
             and event = p_event and created_at > now() - interval '24 hours') then
    return;
  end if;

  insert into video_events (video_id, user_id, session_id, event, watch_pct)
  values (p_video_id, auth.uid(), p_session_id, p_event, least(greatest(p_watch_pct, 0), 100));

  update videos set
    view_count     = view_count + (p_event = 'view')::int,
    complete_count = complete_count + (p_event = 'complete')::int
  where id = p_video_id;

  update videos set avg_completion =
    case when view_count > 0 then round(100.0 * least(complete_count, view_count) / view_count, 2) else 0 end
  where id = p_video_id;
end $$;

-- Like / save toggle for signed-in users. Returns the new state (true = liked/saved).
create or replace function public.toggle_reaction(p_video_id uuid, p_event text)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_deleted int;
begin
  if v_uid is null then raise exception 'Sign in to like or save videos'; end if;
  if p_event not in ('like','save') then raise exception 'Invalid reaction'; end if;

  delete from video_events where video_id = p_video_id and user_id = v_uid and event = p_event;
  get diagnostics v_deleted = row_count;
  if v_deleted > 0 then
    update videos set
      like_count = greatest(like_count - (p_event = 'like')::int, 0),
      save_count = greatest(save_count - (p_event = 'save')::int, 0)
    where id = p_video_id;
    return false;
  end if;

  if not exists (select 1 from videos where id = p_video_id and status = 'active') then
    raise exception 'Video not available';
  end if;
  insert into video_events (video_id, user_id, event) values (p_video_id, v_uid, p_event);
  update videos set
    like_count = like_count + (p_event = 'like')::int,
    save_count = save_count + (p_event = 'save')::int
  where id = p_video_id;
  return true;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Saved contractors
-- ─────────────────────────────────────────────────────────────────────────────
create table public.saved_contractors (
  user_id        uuid not null references public.profiles(id) on delete cascade,
  contractor_id  uuid not null references public.contractors(id) on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (user_id, contractor_id)
);
create index saved_contractors_contractor_idx on public.saved_contractors (contractor_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Review invites + reviews
-- ─────────────────────────────────────────────────────────────────────────────
create table public.review_invites (
  id               uuid primary key default gen_random_uuid(),
  contractor_id    uuid not null references public.contractors(id) on delete cascade,
  token            text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  customer_name    text not null check (char_length(customer_name) between 1 and 120),
  customer_email   text,
  job_description  text not null check (char_length(job_description) between 2 and 500),
  job_zip          text,
  status           text not null default 'sent' check (status in ('sent','used','expired')),
  expires_at       timestamptz not null default now() + interval '30 days',
  created_at       timestamptz not null default now(),
  used_at          timestamptz
);
create index review_invites_contractor_idx on public.review_invites (contractor_id, created_at desc);

create table public.reviews (
  id             uuid primary key default gen_random_uuid(),
  contractor_id  uuid not null references public.contractors(id) on delete cascade,
  invite_id      uuid unique references public.review_invites(id) on delete set null,
  reviewer_name  text not null check (char_length(reviewer_name) between 1 and 120),
  reviewer_email text,
  rating         smallint not null check (rating between 1 and 5),
  body           text check (char_length(body) <= 3000),
  video_id       uuid references public.videos(id) on delete set null,
  is_verified    boolean not null default false, -- true only when created through a valid, unused invite (server code)
  status         text not null default 'pending' check (status in ('pending','published','rejected')),
  ip_hash        text,
  device_hash    text,
  created_at     timestamptz not null default now()
);
create index reviews_contractor_idx on public.reviews (contractor_id, status, created_at desc);
create index reviews_ip_idx on public.reviews (ip_hash, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Leads (quote requests) and reports
-- ─────────────────────────────────────────────────────────────────────────────
create table public.leads (
  id              uuid primary key default gen_random_uuid(),
  contractor_id   uuid not null references public.contractors(id) on delete cascade,
  homeowner_id    uuid references public.profiles(id) on delete set null,
  video_id        uuid references public.videos(id) on delete set null,
  name            text not null check (char_length(name) between 1 and 120),
  phone           text,
  email           text,
  service_needed  text,
  zip_code        text,
  message         text check (char_length(message) <= 2000),
  status          text not null default 'new' check (status in ('new','viewed','responded','closed','spam')),
  ip_hash         text,
  created_at      timestamptz not null default now()
);
create index leads_contractor_idx on public.leads (contractor_id, created_at desc);
create index leads_ip_idx on public.leads (ip_hash, created_at desc);

create table public.reports (
  id           uuid primary key default gen_random_uuid(),
  target_type  text not null check (target_type in ('video','review','contractor')),
  target_id    uuid not null,
  reporter_id  uuid references public.profiles(id) on delete set null,
  reason       text not null check (char_length(reason) between 2 and 1000),
  status       text not null default 'open' check (status in ('open','resolved')),
  created_at   timestamptz not null default now()
);
create index reports_status_idx on public.reports (status, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Feed query: rank_score first, then recency. Nothing paid can influence it.
-- ZIP matches the video's ZIP, the contractor's service ZIPs, or the same 3-digit area.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.feed_videos(
  p_category text default null, p_zip text default null, p_limit int default 20, p_offset int default 0)
returns table (
  id uuid, title text, description text, video_type text, category text,
  storage_path text, thumbnail_path text, duration_seconds numeric, city text, zip_code text,
  view_count int, like_count int, save_count int, is_demo boolean, created_at timestamptz,
  contractor_id uuid, contractor_name text, contractor_slug text, contractor_verified boolean,
  contractor_city text, contractor_is_demo boolean)
language sql stable set search_path = public as $$
  select v.id, v.title, v.description, v.video_type, v.category,
         v.storage_path, v.thumbnail_path, v.duration_seconds, v.city, v.zip_code,
         v.view_count, v.like_count, v.save_count, v.is_demo, v.created_at,
         c.id, c.business_name, c.slug, c.is_verified, c.city, c.is_demo
  from videos v
  join contractors c on c.id = v.contractor_id
  where v.status = 'active' and c.status = 'active'
    and (p_category is null or v.category = p_category)
    and (p_zip is null or v.zip_code = p_zip or p_zip = any (c.service_zips)
         or left(v.zip_code, 3) = left(p_zip, 3))
  order by c.rank_score desc, v.created_at desc
  limit least(greatest(p_limit, 1), 50) offset greatest(p_offset, 0);
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Ranking
--   rank_score = 3.0 * verified_reviews
--              + 1.0 * unverified_published_reviews
--              + 1.5 * (total_views / 1000)
--              + 2.0 * likes
--              + 2.5 * saves
--              + 1.0 * avg_completion_pct / 10
--              + newcomer boost (up to +5, fades to 0 over a contractor's first 60 days)
--   Video engagement is weighted by age (half-life 180 days) so recent work counts more.
--   INPUTS ARE ONLY reviews, video engagement and completion. There is no payment,
--   plan, tier, ad or sponsorship input — and no column exists that could supply one.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.recompute_rank_scores() returns void
language plpgsql security definer set search_path = public as $$
begin
  update contractors c set rank_score = s.score
  from (
    select c2.id,
      round((
          3.0 * coalesce(r.verified_reviews, 0)
        + 1.0 * coalesce(r.other_reviews, 0)
        + 1.5 * coalesce(v.views, 0) / 1000.0
        + 2.0 * coalesce(v.likes, 0)
        + 2.5 * coalesce(v.saves, 0)
        + 1.0 * coalesce(v.avg_completion, 0) / 10.0
        + 5.0 * greatest(0, 1 - extract(epoch from now() - c2.created_at) / 86400.0 / 60.0)
      )::numeric, 4) as score
    from contractors c2
    left join (
      select contractor_id,
             count(*) filter (where is_verified) as verified_reviews,
             count(*) filter (where not is_verified) as other_reviews
      from reviews where status = 'published' group by contractor_id
    ) r on r.contractor_id = c2.id
    left join (
      select contractor_id,
             sum(view_count * w) as views, sum(like_count * w) as likes,
             sum(save_count * w) as saves, avg(avg_completion) as avg_completion
      from (select *, power(0.5, extract(epoch from now() - created_at) / 86400.0 / 180.0) as w
            from videos where status = 'active') x
      group by contractor_id
    ) v on v.contractor_id = c2.id
  ) s
  where s.id = c.id and c.rank_score is distinct from s.score;
end $$;

revoke execute on function public.recompute_rank_scores() from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.profiles          enable row level security;
alter table public.contractors       enable row level security;
alter table public.videos            enable row level security;
alter table public.video_events      enable row level security;
alter table public.saved_contractors enable row level security;
alter table public.review_invites    enable row level security;
alter table public.reviews           enable row level security;
alter table public.leads             enable row level security;
alter table public.reports           enable row level security;

-- profiles
create policy "profiles: read own or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles: update own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles: admin update" on public.profiles for update using (public.is_admin());

-- contractors
create policy "contractors: public read active" on public.contractors for select
  using (status = 'active' or owner_id = auth.uid() or public.is_admin());
create policy "contractors: owner insert" on public.contractors for insert to authenticated
  with check (owner_id = auth.uid());
create policy "contractors: owner update" on public.contractors for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "contractors: admin update" on public.contractors for update using (public.is_admin());
create policy "contractors: owner or admin delete" on public.contractors for delete
  using (owner_id = auth.uid() or public.is_admin());

-- videos
create policy "videos: public read active" on public.videos for select using (
  (status = 'active' and exists (select 1 from contractors c where c.id = contractor_id and c.status = 'active'))
  or exists (select 1 from contractors c where c.id = contractor_id and c.owner_id = auth.uid())
  or public.is_admin());
create policy "videos: owner insert" on public.videos for insert to authenticated
  with check (exists (select 1 from contractors c where c.id = contractor_id and c.owner_id = auth.uid()));
create policy "videos: owner update" on public.videos for update
  using (exists (select 1 from contractors c where c.id = contractor_id and c.owner_id = auth.uid()));
create policy "videos: admin update" on public.videos for update using (public.is_admin());
create policy "videos: owner or admin delete" on public.videos for delete using (
  exists (select 1 from contractors c where c.id = contractor_id and c.owner_id = auth.uid()) or public.is_admin());

-- video_events: written only via log_video_event() / toggle_reaction(); users read their own
create policy "video_events: read own" on public.video_events for select using (user_id = auth.uid() or public.is_admin());

-- saved_contractors
create policy "saved: read own" on public.saved_contractors for select using (user_id = auth.uid());
create policy "saved: insert own" on public.saved_contractors for insert to authenticated with check (user_id = auth.uid());
create policy "saved: delete own" on public.saved_contractors for delete using (user_id = auth.uid());

-- review_invites: only the contractor who owns them (public access goes through server code by token)
create policy "invites: owner read" on public.review_invites for select using (
  exists (select 1 from contractors c where c.id = contractor_id and c.owner_id = auth.uid()) or public.is_admin());
create policy "invites: owner insert" on public.review_invites for insert to authenticated with check (
  status = 'sent' and used_at is null
  and exists (select 1 from contractors c where c.id = contractor_id and c.owner_id = auth.uid()));
create policy "invites: owner expire" on public.review_invites for update
  using (exists (select 1 from contractors c where c.id = contractor_id and c.owner_id = auth.uid()))
  with check (status in ('sent','expired'));

-- reviews: inserted only by server code (service role) so is_verified can be trusted
create policy "reviews: public read published" on public.reviews for select using (
  status = 'published'
  or exists (select 1 from contractors c where c.id = contractor_id and c.owner_id = auth.uid())
  or public.is_admin());
create policy "reviews: admin update" on public.reviews for update using (public.is_admin());
create policy "reviews: admin delete" on public.reviews for delete using (public.is_admin());

-- leads (the quote form goes through /api/leads, which adds rate limiting)
create policy "leads: anyone insert for active contractor" on public.leads for insert with check (
  status = 'new'
  and (homeowner_id is null or homeowner_id = auth.uid())
  and exists (select 1 from contractors c where c.id = contractor_id and c.status = 'active'));
create policy "leads: contractor or homeowner read" on public.leads for select using (
  exists (select 1 from contractors c where c.id = contractor_id and c.owner_id = auth.uid())
  or homeowner_id = auth.uid() or public.is_admin());
create policy "leads: contractor update status" on public.leads for update using (
  exists (select 1 from contractors c where c.id = contractor_id and c.owner_id = auth.uid()));

-- reports
create policy "reports: anyone insert" on public.reports for insert with check (
  status = 'open' and (reporter_id is null or reporter_id = auth.uid()));
create policy "reports: admin read" on public.reports for select using (public.is_admin());
create policy "reports: admin update" on public.reports for update using (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- Storage: public-read buckets; contractors write only inside a folder named after their contractor id
-- ─────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('videos', 'videos', true, 104857600, array['video/mp4','video/quicktime']),
  ('thumbnails', 'thumbnails', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "storage: contractor upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id in ('videos','thumbnails') and exists (
    select 1 from public.contractors c where c.id::text = (storage.foldername(name))[1] and c.owner_id = auth.uid()));
create policy "storage: contractor update own folder" on storage.objects for update to authenticated
  using (bucket_id in ('videos','thumbnails') and exists (
    select 1 from public.contractors c where c.id::text = (storage.foldername(name))[1] and c.owner_id = auth.uid()));
create policy "storage: contractor delete own folder" on storage.objects for delete to authenticated
  using (bucket_id in ('videos','thumbnails') and exists (
    select 1 from public.contractors c where c.id::text = (storage.foldername(name))[1] and c.owner_id = auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────────
-- Scheduling recompute_rank_scores() — pick ONE:
--  (a) Vercel cron: already set up in vercel.json → /api/cron/rank (daily on the free plan).
--  (b) Supabase pg_cron (Database → Extensions → enable pg_cron), then run:
--      select cron.schedule('recompute-rank', '0 * * * *', 'select public.recompute_rank_scores()');
-- ─────────────────────────────────────────────────────────────────────────────
