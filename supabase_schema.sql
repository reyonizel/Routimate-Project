-- RoutinMate Supabase Schema
-- Supabase Dashboard → SQL Editor → New Query → Yapıştır → Run

-- ── Profiles ──────────────────────────────────────────────────────────────────
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

-- ── Routines ──────────────────────────────────────────────────────────────────
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

-- ── Routine Completions ───────────────────────────────────────────────────────
create table if not exists public.routine_completions (
  id             uuid primary key default gen_random_uuid(),
  routine_id     uuid references public.routines(id) on delete cascade not null,
  user_id        uuid references public.profiles(id) on delete cascade not null,
  completed_date date not null,
  unique (routine_id, completed_date)
);

-- ── Rest Days ─────────────────────────────────────────────────────────────────
create table if not exists public.rest_days (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid references public.profiles(id) on delete cascade not null,
  rest_date date not null,
  unique (user_id, rest_date)
);

-- ── Photos ────────────────────────────────────────────────────────────────────
create table if not exists public.photos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade not null,
  uri        text not null,
  is_pinned  boolean not null default false,
  proof_meta jsonb,
  created_at timestamptz not null default now()
);

-- ── Match Requests ────────────────────────────────────────────────────────────
create table if not exists public.match_requests (
  id           uuid primary key default gen_random_uuid(),
  from_user_id uuid references public.profiles(id) on delete cascade not null,
  to_user_id   uuid references public.profiles(id) on delete cascade not null,
  created_at   timestamptz not null default now(),
  unique (from_user_id, to_user_id)
);

-- ── Matches ───────────────────────────────────────────────────────────────────
create table if not exists public.matches (
  id         uuid primary key default gen_random_uuid(),
  user_a     uuid references public.profiles(id) on delete cascade not null,
  user_b     uuid references public.profiles(id) on delete cascade not null,
  status     text not null default 'active',
  matched_at timestamptz not null default now(),
  ended_at   timestamptz,
  unique (user_a, user_b)
);

-- ── User Orders (mobile) ──────────────────────────────────────────────────────
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

-- ── Messages ──────────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid references public.matches(id) on delete cascade not null,
  sender_id  uuid references public.profiles(id) on delete cascade not null,
  text       text not null,
  created_at timestamptz not null default now()
);

-- ── Auto-create profile on signup ─────────────────────────────────────────────
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
alter table public.profiles enable row level security;
alter table public.user_orders enable row level security;
alter table public.routines enable row level security;
alter table public.routine_completions enable row level security;
alter table public.rest_days enable row level security;
alter table public.photos enable row level security;
alter table public.match_requests enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;

-- profiles: herkes okuyabilir, sadece kendi profilini güncelleyebilir
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- routines: kendi + aktif eşin rutinleri
create policy "routines_select_own" on public.routines for select using (auth.uid() = user_id);
create policy "routines_insert_own" on public.routines for insert with check (auth.uid() = user_id);
create policy "routines_update_own" on public.routines for update using (auth.uid() = user_id);
create policy "routines_delete_own" on public.routines for delete using (auth.uid() = user_id);
create policy "routines_select_mate" on public.routines for select using (
  exists (
    select 1 from public.matches m
    where m.status = 'active'
      and ((m.user_a = auth.uid() and m.user_b = routines.user_id)
        or (m.user_b = auth.uid() and m.user_a = routines.user_id))
  )
);

-- routine_completions: kendi tamamlamaları
create policy "completions_own" on public.routine_completions using (auth.uid() = user_id);
create policy "completions_mate_select" on public.routine_completions for select using (
  auth.uid() = user_id or exists (
    select 1 from public.matches m
    where m.status = 'active'
      and ((m.user_a = auth.uid() and m.user_b = routine_completions.user_id)
        or (m.user_b = auth.uid() and m.user_a = routine_completions.user_id))
  )
);

-- rest_days: kendi
create policy "rest_days_own" on public.rest_days using (auth.uid() = user_id);

-- photos: kendi + aktif eşin fotoğrafları
create policy "photos_own" on public.photos using (auth.uid() = user_id);
create policy "photos_mate_select" on public.photos for select using (
  auth.uid() = user_id or exists (
    select 1 from public.matches m
    where m.status = 'active'
      and ((m.user_a = auth.uid() and m.user_b = photos.user_id)
        or (m.user_b = auth.uid() and m.user_a = photos.user_id))
  )
);

-- match_requests: gönderen veya alan görebilir
create policy "requests_select" on public.match_requests for select using (
  auth.uid() = from_user_id or auth.uid() = to_user_id
);
create policy "requests_insert" on public.match_requests for insert with check (auth.uid() = from_user_id);
create policy "requests_delete" on public.match_requests for delete using (
  auth.uid() = from_user_id or auth.uid() = to_user_id
);

-- matches: ilgili kullanıcılar görebilir
create policy "matches_select" on public.matches for select using (
  auth.uid() = user_a or auth.uid() = user_b
);
create policy "matches_insert" on public.matches for insert with check (
  auth.uid() = user_a or auth.uid() = user_b
);
create policy "matches_update" on public.matches for update using (
  auth.uid() = user_a or auth.uid() = user_b
);

-- messages: aktif eşleşme içindeki kullanıcılar
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

-- user_orders: own only
create policy "user_orders_own" on public.user_orders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Store Waitlist ────────────────────────────────────────────────────────────
create table if not exists public.store_waitlist (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now(),
  unique(email)
);
alter table public.store_waitlist enable row level security;
create policy "waitlist_insert" on public.store_waitlist for insert with check (true);
create policy "waitlist_own"    on public.store_waitlist for select using (auth.uid() = user_id);

-- ── App Sessions (başarı skoru metriği) ───────────────────────────────────────
create table if not exists public.app_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade not null,
  session_date date not null,
  unique(user_id, session_date)
);
alter table public.app_sessions enable row level security;
create policy "sessions_own" on public.app_sessions using (auth.uid() = user_id);

-- ── Performans İndexleri ──────────────────────────────────────────────────────
create index if not exists idx_routines_user_id         on public.routines(user_id);
create index if not exists idx_completions_routine_date on public.routine_completions(routine_id, completed_date);
create index if not exists idx_photos_user_created      on public.photos(user_id, created_at desc);
create index if not exists idx_messages_match_created   on public.messages(match_id, created_at asc);
create index if not exists idx_matches_user_a           on public.matches(user_a, status);
create index if not exists idx_matches_user_b           on public.matches(user_b, status);

-- ── Profiles: timezone kolonu ─────────────────────────────────────────────────
alter table public.profiles
  add column if not exists timezone text not null default 'Europe/Istanbul';

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
alter publication supabase_realtime add table public.messages;
