-- Reemplazá EL_UUID_DEL_ADMIN por el id real del usuario en Authentication > Users.
-- Ejemplo de email del admin: admin@oatec.local

insert into public.admin_profiles (user_id, username, full_name, role, is_active)
values (
  'EL_UUID_DEL_ADMIN',
  'admin',
  'Administrador OATec',
  'admin',
  true
)
on conflict (user_id) do update
set
  username = excluded.username,
  full_name = excluded.full_name,
  role = excluded.role,
  is_active = excluded.is_active;
