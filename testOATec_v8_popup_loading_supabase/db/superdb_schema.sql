-- OATec ITBA · Esquema seguro para SuperBase / Supabase
-- Incluye:
-- - tests + questions + attempts
-- - ranking público
-- - admin real con Supabase Auth
-- - RLS endurecido
-- - soporte realtime
-- IMPORTANTE:
-- 1) Ejecutá todo este archivo en SQL Editor.
-- 2) Luego creá el usuario admin en Authentication.
-- 3) Después ejecutá admin_setup.sql con el UUID real del usuario admin.

create extension if not exists pgcrypto;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles ap
    where ap.user_id = uid
      and ap.role = 'admin'
      and ap.is_active = true
  );
$$;

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  full_name text,
  role text not null default 'admin' check (role in ('admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  area text,
  time_limit_minutes integer not null default 25 check (time_limit_minutes > 0),
  timer_mode text not null default 'desc' check (timer_mode in ('asc','desc')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  position integer not null default 1,
  prompt text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option text not null check (correct_option in ('A','B','C','D')),
  explanation text,
  created_at timestamptz not null default now()
);

create index if not exists idx_questions_test_id on public.questions(test_id, position);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  test_title text not null,
  first_name text not null,
  last_name text not null,
  dni text not null,
  age integer,
  course text,
  division text,
  total_questions integer not null check (total_questions >= 0),
  correct_answers integer not null check (correct_answers >= 0),
  score_percentage numeric(5,2) not null check (score_percentage >= 0 and score_percentage <= 100),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  timer_mode text not null default 'desc' check (timer_mode in ('asc','desc')),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_attempts_test_id on public.attempts(test_id, created_at desc);
create index if not exists idx_attempts_ranking on public.attempts(test_id, correct_answers desc, score_percentage desc, duration_seconds asc);

create or replace view public.v_attempt_rankings as
select
  a.id,
  a.test_id,
  t.title as test_title,
  a.first_name,
  a.last_name,
  a.dni,
  a.age,
  a.course,
  a.division,
  a.total_questions,
  a.correct_answers,
  a.score_percentage,
  a.duration_seconds,
  a.timer_mode,
  a.approved,
  a.created_at,
  row_number() over (
    partition by a.test_id
    order by a.correct_answers desc, a.score_percentage desc, a.duration_seconds asc, a.created_at asc
  ) as ranking_position
from public.attempts a
join public.tests t on t.id = a.test_id;

create or replace view public.v_public_attempts as
select
  vr.id,
  vr.test_id,
  vr.test_title,
  vr.first_name,
  vr.last_name,
  vr.course,
  vr.division,
  vr.total_questions,
  vr.correct_answers,
  vr.score_percentage,
  vr.duration_seconds,
  vr.timer_mode,
  vr.approved,
  vr.created_at,
  vr.ranking_position
from public.v_attempt_rankings vr;

grant select on public.v_attempt_rankings to authenticated;
grant select on public.v_public_attempts to anon, authenticated;

alter table public.admin_profiles enable row level security;
alter table public.tests enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;

drop policy if exists "admin read own profile" on public.admin_profiles;
create policy "admin read own profile"
on public.admin_profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "public read active tests" on public.tests;
create policy "public read active tests"
on public.tests
for select
to anon, authenticated
using (is_active = true or public.is_admin(auth.uid()));

drop policy if exists "admins manage tests" on public.tests;
create policy "admins manage tests"
on public.tests
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "public read questions of active tests" on public.questions;
create policy "public read questions of active tests"
on public.questions
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.tests t
    where t.id = questions.test_id
      and (t.is_active = true or public.is_admin(auth.uid()))
  )
);

drop policy if exists "admins manage questions" on public.questions;
create policy "admins manage questions"
on public.questions
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "public insert attempts" on public.attempts;
create policy "public insert attempts"
on public.attempts
for insert
to anon, authenticated
with check (true);

drop policy if exists "admins read attempts" on public.attempts;
create policy "admins read attempts"
on public.attempts
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "admins delete attempts" on public.attempts;
create policy "admins delete attempts"
on public.attempts
for delete
to authenticated
using (public.is_admin(auth.uid()));

insert into public.tests (id, title, description, area, time_limit_minutes, timer_mode, is_active)
values
  ('11111111-1111-1111-1111-111111111111', 'Simulacro OATec · Desafío espacial', 'Prueba breve de ejemplo para entrenamiento inicial.', 'Ciencias y lógica', 20, 'desc', true),
  ('22222222-2222-2222-2222-222222222222', 'Simulacro OATec · Ambiente y ciudades', 'Preguntas ejemplo sobre ambiente, datos y ciudad inteligente.', 'Ambiente', 18, 'desc', true)
on conflict (id) do nothing;

insert into public.questions (test_id, position, prompt, option_a, option_b, option_c, option_d, correct_option, explanation)
values
  ('11111111-1111-1111-1111-111111111111', 1, '¿Qué planeta del sistema solar es conocido como el planeta rojo?', 'Venus', 'Marte', 'Júpiter', 'Mercurio', 'B', 'Marte recibe ese nombre por el color rojizo de su superficie.'),
  ('11111111-1111-1111-1111-111111111111', 2, 'Si un robot avanza 3 metros y luego 2 metros más, ¿cuánto recorrió en total?', '1 metro', '3 metros', '5 metros', '6 metros', 'C', '3 + 2 = 5.'),
  ('11111111-1111-1111-1111-111111111111', 3, '¿Qué sensor se usa normalmente para medir distancia en robótica educativa?', 'Ultrasonido', 'Termómetro', 'Acelerómetro', 'Barómetro', 'A', 'El sensor ultrasónico es muy común para medir distancias.'),
  ('22222222-2222-2222-2222-222222222222', 1, '¿Cuál es una fuente de energía renovable?', 'Petróleo', 'Carbón', 'Solar', 'Gas natural', 'C', 'La energía solar proviene del sol y es renovable.'),
  ('22222222-2222-2222-2222-222222222222', 2, 'En una ciudad inteligente, los sensores sirven para:', 'Generar humo', 'Recolectar datos', 'Pintar edificios', 'Duplicar calles', 'B', 'Los sensores recogen datos para mejorar decisiones.')
on conflict do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime'
      and n.nspname = 'public'
      and c.relname = 'tests'
  ) then
    alter publication supabase_realtime add table public.tests;
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime'
      and n.nspname = 'public'
      and c.relname = 'questions'
  ) then
    alter publication supabase_realtime add table public.questions;
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime'
      and n.nspname = 'public'
      and c.relname = 'attempts'
  ) then
    alter publication supabase_realtime add table public.attempts;
  end if;
exception
  when undefined_object then
    raise notice 'La publicación supabase_realtime no está disponible todavía. Activala desde Supabase si hace falta.';
end $$;
