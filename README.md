# Sitio institucional · Escuela Secundaria Técnica No. 56 "Carlos Martínez Balmori"

Sitio web estático, accesible y adaptable a móviles para la Escuela Secundaria Técnica No. 56 "Carlos Martínez Balmori" (Tulancingo de Bravo, Hidalgo). Hosting previsto: **Cloudflare**.

> **Estado: versión de demostración, no oficial.** El sitio no está autorizado todavía por la dirección de la escuela. Mientras no lo esté compila en modo `demo`: banner visible en todas las páginas, `noindex` y `robots.txt` que bloquea buscadores. Los datos que el dossier de investigación marca como pendientes (domicilio, teléfono, correo, CCT, horarios, fundación, autoridades, talleres, etc.) **no se publican**; las páginas que dependen de ellos muestran un estado "en preparación" neutral. Consulta `PENDIENTES-DE-VALIDACION.md`.

## Qué incluye

- **42 páginas** generadas, con todas las rutas de la arquitectura: Inicio, Conócenos (5 subpáginas), Oferta educativa (6), Estudiantes y familias (9), Vida escolar (7), Avisos (lista, archivo y una página por aviso), Documentos, Contacto, Privacidad, Accesibilidad, Política de uso, Demostración, 404 y error.
- **Avisos** con categorías (texto + icono), prioridad, ciclo escolar, vigencia, archivo histórico, búsqueda y filtros (mejora progresiva: sin JavaScript la lista sigue visible).
- **Documentos** descargables por categoría y ciclo escolar.
- **Flujo editorial** con estados `borrador → en_revisión → aprobado → publicado → archivado`, aprobador distinto del autor y bitácora de cambios.
- **Validación estricta** del contenido: la compilación falla si hay datos pendientes publicados, CURP en el texto, fechas incoherentes, enlaces a documentos inexistentes, etc.
- **Seguridad**: HTML escapado por defecto, sin JavaScript ni estilos en línea, CSP estricta (`_headers`), sin cookies, sin analítica, sin recursos de terceros.
- **Accesibilidad** (objetivo WCAG 2.2 AA, sin declarar conformidad): HTML semántico, enlace "Saltar al contenido", foco visible, menú móvil con teclado, `prefers-reduced-motion`, contraste verificado por script.
- **SEO**: título y descripción únicos por página, Open Graph, canonical, sitemap y robots según el modo.

## Requisitos

- Node.js 20 o superior (el repositorio fija 22 en `.node-version`).
- **Ninguna dependencia de npm.** `npm install` no es necesario. (Se eligió así porque el registro de npm no estaba disponible en el entorno de desarrollo, y porque un sitio estático con cero dependencias tiene menos que mantener y menos superficie de ataque.)

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Compila y sirve una vista previa en `http://127.0.0.1:4173` (aplica las cabeceras de `_headers`, incluida la CSP). Hay que reiniciarlo para ver cambios. |
| `npm run build` | Valida el contenido y genera `dist/`. |
| `npm run verify` | Revisa `dist/`: enlaces rotos, recursos externos, scripts o estilos en línea, ids duplicados, jerarquía de encabezados, fugas de datos pendientes, etc. |
| `npm run lint` | Sintaxis de todo el código, patrones inseguros y validación del contenido. |
| `npm test` | 45 pruebas (`node:test`). |
| `npm run contraste` | Calcula el contraste de las combinaciones de color de `assets/site.css`. |
| `npm run validate` | Solo valida `content/`. |
| `npm run editorial -- ayuda` | Flujo editorial de avisos. |
| `bash tests/browser/run.sh` | Opcional: 22 comprobaciones en Chromium real (requiere Python con Playwright). Usa avisos de ejemplo en una carpeta temporal. |

## Variables de entorno

Ver `.env.example`. Ninguna es secreta.

| Variable | Uso |
|---|---|
| `SITE_MODE` | `demo` (predeterminado) o `produccion`. En producción la compilación **falla** si no hay autorización en `content/site.json` o falta `SITE_URL`. |
| `SITE_URL` | Dominio definitivo `https://...`; solo se usa en producción (canonical, sitemap, robots). |
| `BASE_PATH` | Ruta base si el sitio no está en la raíz. |
| `CONTACT_FORM_ENDPOINT` | URL `https://` que recibe el formulario. Vacío = no hay formulario. |

## Cómo se mantiene el contenido

Todo el contenido editable vive en `content/` (JSON). No hace falta tocar el código.

