
-- OATec ITBA · Base de datos única, completa y compatible con tu proyecto
-- Ejecutar TODO este archivo en Supabase SQL Editor.
-- Luego crear el usuario admin en Authentication:
--   email: fernando.m.gambino@gmail.com
--   password: Jamboree0342$$
-- Después volver a ejecutar ESTE MISMO ARCHIVO o solo el bloque final de sincronización de admin.
--
-- IMPORTANTE:
-- - Este script recrea el esquema OATec para evitar conflictos con versiones previas.
-- - Está pensado para el frontend de tu proyecto adjunto, que usa:
--   tests.is_active, tests.time_limit_minutes, tests.timer_mode,
--   tabla questions separada y tabla attempts para ranking.

begin;

create extension if not exists pgcrypto;

-- Limpieza segura para evitar errores por esquemas previos incompatibles
drop view if exists public.v_public_attempts cascade;
drop view if exists public.v_attempt_rankings cascade;
drop function if exists public.is_admin(uuid) cascade;
drop function if exists public.set_updated_at() cascade;

drop table if exists public.attempts cascade;
drop table if exists public.questions cascade;
drop table if exists public.tests cascade;
drop table if exists public.admin_profiles cascade;

-- =========================================================
-- TABLAS
-- =========================================================

create table public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  full_name text,
  role text not null default 'admin' check (role in ('admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  area text default '',
  time_limit_minutes integer not null default 25 check (time_limit_minutes > 0),
  timer_mode text not null default 'desc' check (timer_mode in ('asc', 'desc')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  position integer not null default 1 check (position > 0),
  prompt text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option text not null check (correct_option in ('A', 'B', 'C', 'D')),
  explanation text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (test_id, position)
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  test_title text not null,
  first_name text not null,
  last_name text not null,
  dni text not null,
  age integer,
  course text,
  division text,
  total_questions integer not null default 0 check (total_questions >= 0),
  correct_answers integer not null default 0 check (correct_answers >= 0),
  score_percentage numeric(5,2) not null default 0 check (score_percentage >= 0 and score_percentage <= 100),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  timer_mode text not null default 'desc' check (timer_mode in ('asc', 'desc')),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_tests_is_active on public.tests(is_active, created_at desc);
create index idx_questions_test_id_position on public.questions(test_id, position);
create index idx_attempts_test_id_created_at on public.attempts(test_id, created_at desc);
create index idx_attempts_ranking on public.attempts(test_id, correct_answers desc, score_percentage desc, duration_seconds asc, created_at asc);
create index idx_attempts_dni on public.attempts(dni);

-- =========================================================
-- TRIGGER PARA updated_at
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_admin_profiles_updated_at
before update on public.admin_profiles
for each row execute function public.set_updated_at();

create trigger trg_tests_updated_at
before update on public.tests
for each row execute function public.set_updated_at();

create trigger trg_questions_updated_at
before update on public.questions
for each row execute function public.set_updated_at();

-- =========================================================
-- FUNCIÓN DE ADMIN
-- =========================================================

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

-- =========================================================
-- VISTAS DE RANKING
-- =========================================================

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
    order by
      a.correct_answers desc,
      a.score_percentage desc,
      a.duration_seconds asc,
      a.created_at asc
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

-- =========================================================
-- RLS
-- =========================================================

alter table public.admin_profiles enable row level security;
alter table public.tests enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;

-- admin_profiles
create policy "admin read own profile"
on public.admin_profiles
for select
to authenticated
using (auth.uid() = user_id);

create policy "admin upsert own profile insert"
on public.admin_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "admin update own profile"
on public.admin_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- tests
create policy "public read active tests"
on public.tests
for select
to anon, authenticated
using (is_active = true or public.is_admin(auth.uid()));

create policy "admins manage tests"
on public.tests
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- questions
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

create policy "admins manage questions"
on public.questions
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- attempts
create policy "public insert attempts"
on public.attempts
for insert
to anon, authenticated
with check (true);

create policy "public read ranking view only through view"
on public.attempts
for select
to authenticated
using (public.is_admin(auth.uid()));

create policy "admins delete attempts"
on public.attempts
for delete
to authenticated
using (public.is_admin(auth.uid()));

-- =========================================================
-- DATOS INICIALES DE EJEMPLO
-- =========================================================

insert into public.tests (id, title, description, area, time_limit_minutes, timer_mode, is_active)
values
  ('11111111-1111-1111-1111-111111111111', 'Simulacro OATec · Desafío espacial', 'Prueba breve de ejemplo para entrenamiento inicial.', 'Ciencias y lógica', 20, 'desc', true),
  ('22222222-2222-2222-2222-222222222222', 'Simulacro OATec · Ambiente y ciudades', 'Preguntas ejemplo sobre ambiente, datos y ciudad inteligente.', 'Ambiente', 18, 'desc', true);

insert into public.questions (test_id, position, prompt, option_a, option_b, option_c, option_d, correct_option, explanation)
values
  ('11111111-1111-1111-1111-111111111111', 1, '¿Qué planeta del sistema solar es conocido como el planeta rojo?', 'Venus', 'Marte', 'Júpiter', 'Mercurio', 'B', 'Marte recibe ese nombre por el color rojizo de su superficie.'),
  ('11111111-1111-1111-1111-111111111111', 2, 'Si un robot avanza 3 metros y luego 2 metros más, ¿cuánto recorrió en total?', '1 metro', '3 metros', '5 metros', '6 metros', 'C', '3 + 2 = 5.'),
  ('11111111-1111-1111-1111-111111111111', 3, '¿Qué sensor se usa normalmente para medir distancia en robótica educativa?', 'Ultrasonido', 'Termómetro', 'Acelerómetro', 'Barómetro', 'A', 'El sensor ultrasónico es muy común para medir distancias.'),
  ('22222222-2222-2222-2222-222222222222', 1, '¿Cuál es una fuente de energía renovable?', 'Petróleo', 'Carbón', 'Solar', 'Gas natural', 'C', 'La energía solar proviene del sol y es renovable.'),
  ('22222222-2222-2222-2222-222222222222', 2, 'En una ciudad inteligente, los sensores sirven para:', 'Generar humo', 'Recolectar datos', 'Pintar edificios', 'Duplicar calles', 'B', 'Los sensores recogen datos para mejorar decisiones.');

-- =========================================================
-- REAlTIME
-- =========================================================

do $$
begin
  begin
    alter publication supabase_realtime add table public.tests;
  exception when duplicate_object then null;
  when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.questions;
  exception when duplicate_object then null;
  when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.attempts;
  exception when duplicate_object then null;
  when undefined_object then null;
  end;
end $$;

-- =========================================================
-- SINCRONIZACIÓN DEL ADMIN POR EMAIL
-- =========================================================
-- Si ya creaste en Authentication el usuario fernando.m.gambino@gmail.com,
-- este bloque lo vincula automáticamente a admin_profiles.
-- Si todavía no existe, solo muestra un notice y no falla.

do $$
declare
  v_admin_id uuid;
begin
  select id
    into v_admin_id
  from auth.users
  where email = 'fernando.m.gambino@gmail.com'
  order by created_at asc
  limit 1;

  if v_admin_id is null then
    raise notice 'Todavía no existe el usuario fernando.m.gambino@gmail.com en Authentication. Crealo y luego reejecutá este archivo.';
  else
    insert into public.admin_profiles (user_id, username, full_name, role, is_active)
    values (v_admin_id, 'fmgambino', 'Fernando Gambino', 'admin', true)
    on conflict (user_id) do update
      set username = excluded.username,
          full_name = excluded.full_name,
          role = excluded.role,
          is_active = excluded.is_active,
          updated_at = now();

    raise notice 'Admin vinculado correctamente con user_id=%', v_admin_id;
  end if;
end $$;

commit;
