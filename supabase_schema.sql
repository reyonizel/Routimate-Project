-- RoutinMate Supabase Schema
-- Tamamen idempotent: kaç kez çalıştırılsa sorun olmaz.
-- Supabase Dashboard → SQL Editor → New Query → Yapıştır → Run

-- ── Tablolar ──────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id                uuid references auth.users(id) on delete cascade primary key,
  username          text unique not null default '',
  full_name         text,
  bio               text,
  birth_date        text,
  location_name     text,
  location_lat      float8,
  location_lon      float8,
  gender            text not null default 'male',
  avatar_url        text,
  is_pro            boolean not null default false,
  interests         text[] not null default '{}',
  achievement_score int not null default 0,
  matched_since     timestamptz,
  inactive_sets     text[] not null default '{}',
  notification_sound text not null default 'default',
  completion_sound  text not null default 'correct',
  created_at        timestamptz not null default now()
);

create table if not exists public.routines (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.profiles(id) on delete cascade not null,
  name              text not null,
  description       text,
  frequency         text not null default 'daily',
  notification_time text not null default '08:00',
  target_days       int[] default '{}',
  monthly_days      int[] default '{}',
  set_name          text,
  scope             text not null default 'recurring',
  once_start        text,
  once_end          text,
  created_at        timestamptz not null default now()
);

create table if not exists public.routine_completions (
  id             uuid primary key default gen_random_uuid(),
  routine_id     uuid references public.routines(id) on delete cascade not null,
  user_id        uuid references public.profiles(id) on delete cascade not null,
  completed_date date not null,
  unique (routine_id, completed_date)
);

create table if not exists public.routine_notes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade not null,
  routine_id   uuid references public.routines(id) on delete cascade not null,
  note_date    date not null,
  text         text not null,
  created_at   timestamptz not null default now()
);

create table if not exists public.rest_days (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid references public.profiles(id) on delete cascade not null,
  rest_date date not null,
  unique (user_id, rest_date)
);

create table if not exists public.photos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  url         text not null,
  is_pinned   boolean not null default false,
  uploaded_at timestamptz not null default now(),
  proof_meta  jsonb
);

create table if not exists public.match_requests (
  id           uuid primary key default gen_random_uuid(),
  from_user    uuid references public.profiles(id) on delete cascade not null,
  to_user      uuid references public.profiles(id) on delete cascade not null,
  status       text not null default 'pending',
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  unique (from_user, to_user)
);

create table if not exists public.matches (
  id         uuid primary key default gen_random_uuid(),
  user_a     uuid references public.profiles(id) on delete cascade not null,
  user_b     uuid references public.profiles(id) on delete cascade not null,
  status     text not null default 'active',
  matched_at timestamptz not null default now(),
  ended_at   timestamptz,
  unique (user_a, user_b)
);

create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid references public.matches(id) on delete cascade not null,
  sender_id  uuid references public.profiles(id) on delete cascade not null,
  text       text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_orders (
  id           text primary key,
  user_id      uuid references public.profiles(id) on delete cascade not null,
  products     jsonb not null default '[]',
  total        int not null,
  city         text not null default '',
  district     text not null default '',
  neighborhood text default '',
  address      text not null default '',
  phone        text not null default '',
  status       text not null default 'Hazırlanıyor',
  created_at   timestamptz not null default now()
);

create table if not exists public.store_waitlist (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now(),
  unique(email)
);

create table if not exists public.app_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade not null,
  session_date date not null,
  unique(user_id, session_date)
);

-- ── Kolon eklemeleri (sonradan eklenen alanlar) ───────────────────────────────

alter table public.profiles
  add column if not exists timezone text not null default 'Europe/Istanbul';

alter table public.routines
  add column if not exists set_icon text;

