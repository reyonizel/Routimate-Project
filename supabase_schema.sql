-- RoutinMate Supabase Schema
-- Supabase Dashboard → SQL Editor → New Query → Yapıştır → Run

-- ── Profiles ──────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  username        text unique not null default '',
  full_name       text,
  bio             text,
  birth_date      text,
  location_name   text,
  gender          text not null default 'male',
  avatar_url      text,
  is_pro          boolean not null default false,
  interests       text[] not null default '{}',
  achievement_score int not null default 0,
  matched_since   timestamptz,
  created_at      timestamptz not null default now()
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
  id            uuid primary key default gen_random_uuid(),
  user1_id      uuid references public.profiles(id) on delete cascade not null,
  user2_id      uuid references public.profiles(id) on delete cascade not null,
  matched_since timestamptz not null default now(),
  unique (user1_id, user2_id)
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

-- routines: sadece kendi rutinleri
create policy "routines_own" on public.routines using (auth.uid() = user_id);
-- eşleşilen kişinin rutinlerini de görebilsin
create policy "routines_mate_select" on public.routines for select using (
  auth.uid() = user_id or exists (
    select 1 from public.matches
    where (user1_id = auth.uid() and user2_id = user_id)
       or (user2_id = auth.uid() and user1_id = user_id)
  )
);

-- routine_completions: kendi tamamlamaları
create policy "completions_own" on public.routine_completions using (auth.uid() = user_id);
create policy "completions_mate_select" on public.routine_completions for select using (
  auth.uid() = user_id or exists (
    select 1 from public.matches
    where (user1_id = auth.uid() and user2_id = user_id)
       or (user2_id = auth.uid() and user1_id = user_id)
  )
);

-- rest_days: kendi
create policy "rest_days_own" on public.rest_days using (auth.uid() = user_id);

-- photos: kendi
create policy "photos_own" on public.photos using (auth.uid() = user_id);
create policy "photos_mate_select" on public.photos for select using (
  auth.uid() = user_id or exists (
    select 1 from public.matches
    where (user1_id = auth.uid() and user2_id = user_id)
       or (user2_id = auth.uid() and user1_id = user_id)
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
  auth.uid() = user1_id or auth.uid() = user2_id
);
create policy "matches_insert" on public.matches for insert with check (
  auth.uid() = user1_id or auth.uid() = user2_id
);
create policy "matches_delete" on public.matches for delete using (
  auth.uid() = user1_id or auth.uid() = user2_id
);

-- messages: eşleşme içindeki kullanıcılar
create policy "messages_select" on public.messages for select using (
  exists (
    select 1 from public.matches
    where id = match_id and (user1_id = auth.uid() or user2_id = auth.uid())
  )
);
create policy "messages_insert" on public.messages for insert with check (
  auth.uid() = sender_id and exists (
    select 1 from public.matches
    where id = match_id and (user1_id = auth.uid() or user2_id = auth.uid())
  )
);
