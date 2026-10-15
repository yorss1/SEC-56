# Lista de comprobación de lanzamiento

Úsala antes de pasar el sitio de **demostración** a **portal oficial**. No marques nada que no se haya comprobado de verdad.

## A. Aprobaciones institucionales (bloquean el lanzamiento)

- [ ] La dirección autorizó por escrito publicar el sitio como portal oficial (`content/site.json` → `autorizacion`, con responsable y fecha).
- [ ] Dominio definitivo confirmado.
- [ ] Domicilio, código postal, teléfono, correo y horarios confirmados y publicados con `aprobadoPor` / `aprobadoEn`.
- [ ] Aviso de privacidad integral aprobado y publicado.
- [ ] Hay una persona responsable de actualizar el sitio y una persona distinta que aprueba las publicaciones.
- [ ] Se decidió qué hacer con el formulario de contacto (habilitarlo con destinatario y conservación definidos, o dejarlo desactivado).
- [ ] Cada página que se publica tiene su contenido aprobado; las demás siguen como "en preparación" (es válido lanzar así).
- [ ] No hay imágenes, nombres ni videos de menores sin autorización documentada.
- [ ] Revisado en `PENDIENTES-DE-VALIDACION.md` que ningún dato pendiente quedó publicado por accidente.

## B. Comprobaciones técnicas (ejecutar en la carpeta del proyecto)

- [ ] `npm run lint` sin errores.
- [ ] `npm test` sin fallos.
- [ ] `npm run contraste` sin fallos (si se cambiaron colores).
- [ ] Con las variables de producción (`SITE_MODE=produccion`, `SITE_URL=...`): `npm run build` termina bien.
- [ ] `npm run verify` sin problemas sobre esa misma compilación.
- [ ] Opcional pero recomendable: `bash tests/browser/run.sh` (requiere Python con Playwright y Chromium).

## C. Cloudflare

- [ ] Production: `SITE_MODE=produccion`, `SITE_URL` correcto. Preview: `SITE_MODE=demo`.
- [ ] La vista previa publicada se revisó con la lista de `docs/DESPLIEGUE-CLOUDFLARE.md`.
- [ ] Dominio personalizado activo y HTTPS funcionando; `Strict-Transport-Security` presente.
- [ ] `https://dominio/robots.txt` permite indexar y apunta a `sitemap.xml`; el sitemap lista solo páginas públicas.
- [ ] En el código fuente de la página de inicio ya no aparece `noindex` ni el banner de demostración.
- [ ] Funciones de Cloudflare que modifican HTML o inyectan scripts (Web Analytics automático, Rocket Loader) apagadas.
- [ ] Una ruta inexistente devuelve la página 404 con código 404.

## D. Revisión manual de contenido y accesibilidad

- [ ] Se recorrieron en teléfono, tableta y escritorio: inicio, avisos, un aviso, documentos, contacto, privacidad.
- [ ] Se navegó solo con teclado (Tab, Enter, Escape en el menú móvil) y el foco siempre es visible.
- [ ] Se probó con un lector de pantalla al menos en inicio, avisos y contacto.
- [ ] Se probó con zoom al 200 % sin pérdida de contenido.
- [ ] Todas las descargas abren correctamente en un teléfono.
- [ ] Ortografía y fechas revisadas por una persona de la escuela.

## E. Después del lanzamiento

- [ ] Fecha de la primera revisión de avisos vencidos y documentos desactualizados.
- [ ] Procedimiento acordado para retirar o corregir contenido publicado por error (`npm run editorial -- retirar ...`).
- [ ] Copia de seguridad: el repositorio es la copia del contenido; confirmar quién tiene acceso.
