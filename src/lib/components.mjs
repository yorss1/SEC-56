// Componentes reutilizables de presentación.
import { html, raw, formatDate, safeUrl } from './html.mjs';
import { icono } from './layout.mjs';
import { CATEGORIAS_AVISO, CATEGORIAS_DOCUMENTO } from './content.mjs';

export function encabezadoPagina({ titulo, descripcion, eyebrow }) {
  return html`<div class="page-head">
    <div class="wrap">
      ${eyebrow ? html`<p class="eyebrow">${eyebrow}</p>` : ''}
      <h1>${titulo}</h1>
      ${descripcion ? html`<p class="lede">${descripcion}</p>` : ''}
    </div>
  </div>`;
}

export function tamanoLegible(bytes) {
  if (!Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function etiquetaCategoria(categoria) {
  const c = CATEGORIAS_AVISO[categoria];
  if (!c) return '';
  return html`<span class="tag tag-${categoria}">${icono(c.icono)}<span>${c.etiqueta}</span></span>`;
}

export function etiquetaVigencia(vigencia) {
  if (vigencia === 'vencido') {
    return html`<span class="tag tag-vencido" data-estado-vigencia>${icono('reloj')}<span>Vencido</span></span>`;
  }
  if (vigencia === 'archivado') {
    return html`<span class="tag tag-archivado">${icono('archivo')}<span>Archivado</span></span>`;
  }
  return '';
}

export function estadoVacio({ titulo, texto, accion }) {
  return html`<div class="empty-state">
    ${icono('info')}
    <div>
      <p class="empty-title">${titulo}</p>
      <p>${texto}</p>
      ${accion ? html`<p><a class="link-arrow" href="${accion.href}">${accion.texto}${icono('flecha')}</a></p>` : ''}
    </div>
  </div>`;
}

// Contenido pendiente: mensaje neutral que no afirma nada sobre la escuela.
export function contenidoPendiente(ctx, pagina) {
  return html`<div class="pending" role="note">
    <div class="pending-title">${icono('info')}<h2>Información en preparación</h2></div>
    <p>Esta sección se publicará cuando la dirección de la escuela entregue y apruebe la información correspondiente. Mientras tanto, no se muestra contenido provisional para evitar datos incorrectos.</p>
    ${pagina.contenidoFuturo?.length
      ? html`<p class="pending-sub">Aquí se espera incluir:</p>
        <ul>${pagina.contenidoFuturo.map((t) => html`<li>${t}</li>`)}</ul>`
      : ''}
    <p><a class="link-arrow" href="${ctx.url('contacto/')}">Ver medios de contacto${icono('flecha')}</a></p>
  </div>`;
}

export function bloques(ctx, lista, documentos = []) {
  return lista.map((b) => {
    switch (b.tipo) {
      case 'parrafo':
        return html`<p>${b.texto}</p>`;
      case 'subtitulo':
        return html`<h2>${b.texto}</h2>`;
      case 'lista':
        return html`<ul>${b.items.map((i) => html`<li>${i}</li>`)}</ul>`;
      case 'enlace': {
        const href = b.url.startsWith('/') ? ctx.url(b.url.slice(1)) : safeUrl(b.url);
        const externo = /^https:/i.test(href);
        return html`<p><a href="${href}" ${externo ? raw('rel="noopener noreferrer"') : ''}>${b.texto}</a></p>`;
      }
      case 'documento': {
        const d = documentos.find((x) => x.id === b.id);
        return d ? tarjetaDocumento(ctx, d) : '';
      }
      default:
        return '';
    }
  });
}

export function tarjetaDocumento(ctx, d) {
  const meta = [
    d.formato ? d.formato.toUpperCase() : '',
    tamanoLegible(d.tamanoBytes),
    d.publicado ? `Publicado el ${formatDate(d.publicado)}` : '',
    d.cicloEscolar ? `Ciclo ${d.cicloEscolar}` : '',
    d.version ? `Versión ${d.version}` : '',
  ].filter(Boolean);
  return html`<article class="doc">
    <div class="doc-icon">${icono('archivo')}</div>
    <div class="doc-body">
      <h3>${d.nombre}</h3>
      <p>${d.descripcion}</p>
      ${d.textoAccesible ? html`<p class="doc-accessible">${d.textoAccesible}</p>` : ''}
      <p class="meta">${meta.join(' · ')}</p>
      <p><a class="btn btn-secondary" href="${ctx.url(d.archivo)}" download>${icono('descarga')}<span>Descargar ${d.nombre}<span class="sr-only"> (${(d.formato || '').toUpperCase()}, ${tamanoLegible(d.tamanoBytes)})</span></span></a></p>
    </div>
  </article>`;
}

export function listaDocumentos(ctx, docs) {
  return html`<div class="doc-list">${docs.map((d) => tarjetaDocumento(ctx, d))}</div>`;
}

export function categoriaDocumento(clave) {
  return CATEGORIAS_DOCUMENTO[clave] ?? clave;
}

function tituloNivel(nivel, contenido) {
  return nivel === 2 ? html`<h2>${contenido}</h2>` : html`<h3>${contenido}</h3>`;
}

export function tarjetaAviso(ctx, a, nivel = 3) {
  const texto = `${a.titulo} ${a.resumen}`.toLowerCase();
  return html`<article class="notice ${a.prioridad === 'alta' ? 'notice-high' : ''}"
      data-aviso data-categoria="${a.categoria}" data-ciclo="${a.cicloEscolar}" data-vigencia="${a.vigencia}"
      data-vence="${a.vence ?? ''}" data-texto="${texto}">
    <div class="notice-tags">
      ${etiquetaCategoria(a.categoria)}
      ${a.prioridad === 'alta' ? html`<span class="tag tag-prioridad">${icono('alerta')}<span>Prioritario</span></span>` : ''}
      ${etiquetaVigencia(a.vigencia)}
    </div>
    ${tituloNivel(nivel, html`<a href="${ctx.url(`avisos/${a.slug}/`)}">${a.titulo}</a>`)}
    <p>${a.resumen}</p>
    <p class="meta">
      <span>Publicado el ${formatDate(a.publicado)}</span>
      <span>Ciclo escolar ${a.cicloEscolar}</span>
      ${a.vence ? html`<span>Vigente hasta el ${formatDate(a.vence)}</span>` : ''}
    </p>
  </article>`;
}

export function listaAvisos(ctx, avisos, { vacio, nivel = 3 }) {
  if (!avisos.length) return estadoVacio(vacio);
  return html`<div class="notice-list" data-lista-avisos>${avisos.map((a) => tarjetaAviso(ctx, a, nivel))}</div>
    <p class="empty-filter" data-sin-resultados hidden>No hay avisos que coincidan con la búsqueda. Prueba con otros filtros.</p>`;
}

export function filtrosAvisos(avisos, { mostrarVigencia }) {
  const ciclos = [...new Set(avisos.map((a) => a.cicloEscolar))].sort().reverse();
  const categorias = [...new Set(avisos.map((a) => a.categoria))];
  return html`<form class="filters" data-filtros role="search" aria-label="Buscar y filtrar avisos" hidden>
    <div class="field">
      <label for="f-texto">Buscar</label>
      <input id="f-texto" type="search" name="texto" autocomplete="off">
    </div>
    <div class="field">
      <label for="f-categoria">Categoría</label>
      <select id="f-categoria" name="categoria">
        <option value="">Todas</option>
        ${categorias.map((c) => html`<option value="${c}">${CATEGORIAS_AVISO[c]?.etiqueta ?? c}</option>`)}
      </select>
    </div>
    <div class="field">
      <label for="f-ciclo">Ciclo escolar</label>
      <select id="f-ciclo" name="ciclo">
        <option value="">Todos</option>
        ${ciclos.map((c) => html`<option value="${c}">${c}</option>`)}
      </select>
    </div>
    ${mostrarVigencia
      ? html`<div class="field">
        <label for="f-vigencia">Vigencia</label>
        <select id="f-vigencia" name="vigencia">
          <option value="">Todos</option>
          <option value="vencido">Vencidos</option>
          <option value="archivado">Archivados</option>
        </select>
      </div>`
      : ''}
    <p class="filters-status" role="status" aria-live="polite" data-estado-filtros></p>
  </form>`;
}

export function acordeon(preguntas) {
  return html`<div class="faq">${preguntas.map((p) => html`<details>
    <summary>${p.pregunta}</summary>
    <div class="faq-body"><p>${p.respuesta}</p></div>
  </details>`)}</div>`;
}

export function tramite(ctx, t, data, documentos) {
  const formatos = (t.formatos ?? []).map((id) => documentos.find((d) => d.id === id)).filter(Boolean);
  return html`<div class="tramite">
    <p class="meta">Ciclo escolar ${data.cicloEscolar} · Última actualización: ${formatDate(data.actualizado)}</p>
    <dl class="tramite-datos">
      <div><dt>A quién va dirigido</dt><dd>${t.dirigidoA}</dd></div>
      <div><dt>Periodo y fecha límite</dt><dd>${t.periodo}</dd></div>
      <div><dt>Dónde y cómo se realiza</dt><dd>${t.dondeComo}</dd></div>
      <div><dt>Horarios</dt><dd>${t.horarios}</dd></div>
      <div><dt>Canal institucional de dudas</dt><dd>${t.canalDudas}</dd></div>
    </dl>
    <h2>Requisitos</h2>
    <ul>${t.requisitos.map((r) => html`<li>${r}</li>`)}</ul>
    <h2>Pasos</h2>
    <ol>${t.pasos.map((p) => html`<li>${p}</li>`)}</ol>
    ${formatos.length ? html`<h2>Formatos oficiales</h2>${listaDocumentos(ctx, formatos)}` : ''}
  </div>`;
}
