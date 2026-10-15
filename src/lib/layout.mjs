// Estructura común de página: cabecera, navegación, pie y metadatos.
import { html, raw, esc, formatDate } from './html.mjs';
import { MENU } from './paginas.mjs';
import { dato } from './content.mjs';

const ICONOS = {
  megafono: 'M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z M15 9a4 4 0 0 1 0 6 M18 7a7 7 0 0 1 0 10',
  portapapeles: 'M9 4h6v3H9z M7 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1 M9 12h6 M9 16h6',
  campana: 'M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z M10 20a2 2 0 0 0 4 0',
  periodico: 'M5 5h12v14H6a1 1 0 0 1-1-1z M17 9h2v9a1 1 0 0 1-2 0 M8 9h6 M8 13h6',
  archivo: 'M7 3h7l4 4v14H7z M14 3v4h4 M9.5 13h5 M9.5 17h5',
  lapiz: 'M4 20l1-4L16 5l3 3L8 19z M14 7l3 3',
  repetir: 'M4 12a8 8 0 0 1 14-5l2 2 M20 4v5h-5 M20 12a8 8 0 0 1-14 5l-2-2 M4 20v-5h5',
  calendario: 'M5 6h14v14H5z M5 10h14 M9 3v4 M15 3v4',
  ubicacion: 'M12 21s6-5.5 6-11a6 6 0 0 0-12 0c0 5.5 6 11 6 11z M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  flecha: 'M5 12h14 M13 6l6 6-6 6',
  menu: 'M4 7h16 M4 12h16 M4 17h16',
  cerrar: 'M6 6l12 12 M18 6L6 18',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 11v5 M12 8h.01',
  reloj: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2',
  alerta: 'M12 4l9 16H3z M12 10v4 M12 17h.01',
  descarga: 'M12 4v11 M7 11l5 5 5-5 M5 20h14',
};

// Construido solo con constantes del propio módulo (nunca con contenido editable).
const SPRITE_SEGURO = `<svg class="sprite" aria-hidden="true" focusable="false" width="0" height="0">${Object.entries(ICONOS)
  .map(([id, d]) => `<symbol id="i-${id}" viewBox="0 0 24 24"><path d="${d}"/></symbol>`)
  .join('')}</svg>`;

export function sprite() {
  return raw(SPRITE_SEGURO);
}

export function icono(nombre, clase = '') {
  return html`<svg class="icon ${clase}" aria-hidden="true" focusable="false"><use href="#i-${nombre}"></use></svg>`;
}

export function breadcrumbs(ctx, migas) {
  if (!migas?.length) return '';
  return html`<nav class="breadcrumbs" aria-label="Ruta de navegación">
    <ol>
      <li><a href="${ctx.url('')}">Inicio</a></li>
      ${migas.map((m, i) =>
        i === migas.length - 1
          ? html`<li><span aria-current="page">${m.titulo}</span></li>`
          : html`<li><a href="${ctx.url(m.ruta)}">${m.titulo}</a></li>`)}
    </ol>
  </nav>`;
}

function cabecera(ctx, ruta) {
  const nombre = dato(ctx.site, 'nombre') ?? 'Escuela Secundaria Técnica No. 56';
  const nav = MENU.map((item) => {
    const actual = item.ruta === ''
      ? ruta === ''
      : ruta === item.ruta || ruta.startsWith(item.ruta);
    return html`<li><a href="${ctx.url(item.ruta)}" ${actual ? raw('aria-current="page"') : ''}>${item.titulo}</a></li>`;
  });
  return html`<header class="site-header">
    <div class="wrap header-row">
      <a class="brand" href="${ctx.url('')}">
        <span class="brand-mark" aria-hidden="true">56</span>
        <span class="brand-text">
          <span class="brand-name">${nombre}</span>
        </span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="menu-principal" hidden>
        ${icono('menu', 'when-closed')}${icono('cerrar', 'when-open')}<span>Menú</span>
      </button>
    </div>
    <nav id="menu-principal" class="main-nav" aria-label="Principal">
      <div class="wrap"><ul>${nav}</ul></div>
    </nav>
  </header>`;
}

