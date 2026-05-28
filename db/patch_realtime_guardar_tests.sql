-- =========================================================
-- PATCH OATec v8 · Supabase Realtime + guardado de tests
-- Ejecutar UNA VEZ en Supabase > SQL Editor.
-- No borra datos existentes.
-- =========================================================

-- 1) Función segura para validar administradores desde policies RLS
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

-- 2) Asegurar perfil admin para el usuario de Auth indicado.
-- Primero creá este usuario en Authentication con email fernando.m.gambino@gmail.com.
insert into public.admin_profiles (user_id, username, full_name, role, is_active)
select u.id, 'fmgambino', 'Fernando Gambino', 'admin', true
from auth.users u
where lower(u.email) = lower('fernando.m.gambino@gmail.com')
on conflict (user_id) do update
set username = excluded.username,
    full_name = excluded.full_name,
    role = 'admin',
    is_active = true,
    updated_at = now();

-- 3) Permisos base de API para roles usados por supabase-js
grant usage on schema public to anon, authenticated;
grant select on public.tests to anon, authenticated;
grant select on public.questions to anon, authenticated;
grant insert on public.attempts to anon, authenticated;
grant select, insert, update, delete on public.tests to authenticated;
grant select, insert, update, delete on public.questions to authenticated;
grant select, delete on public.attempts to authenticated;
grant select on public.admin_profiles to authenticated;

-- 4) RLS
alter table public.admin_profiles enable row level security;
alter table public.tests enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;

-- admin_profiles
drop policy if exists "admin read own profile" on public.admin_profiles;
create policy "admin read own profile"
on public.admin_profiles
for select
to authenticated
using (auth.uid() = user_id);

-- tests
drop policy if exists "public read active tests" on public.tests;
create policy "public read active tests"
on public.tests
for select
to anon, authenticated
using (is_active = true or public.is_admin(auth.uid()));

drop policy if exists "admins insert tests" on public.tests;
create policy "admins insert tests"
on public.tests
for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists "admins update tests" on public.tests;
create policy "admins update tests"
on public.tests
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "admins delete tests" on public.tests;
create policy "admins delete tests"
on public.tests
for delete
to authenticated
using (public.is_admin(auth.uid()));

-- questions
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

drop policy if exists "admins insert questions" on public.questions;
create policy "admins insert questions"
on public.questions
for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists "admins update questions" on public.questions;
create policy "admins update questions"
on public.questions
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "admins delete questions" on public.questions;
create policy "admins delete questions"
on public.questions
for delete
to authenticated
using (public.is_admin(auth.uid()));

-- attempts
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

-- 5) Realtime: publicar tablas para postgres_changes
-- Supabase Realtime usa la publicación supabase_realtime.
do $$
begin
  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime' and n.nspname = 'public' and c.relname = 'tests'
  ) then
    alter publication supabase_realtime add table public.tests;
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime' and n.nspname = 'public' and c.relname = 'questions'
  ) then
    alter publication supabase_realtime add table public.questions;
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime' and n.nspname = 'public' and c.relname = 'attempts'
  ) then
    alter publication supabase_realtime add table public.attempts;
  end if;
end $$;

-- Para recibir datos completos en eventos UPDATE/DELETE.
alter table public.tests replica identity full;
alter table public.questions replica identity full;
alter table public.attempts replica identity full;
