# Arquitectura del sitio

Sitio institucional de la Escuela Secundaria Técnica No. 56 "Carlos Martínez Balmori". Este documento resume las decisiones técnicas y editoriales tomadas a partir del dossier de investigación y del prompt maestro.

## Decisión de stack

**Generador estático en Node.js (>= 20), sin dependencias de terceros.**

Motivos:

- El registro de paquetes npm no estuvo disponible en el entorno de desarrollo (la red lo bloqueó), así que se eligió una base que no necesita instalar nada.
- Un portal institucional público no necesita servidor de aplicaciones: HTML estático es rápido, barato de alojar, resistente a fallos y con superficie de ataque mínima.
- Menos dependencias significa menos actualizaciones de seguridad que mantener.
- El HTML se genera con una función de plantillas que **escapa todo por defecto** (`src/lib/html.mjs`), lo que previene XSS en el contenido editable.

**Hosting: Cloudflare** (Pages, o Workers con recursos estáticos). Ver `DESPLIEGUE-CLOUDFLARE.md`. El archivo `_headers` generado en `dist/` es el que Cloudflare lee para aplicar la CSP y las demás cabeceras.

Limitación asumida: no hay un panel de administración con inicio de sesión. La gestión editorial es **por archivos versionados** (opción permitida por el prompt, sección 6) más una herramienta de línea de comandos. Ver "Gestión de contenidos".

## Estructura

```
content/            Fuente única de contenido (JSON). Lo que edita la escuela.
  site.json         Datos institucionales, cada uno con estado de validación
  paginas/*.json    Contenido de páginas (pendiente hasta aprobarse)
  avisos/*.json     Un archivo por aviso (flujo borrador → publicado)
  documentos/*.json Metadatos de documentos descargables
  archivos/         Archivos reales de los documentos
  bitacora.jsonl    Registro append-only de cambios editoriales
src/lib/            Lógica: configuración, carga y validación, plantillas, páginas
assets/             CSS, JS mínimo y favicon provisional
scripts/            build, serve, validate-content, editorial, lint, verify-build
tests/              Pruebas con node:test
dist/               Salida generada (no se versiona)
```

## Estados de un dato institucional

Cada campo de `content/site.json` lleva:

| Campo | Significado |
|---|---|
| `valor` | El dato tal como aparece en el dossier, o `null` |
| `estado` | `confirmado_dossier`, `pendiente_validacion` o `propuesta` |
| `publicar` | `true` solo si la dirección aprobó mostrarlo |
| `aprobadoPor` / `aprobadoEn` | Obligatorios si `publicar` es `true` y el estado es pendiente |
| `fuente` | De dónde salió el dato (URL y fecha de consulta) |

Regla central: **la web pública solo muestra un dato si `publicar` es `true`**. Un dato `pendiente_validacion` con `publicar: true` hace fallar la validación. Los datos que el dossier marca como "no publicar sin confirmación" (dirección postal, teléfono, correo histórico, CCT, fecha de fundación) arrancan con `publicar: false`.

No se almacenan en el repositorio las estadísticas históricas 2022–2023 ni nombres del personal de directorios de terceros.

## Modos de despliegue

Variable `SITE_MODE`:

- `demo` (valor por defecto): banner visible en todas las páginas indicando que no es el sitio oficial, `noindex` en cada página y `robots.txt` que bloquea buscadores.
- `produccion`: la compilación **falla** si `content/site.json` no registra la autorización expresa de la dirección (`autorizacion.otorgada: true` con responsable y fecha) o si falta `SITE_URL`.

## Rutas

Todas las rutas del prompt (sección 4) existen. Las páginas cuyo contenido depende de información no confirmada se generan con un estado "pendiente" neutral, que no afirma nada sobre la escuela.

- `/` Inicio
- `/conocenos/` + `historia`, `identidad`, `modelo-educativo`, `autoridades`, `instalaciones`
- `/oferta-educativa/` + `primer-grado`, `segundo-grado`, `tercer-grado`, `asignaturas`, `tecnologias-talleres`, `actividades-complementarias`
- `/estudiantes-y-familias/` + `inscripcion`, `reinscripcion`, `requisitos`, `calendario`, `evaluaciones-tramites`, `acuerdos-escolares`, `preguntas-frecuentes`, `orientacion-apoyo`, `participacion-familiar`
- `/vida-escolar/` + `actividades-academicas`, `cultura-y-artes`, `deportes`, `eventos-civicos`, `proyectos-y-exposiciones`, `galeria`, `reconocimientos`
- `/avisos/`, `/avisos/archivo/`, `/avisos/<slug>/`
- `/documentos/`
- `/contacto/`
- `/privacidad/`, `/accesibilidad/`, `/politica-de-uso/`, `/demostracion/`
- `/404.html`, `/error/`
- `sitemap.xml` (solo si hay `SITE_URL`) y `robots.txt`

## Gestión de contenidos

Flujo de un aviso: `borrador → en_revision → aprobado → publicado → archivado`.

- Cada cambio de estado se hace con `npm run editorial -- <comando>` y deja una línea en `content/bitacora.jsonl` (quién, qué, cuándo).
- La validación impone: el aprobador debe ser distinta persona que el autor, un aviso publicado necesita aprobador y fecha, las fechas deben ser coherentes y el cuerpo no puede contener patrones de CURP.
- Un aviso con `vence` pasado se muestra con el mensaje "vencido" y sale de los espacios prioritarios. El sitio calcula esto al compilar y un script ligero lo vuelve a comprobar en el navegador.
- **Control de acceso real:** la autenticación y los permisos los da el repositorio (quién puede hacer commit o aprobar un pull request). La identidad que se escribe en la bitácora es declarativa; no sustituye un sistema de login. Esto se documenta en el README.

## Seguridad

- Sin JavaScript ni estilos en línea, para poder usar una política CSP estricta (`default-src 'self'`). El archivo `_headers` generado la aplica en Cloudflare (Pages y Workers con recursos estáticos).
- Sin cookies, sin analítica, sin recursos de terceros (tipografías del sistema).
- El formulario de contacto **no se muestra** mientras no exista un destinatario institucional configurado (`CONTACT_FORM_ENDPOINT`) y un aviso de privacidad aprobado. No se simula el envío.
- No se publican documentos ni datos de menores: la validación rechaza CURP en el contenido de avisos y páginas.

## Accesibilidad, SEO y rendimiento

- HTML semántico, `lang="es-MX"`, enlace "Saltar al contenido", foco visible, menú móvil con teclado, `prefers-reduced-motion`, categorías con texto e icono.
- Metadatos únicos por página, Open Graph, canonical solo si `SITE_URL` está definida. No se emite imagen social ni datos estructurados hasta tener recursos y datos verificados.
- CSS único y pequeño, JavaScript de menos de unos pocos KB, sin imágenes pesadas.

## Qué no incluye (por el alcance del prompt)

Calificaciones, expedientes, mensajería, pagos, inscripciones con captura de datos o portal de alumnos.
