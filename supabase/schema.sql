-- ============================================================
-- RoutinMate – Tam Veritabanı Şeması (gerçek DB'den alındı)
-- Yeni Supabase projesinde: SQL Editor > yapıştır > çalıştır
-- ============================================================

create extension if not exists "uuid-ossp";

-- ─── TABLOLAR ────────────────────────────────────────────────

create table if not exists public.app_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_date date not null,
  unique (user_id, session_date)
);

create table if not exists public.business_accounts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  type text not null,
  status text default 'pending' not null,
  created_at timestamptz default now(),
  constraint business_accounts_type_check check (type = ANY (ARRAY['institution'::text, 'seller'::text])),
  constraint business_accounts_status_check check (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))
);

create table if not exists public.institution_assignments (
  id uuid primary key default gen_random_uuid(),
  set_id uuid references public.institution_routine_sets(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  assigned_at timestamptz default now(),
  accepted boolean default false,
  unique (set_id, student_id)
);

create table if not exists public.institution_routine_sets (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  name text not null,
  description text,
  routines jsonb default '[]' not null,
  created_at timestamptz default now()
);

create table if not exists public.institution_students (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  status text default 'pending' not null,
  added_at timestamptz default now(),
  unique (institution_id, student_id),
  constraint institution_students_status_check check (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text]))
);

create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.business_accounts(id) on delete cascade,
  name text not null,
  contact_name text not null,
  phone text,
  city text,
  created_at timestamptz default now()
);

create table if not exists public.match_requests (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references public.profiles(id) on delete cascade,
  to_user uuid not null references public.profiles(id) on delete cascade,
  status text default 'pending',
  created_at timestamptz default now(),
  responded_at timestamptz,
  unique (from_user, to_user),
  constraint match_requests_status_check check (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text]))
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  status text default 'active',
  matched_at timestamptz default now(),
  ended_at timestamptz,
  unique (user_a, user_b),
  constraint matches_status_check check (status = ANY (ARRAY['active'::text, 'ended'::text]))
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz default now(),
  is_deleted boolean default false,
  is_read boolean default false
);

create table if not exists public.orders (
  id text primary key,
  user_id uuid references public.profiles(id),
  products jsonb default '[]' not null,
  total integer not null,
  city text not null,
  district text not null,
  neighborhood text,
  address text not null,
  phone text not null,
  status text default 'Hazırlanıyor' not null,
  created_at timestamptz default now(),
  constraint orders_status_check check (status = ANY (ARRAY['Hazırlanıyor'::text, 'Kargoya Verildi'::text, 'Teslim Edildi'::text]))
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  url text not null,
  is_pinned boolean default false,
  uploaded_at timestamptz default now(),
  proof_meta jsonb
);

create table if not exists public.profiles (
  id uuid primary key,
  username text not null unique,
  full_name text,
  bio text,
  birth_date date,
  location text,
  gender text not null,
  avatar_url text,
  is_pro boolean default false,
  interests text[] default '{}',
  achievement_score integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  inactive_sets text[] default '{}' not null,
  location_lat float8,
  location_lon float8,
  notification_sound text default 'default' not null,
  completion_sound text default 'correct' not null,
  push_token text,
  timezone text default 'Europe/Istanbul' not null,
  constraint profiles_gender_check check (gender = ANY (ARRAY['male'::text, 'female'::text]))
);

create table if not exists public.rest_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  rest_date date not null,
  unique (user_id, rest_date)
);

create table if not exists public.routine_completions (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  completed_date date not null,
  created_at timestamptz default now(),
  unique (routine_id, completed_date)
);

create table if not exists public.routine_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  routine_id uuid not null references public.routines(id) on delete cascade,
  note_date date not null,
  text text not null,
  created_at timestamptz default now() not null
);

create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  frequency text not null,
  notification_time text,
  target_days integer[] default '{}',
  monthly_days integer[] default '{}',
  created_at timestamptz default now(),
  set_name text,
  scope text default 'recurring' not null,
  once_start text,
  once_end text,
  set_icon text,
  constraint routines_frequency_check check (frequency = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text]))
);

