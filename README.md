# OATec ITBA 2026 · versión corregida para Supabase

## Qué corregí
- el login admin ya no acepta cualquier usuario/contraseña;
- si `db/config.js` no está completo, el panel avisa y no usa login local por error;
- la creación de tests guarda en Supabase (`tests` + `questions`);
- se mantiene la carga por TXT y la descarga del TXT ejemplo;
- ranking en tiempo real desde `attempts` / `v_public_attempts`.

## Antes de subir a GitHub
1. En Supabase, ejecutar `db/superbase_schema.sql`.
2. En Authentication > Users, crear:
   - email: `admin@oatec.local`
   - password: `Admin0381$$`
3. Volver a ejecutar `db/superbase_schema.sql` para vincular automáticamente el admin.
4. Abrir `db/config.js` y reemplazar:
   - `anonKey: "TU_ANON_KEY_DE_SUPABASE"`
5. Subir todo a GitHub Pages.

## Importante
La URL del proyecto quedó precargada a partir del project ref visto en tu captura:
`https://xahfaaefnuhpoeyanbxw.supabase.co`

Solo te falta pegar la anon key pública del proyecto.


## Cambios V6
- Respuestas A/B/C/D aleatorias por alumno.
- Bloqueo de cambio de respuesta en modo competencia.
- Anti trampas: cambio de pestaña, blur, click derecho y atajos bloqueados.
- Tiempo sincronizado con el servidor usando la fecha del proyecto Supabase cuando está disponible.
