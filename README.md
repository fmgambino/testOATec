# OATec ITBA 2026 · versión SuperBase

## Qué incluye
- carga de tests por TXT preformateado;
- descarga de TXT modelo;
- cronómetro ascendente o descendente;
- panel admin con login real vía SuperBase Auth;
- ranking en tiempo real usando Realtime;
- RLS endurecido para que solo el admin gestione tests e intentos;
- modo local de respaldo si todavía no cargaste las keys.

## 1) Crear el proyecto en SuperBase / Supabase
Creá un proyecto nuevo y copiá:
- Project URL
- Publishable key o anon key

## 2) Cargar la base de datos
En SQL Editor ejecutá:
1. `db/superdb_schema.sql`
2. `db/admin_setup.sql` (después de crear el usuario admin y reemplazar el UUID)

## 3) Crear el usuario admin real
En Authentication > Users:
- email: `admin@oatec.local`
- password: `Admin0381$$`

Después copiá el UUID de ese usuario y reemplazalo en `db/admin_setup.sql`.
Ejecutá `db/admin_setup.sql`.

## 4) Completar `db/config.js`
Pegá tus datos reales:

```js
window.SUPERDB_CONFIG = {
  mode: "superdb",
  url: "https://TU-PROYECTO.supabase.co",
  anonKey: "TU_ANON_KEY",
  adminUsername: "admin",
  adminEmail: "admin@oatec.local",
  storagePrefix: "oatec-itba-2026"
};
```

## 5) Subir a GitHub Pages
Subí el contenido completo del proyecto al repo del sitio:
`https://fmgambino.github.io/testOATec/`

Asegurate de que `index.html` quede en la raíz publicada.

## 6) Notas de seguridad
- No uses nunca la service role key en frontend.
- El login admin real depende de Auth + RLS.
- En un sitio estático no existe seguridad absoluta del lado del cliente; esta versión queda endurecida para producción razonable con reglas en base de datos.

## 7) Archivos clave
- `db/config.js`
- `db/superdb_schema.sql`
- `db/admin_setup.sql`
- `assets/modelo_test_oatec.txt`

## 8) Login admin visible
- usuario: `admin`
- contraseña: `Admin0381$$`

Internamente el login usa:
- email: `admin@oatec.local`
- contraseña: `Admin0381$$`