create table if not exists public.seller_products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.sellers(id) on delete cascade,
  name text not null,
  description text,
  price integer not null,
  original_price integer,
  category text not null,
  emoji text default '📦' not null,
  badge text,
  details jsonb default '[]',
  rating numeric default 5.0,
  review_count integer default 0,
  bg_color text default '#F4F4F4',
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.sellers (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.business_accounts(id) on delete cascade,
  shop_name text not null,
  contact_name text not null,
  phone text,
  created_at timestamptz default now()
);

create table if not exists public.store_waitlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  email text not null unique,
  created_at timestamptz default now() not null
);

create table if not exists public.user_orders (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  products jsonb default '[]' not null,
  total integer not null,
  city text default '' not null,
  district text default '' not null,
  neighborhood text default '',
  address text default '' not null,
  phone text default '' not null,
  status text default 'Hazirlanıyor' not null,
  created_at timestamptz default now() not null
);

-- ─── İNDEKSLER ──────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_matches_user_a ON public.matches USING btree (user_a, status);
CREATE INDEX IF NOT EXISTS idx_matches_user_b ON public.matches USING btree (user_b, status);
CREATE INDEX IF NOT EXISTS idx_messages_match_created ON public.messages USING btree (match_id, created_at);
CREATE INDEX IF NOT EXISTS idx_photos_user_created ON public.photos USING btree (user_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_completions_routine_date ON public.routine_completions USING btree (routine_id, completed_date);
CREATE INDEX IF NOT EXISTS idx_notes_routine_id ON public.routine_notes USING btree (routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_notes_routine ON public.routine_notes USING btree (routine_id, note_date DESC);
CREATE INDEX IF NOT EXISTS idx_routine_notes_user ON public.routine_notes USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_routines_user_id ON public.routines USING btree (user_id);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────

alter table public.app_sessions enable row level security;
alter table public.business_accounts enable row level security;
alter table public.institution_assignments enable row level security;
alter table public.institution_routine_sets enable row level security;
alter table public.institution_students enable row level security;
alter table public.institutions enable row level security;
alter table public.match_requests enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.orders enable row level security;
alter table public.photos enable row level security;
alter table public.profiles enable row level security;
alter table public.rest_days enable row level security;
alter table public.routine_completions enable row level security;
alter table public.routine_notes enable row level security;
alter table public.routines enable row level security;
alter table public.seller_products enable row level security;
alter table public.sellers enable row level security;
alter table public.store_waitlist enable row level security;
alter table public.user_orders enable row level security;

create policy "sessions_own" on public.app_sessions as permissive for all
  using ((auth.uid() = user_id));

create policy "business_accounts_own" on public.business_accounts as permissive for all
  using ((auth.uid() = auth_user_id))
  with check ((auth.uid() = auth_user_id));

create policy "assignments_own" on public.institution_assignments as permissive for all
  using (((set_id IN ( SELECT s.id
   FROM ((institution_routine_sets s
     JOIN institutions i ON ((i.id = s.institution_id)))
     JOIN business_accounts ba ON ((ba.id = i.account_id)))
  WHERE (ba.auth_user_id = auth.uid()))) OR (student_id = auth.uid())))
  with check ((set_id IN ( SELECT s.id
   FROM ((institution_routine_sets s
     JOIN institutions i ON ((i.id = s.institution_id)))
     JOIN business_accounts ba ON ((ba.id = i.account_id)))
  WHERE (ba.auth_user_id = auth.uid()))));

create policy "sets_own" on public.institution_routine_sets as permissive for all
  using ((institution_id IN ( SELECT i.id
   FROM (institutions i
     JOIN business_accounts ba ON ((ba.id = i.account_id)))
  WHERE (ba.auth_user_id = auth.uid()))))
  with check ((institution_id IN ( SELECT i.id
   FROM (institutions i
     JOIN business_accounts ba ON ((ba.id = i.account_id)))
  WHERE (ba.auth_user_id = auth.uid()))));

create policy "institution_students_own" on public.institution_students as permissive for all
  using ((institution_id IN ( SELECT i.id
   FROM (institutions i
     JOIN business_accounts ba ON ((ba.id = i.account_id)))
  WHERE (ba.auth_user_id = auth.uid()))))
  with check ((institution_id IN ( SELECT i.id
   FROM (institutions i
     JOIN business_accounts ba ON ((ba.id = i.account_id)))
  WHERE (ba.auth_user_id = auth.uid()))));

create policy "institution_students_self" on public.institution_students as permissive for select
  using ((student_id = auth.uid()));

create policy "institution_students_self_update" on public.institution_students as permissive for update
  using ((student_id = auth.uid()));

create policy "institutions_own" on public.institutions as permissive for all
  using ((account_id IN ( SELECT business_accounts.id
   FROM business_accounts
  WHERE (business_accounts.auth_user_id = auth.uid()))))
  with check ((account_id IN ( SELECT business_accounts.id
   FROM business_accounts
  WHERE (business_accounts.auth_user_id = auth.uid()))));

create policy "requests_delete" on public.match_requests as permissive for delete
  using (((auth.uid() = from_user) OR (auth.uid() = to_user)));

create policy "requests_delete_own" on public.match_requests as permissive for delete
  using (((auth.uid() = from_user) OR (auth.uid() = to_user)));

create policy "requests_insert" on public.match_requests as permissive for insert
  with check ((auth.uid() = from_user));

create policy "requests_insert_own" on public.match_requests as permissive for insert
  with check ((auth.uid() = from_user));

create policy "requests_select" on public.match_requests as permissive for select
  using (((auth.uid() = from_user) OR (auth.uid() = to_user)));

create policy "requests_select_own" on public.match_requests as permissive for select
  using (((auth.uid() = from_user) OR (auth.uid() = to_user)));

create policy "requests_update_received" on public.match_requests as permissive for update
  using ((auth.uid() = to_user));

create policy "matches_insert" on public.matches as permissive for insert
  with check (((auth.uid() = user_a) OR (auth.uid() = user_b)));

create policy "matches_insert_own" on public.matches as permissive for insert
  with check (((auth.uid() = user_a) OR (auth.uid() = user_b)));

create policy "matches_select" on public.matches as permissive for select
  using (((auth.uid() = user_a) OR (auth.uid() = user_b)));

create policy "matches_select_own" on public.matches as permissive for select
  using (((auth.uid() = user_a) OR (auth.uid() = user_b)));

create policy "matches_update" on public.matches as permissive for update
  using (((auth.uid() = user_a) OR (auth.uid() = user_b)));

create policy "matches_update_own" on public.matches as permissive for update
  using (((auth.uid() = user_a) OR (auth.uid() = user_b)))
  with check (((auth.uid() = user_a) OR (auth.uid() = user_b)));

create policy "messages_delete" on public.messages as permissive for delete
  using ((auth.uid() = sender_id));

create policy "messages_insert" on public.messages as permissive for insert
  with check (((auth.uid() = sender_id) AND (EXISTS ( SELECT 1
   FROM matches m
  WHERE ((m.id = messages.match_id) AND (m.status = 'active'::text) AND ((m.user_a = auth.uid()) OR (m.user_b = auth.uid())))))));

create policy "messages_insert_match" on public.messages as permissive for insert
  with check (((auth.uid() = sender_id) AND (EXISTS ( SELECT 1
   FROM matches m
  WHERE ((m.id = messages.match_id) AND (m.status = 'active'::text) AND ((m.user_a = auth.uid()) OR (m.user_b = auth.uid())))))));

create policy "messages_select" on public.messages as permissive for select
  using ((EXISTS ( SELECT 1
   FROM matches m
  WHERE ((m.id = messages.match_id) AND (m.status = 'active'::text) AND ((m.user_a = auth.uid()) OR (m.user_b = auth.uid()))))));

create policy "messages_select_match" on public.messages as permissive for select
  using ((EXISTS ( SELECT 1
   FROM matches m
  WHERE ((m.id = messages.match_id) AND (m.status = 'active'::text) AND ((m.user_a = auth.uid()) OR (m.user_b = auth.uid()))))));

create policy "messages_update_own" on public.messages as permissive for update
  using ((auth.uid() = sender_id));

create policy "orders_business_read" on public.orders as permissive for select
  using ((auth.uid() IN ( SELECT ba.auth_user_id
   FROM business_accounts ba
  WHERE (ba.status = 'approved'::text))));

create policy "orders_own" on public.orders as permissive for all
  using ((user_id = auth.uid()))
  with check ((user_id = auth.uid()));

create policy "photos_delete_own" on public.photos as permissive for delete
  using ((auth.uid() = user_id));

create policy "photos_insert_own" on public.photos as permissive for insert
  with check ((auth.uid() = user_id));

create policy "photos_mate_select" on public.photos as permissive for select
  using (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM matches m
  WHERE ((m.status = 'active'::text) AND (((m.user_a = auth.uid()) AND (m.user_b = photos.user_id)) OR ((m.user_b = auth.uid()) AND (m.user_a = photos.user_id))))))));

