# testOATec · versión corregida y mobile-first

Proyecto listo para subir a GitHub Pages en:

`https://fmgambino.github.io/testOATec/`

## Credenciales admin
- Usuario: `admin`
- Contraseña: `Admin0381$$`

## Mejoras incluidas
- Carga de tests desde TXT preformateado.
- Descarga de TXT de ejemplo.
- Selector de cronómetro por test: ascendente o descendente.
- Selects mejorados para modo oscuro.
- Card de "Seleccionar test" corregida para mobile.
- Ranking por test.
- Exportación CSV.
- Persistencia local lista para GitHub Pages.
- Soporte opcional para SuperDB/Supabase.

## Formato TXT soportado
Ver `assets/modelo_test_oatec.txt`

## Modo local
Ya funciona con `localStorage`. No requiere backend.

## Modo SuperDB
1. Ejecutar `db/superdb_schema.sql`
2. Copiar `db/config.example.js` como `db/config.js` o editar el archivo actual
3. Cambiar `mode` a `"superdb"`
4. Completar `url` y `anonKey`

## Importante
En hosting estático, las credenciales admin están en frontend. Para seguridad real, conviene mover la administración a backend o funciones protegidas.
