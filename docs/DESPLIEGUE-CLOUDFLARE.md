# Despliegue en Cloudflare

El hosting del sitio será Cloudflare. El sitio es 100 % estático (carpeta `dist/`), así que se despliega como sitio de **Cloudflare Pages** o, de forma equivalente, como **Workers con recursos estáticos**. Las instrucciones siguientes se basan en la documentación oficial de Cloudflare consultada el 15 de octubre de 2026; los pasos del panel pueden cambiar de nombre, así que contrasta con la [documentación de Pages](https://developers.cloudflare.com/pages/) si algo no coincide.

> **Qué se probó y qué no.** Se probó localmente que `npm run build` genera `dist/` correcto y que un servidor local que aplica el archivo `_headers` no produce violaciones de CSP. **No se desplegó nada en Cloudflare** (el entorno de desarrollo no tiene acceso a la cuenta ni a `wrangler`). La primera vista previa en Cloudflare debe revisarse con la lista del final de este documento.

## Opción A (recomendada): Cloudflare Pages conectado al repositorio

1. En el panel de Cloudflare: **Workers & Pages → Create → Pages → Connect to Git** y elige el repositorio.
2. Configuración de compilación:

   | Campo | Valor |
   |---|---|
   | Framework preset | Ninguno |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | `/` (raíz del repositorio) |

3. **Versión de Node.** El repositorio incluye `.node-version` con `22`. Según la documentación de Cloudflare, la imagen de compilación actual usa Node 22.16.0 por defecto y la versión puede fijarse con `.node-version`, `.nvmrc` o la variable `NODE_VERSION`. El sitio requiere Node 20 o superior y no tiene dependencias que instalar.
4. **Variables de entorno** (Settings → Environment variables). Pages permite valores distintos para *Production* y *Preview*:

   | Variable | Production | Preview |
   |---|---|---|
   | `SITE_MODE` | `demo` hasta tener autorización; después `produccion` | `demo` (siempre) |
   | `SITE_URL` | vacío hasta tener dominio confirmado; después `https://dominio-confirmado` | vacío |
   | `CONTACT_FORM_ENDPOINT` | vacío hasta definir destinatario (ver abajo) | vacío |

   Con `SITE_MODE=demo` cada página lleva `noindex`, `robots.txt` bloquea a los buscadores y se muestra el banner de demostración. **Mantén `demo` en Preview siempre**, para que las vistas previas por rama nunca se indexen.
5. Guarda y despliega. La primera compilación producirá una URL `*.pages.dev` (aún en modo demostración).

## Opción B: Workers con recursos estáticos

El repositorio incluye `wrangler.jsonc` apuntando a `./dist` con `not_found_handling: "404-page"`. Compila con `npm run build` y despliega con `npx wrangler deploy`. **Este archivo no se probó**; ejecuta antes `npx wrangler deploy --dry-run`. Las variables de entorno de compilación (`SITE_MODE`, etc.) deben estar definidas en el entorno donde corras `npm run build`.

## Qué hace Cloudflare con los archivos que genera el sitio

- **`_headers`**: Cloudflare lo lee desde la carpeta de salida y **no lo sirve como archivo**. Aplica la CSP estricta, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` y el caché de `/assets/*` y `/archivos/*`. Límites de Cloudflare: 100 reglas y 2 000 caracteres por línea (el sitio usa 3 reglas y su línea más larga mide 184 caracteres). Estas reglas **no se aplican a respuestas generadas por Functions o Workers**; si algún día se añade código de servidor, hay que poner las cabeceras en su `Response`.
- **`404.html`**: al existir en la raíz, Cloudflare lo sirve para rutas inexistentes (y no activa el comportamiento de aplicación de una sola página).
- **URLs limpias**: Cloudflare redirige `/ruta/index.html` a `/ruta/`. El sitio ya enlaza siempre con barra final, así que no hay redirecciones innecesarias.
- **`robots.txt` y `sitemap.xml`**: el sitemap solo se genera en modo `produccion` con `SITE_URL`.

## Pasos recomendados cuando la escuela autorice el sitio

1. Confirmar el dominio con la dirección y añadirlo en Pages (**Custom domains**).
2. En `content/site.json`: `autorizacion.otorgada: true`, `responsable` y `fecha`. Publicar los datos aprobados (ver `PENDIENTES-DE-VALIDACION.md`).
3. En Production: `SITE_MODE=produccion` y `SITE_URL=https://dominio-confirmado`. Si falta la autorización o `SITE_URL`, **la compilación falla a propósito**.
4. Activar HTTPS estricto en Cloudflare (SSL/TLS → Edge Certificates). El sitio ya envía `Strict-Transport-Security` en modo producción.

## Ajustes de Cloudflare que NO conviene activar

El sitio promete no usar cookies ni analítica y tiene una CSP que solo admite recursos propios. Revisa que estas funciones estén apagadas o que sepas su efecto:

- **Web Analytics con inyección automática**: añade un script de terceros (la CSP lo bloqueará y contradice el aviso de "sin analítica"). Si la escuela quiere métricas, decídelo explícitamente y actualiza la CSP y la página de privacidad.
- **Rocket Loader, Auto Minify y otras transformaciones de HTML**: pueden reescribir el HTML y chocar con la CSP. Déjalas apagadas.
- **Ofuscación de correos**: si se publica un correo institucional, puede alterar el enlace `mailto:`; verifica el resultado.
- Como cualquier proveedor, Cloudflare puede registrar datos técnicos de las visitas (por ejemplo IP). La página de privacidad ya lo menciona de forma general; el responsable debe revisar el texto definitivo.

## Formulario de contacto

El sitio **no incluye un backend**. El formulario solo aparece si se cumplen las dos condiciones: `CONTACT_FORM_ENDPOINT` configurado (URL `https://`) **y** la página de privacidad aprobada. Con Cloudflare hay dos caminos razonables:

1. **Un servicio externo de formularios** (la escuela decide cuál y a qué correo institucional llega). Basta con poner su URL en `CONTACT_FORM_ENDPOINT`; el sitio añade esa URL a `form-action` de la CSP automáticamente.
2. **Una Pages Function propia** que reciba el POST y lo reenvíe al correo institucional, idealmente con protección anti-spam (por ejemplo Cloudflare Turnstile). Hay que escribirla y probarla aparte; no forma parte de esta entrega. Recuerda que las cabeceras de `_headers` no se aplican a las respuestas de una Function.

En ambos casos hace falta antes: destinatario institucional, aviso de privacidad aprobado y definir cuánto tiempo se conservan los mensajes. Mientras tanto, la página de contacto explica que el formulario no está disponible y **no simula un envío**.

## Comprobaciones en la primera vista previa de Cloudflare

- [ ] La compilación termina en verde y publica la carpeta `dist`.
- [ ] Cada página tiene `<meta name="robots" content="noindex, nofollow">` y `/robots.txt` muestra `Disallow: /`.
- [ ] Una ruta inexistente muestra la página 404 con código HTTP 404.
- [ ] Las cabeceras de seguridad llegan (en el navegador: Herramientas de desarrollo → Red → cualquier página → Encabezados de respuesta).
- [ ] La consola del navegador no muestra violaciones de *Content Security Policy*.
- [ ] El menú móvil, la búsqueda de avisos y la descarga de documentos funcionan.
- [ ] No aparece ningún dato marcado como pendiente (teléfono, dirección, CCT, etc.).