function pie(ctx) {
  const nombre = dato(ctx.site, 'nombre') ?? 'Escuela Secundaria Técnica No. 56';
  const cct = dato(ctx.site, 'cct');
  const direccion = dato(ctx.site, 'direccion');
  const telefono = dato(ctx.site, 'telefono');
  const correo = dato(ctx.site, 'correo');
  const datos = [
    cct ? html`<li>CCT: ${cct}</li>` : '',
    direccion ? html`<li>${direccion}</li>` : '',
    telefono ? html`<li>Teléfono: ${telefono}</li>` : '',
    correo ? html`<li>Correo: ${correo}</li>` : '',
  ];
  return html`<footer class="site-footer">
    <div class="wrap footer-grid">
      <div>
        <p class="footer-name">${nombre}</p>
        ${datos.some(Boolean) ? html`<ul class="footer-data">${datos}</ul>` : ''}
      </div>
      <nav aria-label="Información del sitio">
        <ul class="footer-links">
          <li><a href="${ctx.url('contacto/')}">Contacto</a></li>
          <li><a href="${ctx.url('privacidad/')}">Privacidad</a></li>
          <li><a href="${ctx.url('accesibilidad/')}">Accesibilidad</a></li>
          <li><a href="${ctx.url('politica-de-uso/')}">Política de uso</a></li>
          ${ctx.config.isDemo ? html`<li><a href="${ctx.url('demostracion/')}">Acerca de esta demostración</a></li>` : ''}
        </ul>
      </nav>
    </div>
    <div class="wrap footer-note">
      <p>Sitio generado el ${formatDate(ctx.today)}. Este sitio no usa cookies ni herramientas de analítica.</p>
    </div>
  </footer>`;
}

function bannerDemo(ctx) {
  if (!ctx.config.isDemo) return '';
  return html`<div class="demo-banner" role="region" aria-label="Aviso de versión de demostración">
    <div class="wrap">
      ${icono('alerta')}
      <p><strong>Versión de demostración.</strong> Este sitio no es el portal oficial de la escuela y su contenido está pendiente de validación. <a href="${ctx.url('demostracion/')}">Más información</a></p>
    </div>
  </div>`;
}

export function layout(ctx, { titulo, descripcion, ruta = '', contenido, migas, noindex = false, claseBody = '' }) {
  const nombreCorto = dato(ctx.site, 'nombreCorto') ?? 'Secundaria Técnica 56';
  const tituloCompleto = ruta === '' && !migas ? `${nombreCorto} · Tulancingo de Bravo, Hidalgo` : `${titulo} · ${nombreCorto}`;
  const robots = ctx.config.isDemo || noindex ? 'noindex, nofollow' : 'index, follow';
  const canonical = ctx.config.siteUrl && !ctx.config.isDemo && !noindex ?`${ctx.config.siteUrl}${ctx.url(ruta)}` : '';
  return html`<!doctype html>
<html lang="es-MX">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${tituloCompleto}</title>
  <meta name="description" content="${descripcion}">
  <meta name="theme-color" content="#0B2347">
  <meta name="robots" content="${robots}">
  ${canonical ? html`<link rel="canonical" href="${canonical}">` : ''}
  <meta property="og:type" content="website">
  <meta property="og:locale" content="es_MX">
  <meta property="og:title" content="${tituloCompleto}">
  <meta property="og:description" content="${descripcion}">
  ${canonical ? html`<meta property="og:url" content="${canonical}">` : ''}
  <meta name="twitter:card" content="summary">
  <link rel="icon" href="${ctx.asset('assets/favicon.svg')}" type="image/svg+xml">
  <link rel="stylesheet" href="${ctx.asset('assets/site.css')}">
  <script src="${ctx.asset('assets/site.js')}" defer></script>
</head>
<body class="${claseBody}">
  ${sprite()}
  <a class="skip-link" href="#contenido">Saltar al contenido principal</a>
  ${bannerDemo(ctx)}
  ${cabecera(ctx, ruta)}
  <main id="contenido" tabindex="-1">
    ${migas?.length ? html`<div class="wrap">${breadcrumbs(ctx, migas)}</div>` : ''}
    ${contenido}
  </main>
  ${pie(ctx)}
</body>
</html>
`;
}

export { esc };
