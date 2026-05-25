-- ============================================================
-- RoutinMate – Tam Veritabanı Şeması
-- Yeni bir Supabase projesine yapıştırarak kullanabilirsin.
-- SQL Editor > yeni sorgu > tümünü yapıştır > çalıştır.
-- ============================================================

-- ─── Uzantılar ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── TABLOLAR ─────────────────────────────────────────────────

-- Kullanıcı profilleri (auth.users ile 1-1 ilişki)
create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  username            text unique,
  full_name           text,
  bio                 text,
  birth_date          date,
  location_name       text,
  location_lat        float8,
  location_lon        float8,
  gender              text not null default 'male' check (gender in ('male','female')),
  avatar_url          text,
  is_pro              boolean not null default false,
  interests           text[] not null default '{}',
  achievement_score   integer not null default 0,
  matched_since       timestamptz,
  inactive_sets       text[] not null default '{}',
  notification_sound  text not null default 'default',
  completion_sound    text not null default 'correct',
  push_token          text,
  created_at          timestamptz not null default now()
);

-- Rutinler
create table if not exists public.routines (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  name              text not null,
  description       text,
  frequency         text not null check (frequency in ('daily','weekly','monthly')),
  notification_time text not null default '09:00',
  target_days       integer[] not null default '{}',
  monthly_days      integer[] not null default '{}',
  set_name          text,
  set_icon          text,
  scope             text not null default 'recurring' check (scope in ('recurring','once')),
  once_start        date,
  once_end          date,
  created_at        timestamptz not null default now()
);

-- Rutin tamamlama kayıtları
create table if not exists public.routine_completions (
  routine_id      uuid not null references public.routines(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  completed_date  date not null,
  primary key (routine_id, completed_date)
);

-- Dinlenme günleri
create table if not exists public.rest_days (
  user_id   uuid not null references public.profiles(id) on delete cascade,
  rest_date date not null,
  primary key (user_id, rest_date)
);

-- Fotoğraflar (kanıt + profil)
create table if not exists public.photos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  url         text not null,
  is_pinned   boolean not null default false,
  proof_meta  jsonb,
  uploaded_at timestamptz not null default now()
);

-- Eşleşme istekleri
create table if not exists public.match_requests (
  id          uuid primary key default gen_random_uuid(),
  from_user   uuid not null references public.profiles(id) on delete cascade,
  to_user     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (from_user, to_user)
);

-- Aktif/geçmiş eşleşmeler
create table if not exists public.matches (
  id          uuid primary key default gen_random_uuid(),
  user_a      uuid not null references public.profiles(id) on delete cascade,
  user_b      uuid not null references public.profiles(id) on delete cascade,
  status      text not null default 'active' check (status in ('active','ended')),
  matched_at  timestamptz not null default now(),
  ended_at    timestamptz,
  unique (user_a, user_b)
);

-- Sohbet mesajları
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.matches(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id) on delete cascade,
  text       text not null,
  created_at timestamptz not null default now()
);

-- Sipariş / mağaza
create table if not exists public.user_orders (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  products     jsonb not null default '[]',
  total        numeric(10,2) not null default 0,
  city         text not null default '',
  district     text not null default '',
  neighborhood text not null default '',
  address      text not null default '',
  phone        text not null default '',
  status       text not null default 'Hazırlanıyor',
  created_at   timestamptz not null default now()
);

-- Mağaza bekleme listesi
create table if not exists public.store_waitlist (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete set null,
  email      text not null unique,
  created_at timestamptz not null default now()
);

-- Uygulama oturumları (skor hesabı için)
create table if not exists public.app_sessions (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  session_date date not null,
  primary key (user_id, session_date)
);

-- Rutin notları
create table if not exists public.routine_notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  routine_id uuid not null references public.routines(id) on delete cascade,
  note_date  date not null,
  text       text not null,
  created_at timestamptz not null default now()
);


-- ─── İNDEKSLER ───────────────────────────────────────────────

create index if not exists idx_routines_user         on public.routines(user_id);
create index if not exists idx_completions_routine   on public.routine_completions(routine_id);
create index if not exists idx_completions_user      on public.routine_completions(user_id);
create index if not exists idx_photos_user           on public.photos(user_id);
create index if not exists idx_messages_match        on public.messages(match_id, created_at asc);
create index if not exists idx_matches_users         on public.matches(user_a, user_b);
create index if not exists idx_match_req_to          on public.match_requests(to_user);
create index if not exists idx_match_req_from        on public.match_requests(from_user);
create index if not exists idx_routine_notes_user    on public.routine_notes(user_id);
create index if not exists idx_routine_notes_routine on public.routine_notes(routine_id, note_date desc);
create index if not exists idx_routines_notif_time   on public.routines(notification_time);


-- ─── ROW LEVEL SECURITY ───────────────────────────────────────

alter table public.profiles            enable row level security;
alter table public.routines            enable row level security;
alter table public.routine_completions enable row level security;
alter table public.rest_days           enable row level security;
alter table public.photos              enable row level security;
alter table public.match_requests      enable row level security;
alter table public.matches             enable row level security;
alter table public.messages            enable row level security;
alter table public.user_orders         enable row level security;
alter table public.store_waitlist      enable row level security;
alter table public.app_sessions        enable row level security;
alter table public.routine_notes       enable row level security;

-- profiles
create policy "profiles_own" on public.profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_select" on public.profiles for select
  using (true);  -- keşfet ekranı tüm profilleri okuyabilir

