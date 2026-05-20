-- Routine Notes tablosu
create table if not exists public.routine_notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade not null,
  routine_id uuid references public.routines(id) on delete cascade not null,
  note_date  date not null,
  text       text not null,
  created_at timestamptz not null default now()
);

alter table public.routine_notes enable row level security;

create policy "routine_notes_own" on public.routine_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "routine_notes_mate_select" on public.routine_notes for select using (
  exists (
    select 1 from public.matches m
    where m.status = 'active'
      and ((m.user_a = auth.uid() and m.user_b = routine_notes.user_id)
        or (m.user_b = auth.uid() and m.user_a = routine_notes.user_id))
  )
);

create index if not exists idx_routine_notes_routine on public.routine_notes(routine_id, note_date desc);
create index if not exists idx_routine_notes_user on public.routine_notes(user_id);
