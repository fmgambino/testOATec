-- OATec ITBA · Vincular usuario Supabase Auth como admin
-- 1) Primero creá el usuario en Supabase > Authentication > Users:
--    Email: fernando.m.gambino@gmail.com
--    Password: Jamboree0342$$
--    Confirm user: sí
-- 2) Después ejecutá este SQL.

insert into public.admin_profiles (user_id, username, full_name, role, is_active)
select id, 'fmgambino', 'Fernando Gambino', 'admin', true
from auth.users
where email = 'fernando.m.gambino@gmail.com'
on conflict (user_id) do update
set username = excluded.username,
    full_name = excluded.full_name,
    role = excluded.role,
    is_active = excluded.is_active,
    updated_at = now();

select
  ap.user_id,
  u.email,
  ap.username,
  ap.role,
  ap.is_active
from public.admin_profiles ap
join auth.users u on u.id = ap.user_id
where u.email = 'fernando.m.gambino@gmail.com';