create policy "photos_own" on public.photos as permissive for all
  using ((auth.uid() = user_id));

create policy "photos_select_all" on public.photos as permissive for select
  using (true);

create policy "photos_update_own" on public.photos as permissive for update
  using ((auth.uid() = user_id));

create policy "profiles_delete_own" on public.profiles as permissive for delete
  using ((auth.uid() = id));

create policy "profiles_insert" on public.profiles as permissive for insert
  with check ((auth.uid() = id));

create policy "profiles_insert_own" on public.profiles as permissive for insert
  with check ((auth.uid() = id));

create policy "profiles_select" on public.profiles as permissive for select
  using (true);

create policy "profiles_select_all" on public.profiles as permissive for select
  using (true);

create policy "profiles_update" on public.profiles as permissive for update
  using ((auth.uid() = id));

create policy "profiles_update_own" on public.profiles as permissive for update
  using ((auth.uid() = id));

create policy "rest_days_delete_own" on public.rest_days as permissive for delete
  using ((auth.uid() = user_id));

create policy "rest_days_insert_own" on public.rest_days as permissive for insert
  with check ((auth.uid() = user_id));

create policy "rest_days_own" on public.rest_days as permissive for all
  using ((auth.uid() = user_id));

create policy "rest_days_select_own" on public.rest_days as permissive for select
  using ((auth.uid() = user_id));