```
content/site.json            Datos institucionales, cada uno con estado de validación
content/avisos/<slug>.json   Un archivo por aviso
content/documentos/<id>.json Metadatos de cada documento
content/archivos/            Los archivos descargables
content/paginas/<clave>.json Contenido de una página (las claves están en src/lib/paginas.mjs)
content/bitacora.jsonl       Registro de cambios editoriales (solo se añade)
```

Los archivos que empiezan con `_` son **plantillas** y se ignoran; cópialos y renómbralos.

### Publicar un dato institucional

En `content/site.json`, pon `publicar: true` y rellena `aprobadoPor` y `aprobadoEn` (AAAA-MM-DD). Para los datos pendientes o sensibles (CCT, domicilio, teléfono, correo, horarios, fundación…) la compilación exige esa aprobación.

### Publicar una página (trámite, historia, preguntas frecuentes…)

Copia una plantilla de `content/paginas/_plantilla-*.json` como `content/paginas/<clave>.json` (por ejemplo `conocenos-historia.json`), escribe el contenido y pon `estado: "aprobado"` con `aprobadoPor` y `aprobadoEn`. Los trámites exigen todos sus campos.

### Publicar un aviso

```bash
npm run editorial -- nuevo --titulo "..." --categoria convocatoria --ciclo 2026-2027 --autor "Nombre"
# editar content/avisos/<slug>.json: resumen y cuerpo (quitar los [REDACTAR])
npm run editorial -- enviar-revision <slug> --por "Nombre"
npm run editorial -- aprobar <slug> --por "Otra persona"     # debe ser distinta del autor
npm run editorial -- publicar <slug> --por "Otra persona" --vence 2026-12-01
npm run editorial -- archivar <slug> --por "Otra persona"
npm run editorial -- retirar <slug> --por "..." --motivo "..."
```

Cada acción valida el aviso, lo guarda y deja una línea en `content/bitacora.jsonl`. Un aviso con fecha `vence` pasada se muestra como **vencido** y sale de la lista principal; el navegador además lo recomprueba al abrir la página.

### Publicar un documento

Pon el archivo en `content/archivos/`, copia `content/documentos/_plantilla.json`, y rellénala. Formatos permitidos: pdf, docx, xlsx, odt, ods. Para publicarlo se exige aprobador, fecha y `"contieneDatosPersonales": false`. Solo los documentos publicados o archivados se copian a `dist/`.

## Límites que conviene conocer

- **No hay panel de administración con inicio de sesión.** La edición es por archivos versionados (opción prevista en el prompt cuando no hay backend). El control de acceso real lo da el repositorio: quién puede confirmar cambios y aprobar solicitudes de integración. El nombre que se escribe en `--por` y en la bitácora es **declarativo**, no una identidad autenticada. Si la escuela necesita edición sin tocar archivos, el siguiente paso sería un CMS con roles y autenticación, que requiere decisión y configuración aparte.
- **El formulario de contacto no tiene backend.** Solo aparece con `CONTACT_FORM_ENDPOINT` y aviso de privacidad aprobado; no simula envíos. Ver `docs/DESPLIEGUE-CLOUDFLARE.md`.
- **No se probó en Cloudflare**: no hay acceso a la cuenta desde el entorno de desarrollo.
- **Accesibilidad:** hay verificaciones automáticas y de teclado en Chromium, pero **no** una auditoría con lector de pantalla; por eso no se declara conformidad.
- La paleta es la indicada por la escuela (14-oct-2026); el marcador "56" es provisional hasta recibir el logotipo autorizado.
- No incluye calificaciones, expedientes, mensajería, pagos ni inscripciones con captura de datos, por decisión de alcance.

## Documentación

- `PENDIENTES-DE-VALIDACION.md` — qué debe confirmar la dirección, quién valida y dónde se usa.
- `CHECKLIST-LANZAMIENTO.md` — lista previa al lanzamiento.
- `docs/DESPLIEGUE-CLOUDFLARE.md` — despliegue y ajustes de Cloudflare.
- `docs/ARQUITECTURA.md` — decisiones de arquitectura, rutas y modelo de contenido.

## Estructura del código

```
src/lib/   config, carga y validación de contenido, plantillas HTML, componentes, páginas, compilación, verificación, flujo editorial
assets/    CSS, JS de mejora progresiva (menú, filtros), favicon provisional
scripts/   build, serve, lint, verify-build, validate-content, check-contrast, editorial
tests/     pruebas unitarias e integración; tests/browser: prueba opcional en Chromium
```