-- ── Trigger: yeni kullanıcıya otomatik profil ─────────────────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, gender, interests, achievement_score)
  values (
    new.id,
    split_part(new.email, '@', 1),
    'male',
    '{}',
    0
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table public.profiles         enable row level security;
alter table public.routines         enable row level security;
alter table public.routine_completions enable row level security;
alter table public.routine_notes    enable row level security;
alter table public.rest_days        enable row level security;
alter table public.photos           enable row level security;
alter table public.match_requests   enable row level security;
alter table public.matches          enable row level security;
alter table public.messages         enable row level security;
alter table public.user_orders      enable row level security;
alter table public.store_waitlist   enable row level security;
alter table public.app_sessions     enable row level security;

-- ── Policies ──────────────────────────────────────────────────────────────────

-- profiles
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- routines
drop policy if exists "routines_select_own"  on public.routines;
drop policy if exists "routines_insert_own"  on public.routines;
drop policy if exists "routines_update_own"  on public.routines;
drop policy if exists "routines_delete_own"  on public.routines;
drop policy if exists "routines_select_mate" on public.routines;
create policy "routines_select_own"  on public.routines for select using (auth.uid() = user_id);
create policy "routines_insert_own"  on public.routines for insert with check (auth.uid() = user_id);
create policy "routines_update_own"  on public.routines for update using (auth.uid() = user_id);
create policy "routines_delete_own"  on public.routines for delete using (auth.uid() = user_id);
create policy "routines_select_mate" on public.routines for select using (
  exists (
    select 1 from public.matches m
    where m.status = 'active'
      and ((m.user_a = auth.uid() and m.user_b = routines.user_id)
        or (m.user_b = auth.uid() and m.user_a = routines.user_id))
  )
);

-- routine_completions
drop policy if exists "completions_own"         on public.routine_completions;
drop policy if exists "completions_mate_select" on public.routine_completions;
create policy "completions_own" on public.routine_completions using (auth.uid() = user_id);
create policy "completions_mate_select" on public.routine_completions for select using (
  auth.uid() = user_id or exists (
    select 1 from public.matches m
    where m.status = 'active'
      and ((m.user_a = auth.uid() and m.user_b = routine_completions.user_id)
        or (m.user_b = auth.uid() and m.user_a = routine_completions.user_id))
  )
);

-- routine_notes
drop policy if exists "notes_own" on public.routine_notes;
create policy "notes_own" on public.routine_notes using (auth.uid() = user_id);

-- rest_days
drop policy if exists "rest_days_own" on public.rest_days;
create policy "rest_days_own" on public.rest_days using (auth.uid() = user_id);

-- photos
drop policy if exists "photos_own"         on public.photos;
drop policy if exists "photos_mate_select" on public.photos;
create policy "photos_own" on public.photos using (auth.uid() = user_id);
create policy "photos_mate_select" on public.photos for select using (
  auth.uid() = user_id or exists (
    select 1 from public.matches m
    where m.status = 'active'
      and ((m.user_a = auth.uid() and m.user_b = photos.user_id)
        or (m.user_b = auth.uid() and m.user_a = photos.user_id))
  )
);

-- match_requests
drop policy if exists "requests_select" on public.match_requests;
drop policy if exists "requests_insert" on public.match_requests;
drop policy if exists "requests_delete" on public.match_requests;
create policy "requests_select" on public.match_requests for select using (
  auth.uid() = from_user or auth.uid() = to_user
);
create policy "requests_insert" on public.match_requests for insert with check (auth.uid() = from_user);
create policy "requests_delete" on public.match_requests for delete using (
  auth.uid() = from_user or auth.uid() = to_user
);

-- matches
drop policy if exists "matches_select" on public.matches;
drop policy if exists "matches_insert" on public.matches;
drop policy if exists "matches_update" on public.matches;
create policy "matches_select" on public.matches for select using (
  auth.uid() = user_a or auth.uid() = user_b
);
create policy "matches_insert" on public.matches for insert with check (
  auth.uid() = user_a or auth.uid() = user_b
);
create policy "matches_update" on public.matches for update using (
  auth.uid() = user_a or auth.uid() = user_b
);

-- messages
drop policy if exists "messages_select" on public.messages;
drop policy if exists "messages_insert" on public.messages;
drop policy if exists "messages_delete" on public.messages;
create policy "messages_select" on public.messages for select using (
  exists (
    select 1 from public.matches m
    where m.id = match_id
      and m.status = 'active'
      and (m.user_a = auth.uid() or m.user_b = auth.uid())
  )
);
create policy "messages_insert" on public.messages for insert with check (
  auth.uid() = sender_id and exists (
    select 1 from public.matches m
    where m.id = match_id
      and m.status = 'active'
      and (m.user_a = auth.uid() or m.user_b = auth.uid())
  )
);
create policy "messages_delete" on public.messages for delete using (
  auth.uid() = sender_id
);

-- user_orders
drop policy if exists "user_orders_own" on public.user_orders;
create policy "user_orders_own" on public.user_orders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- store_waitlist
drop policy if exists "waitlist_insert" on public.store_waitlist;
drop policy if exists "waitlist_own"    on public.store_waitlist;
create policy "waitlist_insert" on public.store_waitlist for insert with check (true);
create policy "waitlist_own"    on public.store_waitlist for select using (auth.uid() = user_id);

-- app_sessions
drop policy if exists "sessions_own" on public.app_sessions;
create policy "sessions_own" on public.app_sessions using (auth.uid() = user_id);

-- ── Performans İndexleri ──────────────────────────────────────────────────────

create index if not exists idx_routines_user_id         on public.routines(user_id);
create index if not exists idx_completions_routine_date on public.routine_completions(routine_id, completed_date);
create index if not exists idx_notes_routine_id         on public.routine_notes(routine_id);
create index if not exists idx_photos_user_created      on public.photos(user_id, uploaded_at desc);
create index if not exists idx_messages_match_created   on public.messages(match_id, created_at asc);
create index if not exists idx_matches_user_a           on public.matches(user_a, status);
create index if not exists idx_matches_user_b           on public.matches(user_b, status);

-- ── Başarı Skoru Hesaplama Fonksiyonu ─────────────────────────────────────────

create or replace function public.calculate_achievement_score(p_user_id uuid)
returns int language plpgsql security definer as $$
declare
  total_routines   int;
  completed_30     int;
  session_30       int;
  total_photos     int;
  proof_photos     int;
  completion_pct   int;
  session_pct      int;
  proof_pct        int;
  final_score      int;
begin
  select count(*) into total_routines
  from public.routines
  where user_id = p_user_id and scope = 'recurring';

  select count(*) into completed_30
  from public.routine_completions
  where user_id = p_user_id
    and completed_date >= current_date - 29;

  select count(*) into session_30
  from public.app_sessions
  where user_id = p_user_id
    and session_date >= current_date - 29;

  select count(*), count(case when proof_meta is not null then 1 end)
  into total_photos, proof_photos
  from public.photos
  where user_id = p_user_id;

  completion_pct := least(100, case
    when total_routines = 0 then 0
    else (completed_30 * 100) / (total_routines * 30)
  end);

  session_pct := least(100, (session_30 * 100) / 30);

  proof_pct := least(100, case
    when total_photos = 0 then 0
    else (proof_photos * 100) / total_photos
  end);

  final_score := least(100,
    (completion_pct * 60 / 100) +
    (session_pct    * 20 / 100) +
    (proof_pct      * 15 / 100) +
    5
  );

  return final_score;
end;
$$;

-- ── Realtime ──────────────────────────────────────────────────────────────────

do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.match_requests;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.matches;
exception when duplicate_object then null;
end $$;