create policy "completions_delete_own" on public.routine_completions as permissive for delete
  using ((auth.uid() = user_id));

create policy "completions_insert_own" on public.routine_completions as permissive for insert
  with check ((auth.uid() = user_id));

create policy "completions_mate_select" on public.routine_completions as permissive for select
  using (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM matches m
  WHERE ((m.status = 'active'::text) AND (((m.user_a = auth.uid()) AND (m.user_b = routine_completions.user_id)) OR ((m.user_b = auth.uid()) AND (m.user_a = routine_completions.user_id))))))));

create policy "completions_own" on public.routine_completions as permissive for all
  using ((auth.uid() = user_id));

create policy "completions_select_mate" on public.routine_completions as permissive for select
  using ((EXISTS ( SELECT 1
   FROM matches m
  WHERE ((m.status = 'active'::text) AND (((m.user_a = auth.uid()) AND (m.user_b = routine_completions.user_id)) OR ((m.user_b = auth.uid()) AND (m.user_a = routine_completions.user_id)))))));

create policy "completions_select_own" on public.routine_completions as permissive for select
  using ((auth.uid() = user_id));

create policy "notes_own" on public.routine_notes as permissive for all
  using ((auth.uid() = user_id));

create policy "routine_notes_mate_select" on public.routine_notes as permissive for select
  using ((EXISTS ( SELECT 1
   FROM matches m
  WHERE ((m.status = 'active'::text) AND (((m.user_a = auth.uid()) AND (m.user_b = routine_notes.user_id)) OR ((m.user_b = auth.uid()) AND (m.user_a = routine_notes.user_id)))))));

create policy "routine_notes_own" on public.routine_notes as permissive for all
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy "routines_delete_own" on public.routines as permissive for delete
  using ((auth.uid() = user_id));

create policy "routines_insert_own" on public.routines as permissive for insert
  with check ((auth.uid() = user_id));

create policy "routines_select_mate" on public.routines as permissive for select
  using ((EXISTS ( SELECT 1
   FROM matches m
  WHERE ((m.status = 'active'::text) AND (((m.user_a = auth.uid()) AND (m.user_b = routines.user_id)) OR ((m.user_b = auth.uid()) AND (m.user_a = routines.user_id)))))));

create policy "routines_select_own" on public.routines as permissive for select
  using ((auth.uid() = user_id));