-- routines
create policy "routines_own" on public.routines for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "routines_mate_select" on public.routines for select
  using (exists (
    select 1 from public.matches m
    where m.status = 'active'
      and ((m.user_a = auth.uid() and m.user_b = routines.user_id)
        or (m.user_b = auth.uid() and m.user_a = routines.user_id))
  ));

-- routine_completions
create policy "completions_own" on public.routine_completions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "completions_mate_select" on public.routine_completions for select
  using (exists (
    select 1 from public.matches m
    where m.status = 'active'
      and ((m.user_a = auth.uid() and m.user_b = routine_completions.user_id)
        or (m.user_b = auth.uid() and m.user_a = routine_completions.user_id))
  ));

-- rest_days
create policy "rest_days_own" on public.rest_days for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- photos
create policy "photos_own" on public.photos for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "photos_mate_select" on public.photos for select
  using (exists (
    select 1 from public.matches m
    where m.status = 'active'
      and ((m.user_a = auth.uid() and m.user_b = photos.user_id)
        or (m.user_b = auth.uid() and m.user_a = photos.user_id))
  ));

-- match_requests
create policy "match_req_sender" on public.match_requests for all
  using (auth.uid() = from_user) with check (auth.uid() = from_user);
create policy "match_req_receiver" on public.match_requests for select
  using (auth.uid() = to_user);

-- matches
create policy "matches_participants_select" on public.matches for select
  using (auth.uid() = user_a or auth.uid() = user_b);
create policy "matches_insert" on public.matches for insert
  with check (auth.uid() = user_a or auth.uid() = user_b);
create policy "matches_update" on public.matches for update
  using (auth.uid() = user_a or auth.uid() = user_b);

-- messages
create policy "messages_participants" on public.messages for all
  using (exists (
    select 1 from public.matches m
    where m.id = messages.match_id
      and (m.user_a = auth.uid() or m.user_b = auth.uid())
  ))
  with check (auth.uid() = sender_id);

-- user_orders
create policy "orders_own" on public.user_orders for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- store_waitlist
create policy "waitlist_insert" on public.store_waitlist for insert
  with check (true);
create policy "waitlist_select" on public.store_waitlist for select
  using (auth.uid() = user_id);

-- app_sessions
create policy "sessions_own" on public.app_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- routine_notes
create policy "routine_notes_own" on public.routine_notes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "routine_notes_mate_select" on public.routine_notes for select
  using (exists (
    select 1 from public.matches m
    where m.status = 'active'
      and ((m.user_a = auth.uid() and m.user_b = routine_notes.user_id)
        or (m.user_b = auth.uid() and m.user_a = routine_notes.user_id))
  ));


-- ─── SQL FONKSİYONLARI ────────────────────────────────────────

-- Başarı skoru: bugün yapılması gereken rutinlerin
-- %70 tamamlama + %30 kanıt fotoğrafı ağırlıklı skoru
create or replace function public.calculate_achievement_score(p_user_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  v_today       date    := current_date;
  v_today_day   integer := extract(dow  from now())::integer;  -- 0=Pazar
  v_today_date  integer := extract(day  from now())::integer;  -- 1-31
  v_total       integer := 0;
  v_completed   integer := 0;
  v_with_photo  integer := 0;
begin
  select count(*) into v_total
  from public.routines r
  where r.user_id = p_user_id
    and (
      r.frequency = 'daily'
      or (r.frequency = 'weekly'  and v_today_day  = any(r.target_days))
      or (r.frequency = 'monthly' and v_today_date = any(r.monthly_days))
    );

  if v_total = 0 then return 0; end if;

  select count(*) into v_completed
  from public.routines r
  join public.routine_completions rc on rc.routine_id = r.id
  where r.user_id = p_user_id
    and rc.completed_date = v_today
    and (
      r.frequency = 'daily'
      or (r.frequency = 'weekly'  and v_today_day  = any(r.target_days))
      or (r.frequency = 'monthly' and v_today_date = any(r.monthly_days))
    );

  select count(distinct (ph.proof_meta->>'routineId')) into v_with_photo
  from public.photos ph
  where ph.user_id = p_user_id
    and ph.proof_meta is not null
    and ph.proof_meta->>'date' = v_today::text;

  return round(
    (v_completed::numeric / v_total) * 70 +
    (least(v_with_photo, v_total)::numeric / v_total) * 30
  )::integer;
end;
$$;


-- ─── REALTIME ─────────────────────────────────────────────────
-- Supabase Dashboard > Database > Replication bölümünden
-- şu tabloları etkinleştir: matches, match_requests, messages


-- ─── STORAGE BUCKET'LARI ──────────────────────────────────────
-- Supabase Dashboard > Storage'da 2 public bucket oluştur:
--   • avatars
--   • photos
-- Her ikisi için "Public bucket" seçeneğini işaretle.


-- ─── EDGE FUNCTIONS ───────────────────────────────────────────
-- Kod: supabase/functions/send-push/            (anlık push)
--      supabase/functions/routine-notifications/ (zamanlı bildirim)
--
-- Deploy komutu:
--   npx supabase functions deploy --project-ref <PROJE_REF>
--
-- FCM secret ayarı:
--   npx supabase secrets set FCM_SERVER_KEY=<KEY> --project-ref <PROJE_REF>
--
-- Zamanlı bildirim için Supabase Dashboard > Edge Functions >
-- routine-notifications > Cron: her dakika tetiklemek için
--   cron: "* * * * *"