create policy "routines_update_own" on public.routines as permissive for update
  using ((auth.uid() = user_id));

create policy "seller_products_own" on public.seller_products as permissive for all
  using ((seller_id IN ( SELECT s.id
   FROM (sellers s
     JOIN business_accounts ba ON ((ba.id = s.account_id)))
  WHERE (ba.auth_user_id = auth.uid()))))
  with check ((seller_id IN ( SELECT s.id
   FROM (sellers s
     JOIN business_accounts ba ON ((ba.id = s.account_id)))
  WHERE (ba.auth_user_id = auth.uid()))));

create policy "seller_products_read" on public.seller_products as permissive for select
  using ((active = true));

create policy "sellers_own" on public.sellers as permissive for all
  using ((account_id IN ( SELECT business_accounts.id
   FROM business_accounts
  WHERE (business_accounts.auth_user_id = auth.uid()))))
  with check ((account_id IN ( SELECT business_accounts.id
   FROM business_accounts
  WHERE (business_accounts.auth_user_id = auth.uid()))));

create policy "waitlist_insert" on public.store_waitlist as permissive for insert
  with check (true);

create policy "waitlist_own" on public.store_waitlist as permissive for select
  using ((auth.uid() = user_id));

create policy "user_orders_own" on public.user_orders as permissive for all
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

-- ─── FONKSİYONLAR ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.calculate_achievement_score(p_user_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER
AS $$
declare
  total_routines  int; completed_30 int; session_30 int;
  total_photos    int; proof_photos int;
  completion_pct  int; session_pct  int; proof_pct  int; final_score int;
begin
  select count(*) into total_routines from public.routines
    where user_id = p_user_id and scope = 'recurring';
  select count(*) into completed_30 from public.routine_completions
    where user_id = p_user_id and completed_date >= current_date - 29;
  select count(*) into session_30 from public.app_sessions
    where user_id = p_user_id and session_date >= current_date - 29;
  select count(*), count(case when proof_meta is not null then 1 end)
    into total_photos, proof_photos from public.photos where user_id = p_user_id;
  completion_pct := least(100, case when total_routines = 0 then 0
    else (completed_30 * 100) / (total_routines * 30) end);
  session_pct := least(100, (session_30 * 100) / 30);
  proof_pct   := least(100, case when total_photos = 0 then 0
    else (proof_photos * 100) / total_photos end);
  final_score := least(100,
    (completion_pct * 60 / 100) + (session_pct * 20 / 100) + (proof_pct * 15 / 100) + 5);
  return final_score;
end;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
AS $$
begin
  insert into public.profiles (id, username, gender, interests, achievement_score)
  values (new.id, split_part(new.email, '@', 1), 'male', '{}', 0)
  on conflict (id) do nothing;
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Kullanici oturumu bulunamadi'; END IF;
  DELETE FROM public.messages WHERE match_id IN (SELECT id FROM public.matches WHERE user_a = uid OR user_b = uid);
  DELETE FROM public.matches WHERE user_a = uid OR user_b = uid;
  DELETE FROM public.match_requests WHERE from_user = uid OR to_user = uid;
  DELETE FROM public.routine_completions WHERE user_id = uid;
  DELETE FROM public.routines WHERE user_id = uid;
  DELETE FROM public.rest_days WHERE user_id = uid;
  DELETE FROM public.photos WHERE user_id = uid;
  DELETE FROM public.profiles WHERE id = uid;
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

-- ─── TRİGGER: yeni kayıt → profil oto-oluşturma ─────────────

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── REALTIME ────────────────────────────────────────────────
-- Dashboard > Database > Replication > etkinleştir:
-- matches, match_requests, messages

-- ─── STORAGE BUCKET'LARI ─────────────────────────────────────
-- Dashboard > Storage > New Bucket (Public: true):
--   avatars
--   photos

-- ─── EDGE FUNCTIONS ──────────────────────────────────────────
-- npx supabase functions deploy --project-ref <PROJE_REF>
-- npx supabase secrets set FCM_SERVER_KEY=<KEY> --project-ref <PROJE_REF>
-- Cron (routine-notifications): Dashboard > Edge Functions > Schedule: * * * * *
