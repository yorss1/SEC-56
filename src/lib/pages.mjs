// Generación de todas las páginas del sitio.
import { html, raw, formatDate } from './html.mjs';
import { layout, icono } from './layout.mjs';
import {
  encabezadoPagina, contenidoPendiente, bloques, tramite, acordeon, estadoVacio,
  listaAvisos, filtrosAvisos, tarjetaAviso, listaDocumentos, categoriaDocumento,
  etiquetaCategoria, etiquetaVigencia,
} from './components.mjs';
import { SECCIONES, PAGINAS, PERFILES, paginasDeSeccion, rutaPagina } from './paginas.mjs';
import { dato, avisosPublicos, documentosPublicos, CATEGORIAS_DOCUMENTO } from './content.mjs';

const SECCION_POR_CLAVE = Object.fromEntries(SECCIONES.map((s) => [s.clave, s]));

function nombreInstitucion(ctx) {
  return dato(ctx.site, 'nombre') ?? 'Escuela Secundaria Técnica No. 56';
}

function telHref(telefono) {
  const digitos = String(telefono).replace(/\D/g, '');
  return digitos.length === 10 ? `+52${digitos}` : digitos;
}

function paginaAprobada(ctx, clave) {
  const p = ctx.content.paginas[clave];
  return p && p.estado === 'aprobado' ? p : null;
}

// ---------- Inicio ----------
function inicio(ctx) {
  const nombre = nombreInstitucion(ctx);
  const nivel = dato(ctx.site, 'nivel');
  const municipio = dato(ctx.site, 'municipio');
  const entidad = dato(ctx.site, 'entidad');
  const cct = dato(ctx.site, 'cct');
  const linea = [nivel, [municipio, entidad].filter(Boolean).join(', ')].filter(Boolean).join(' · ');

  const accesos = [
    { icono: 'lapiz', titulo: 'Inscripción de nuevo ingreso', ruta: 'estudiantes-y-familias/inscripcion/' },
    { icono: 'repetir', titulo: 'Reinscripción', ruta: 'estudiantes-y-familias/reinscripcion/' },
    { icono: 'calendario', titulo: 'Calendario escolar', ruta: 'estudiantes-y-familias/calendario/' },
    { icono: 'megafono', titulo: 'Avisos', ruta: 'avisos/' },
    { icono: 'archivo', titulo: 'Documentos', ruta: 'documentos/' },
    { icono: 'ubicacion', titulo: 'Contacto y ubicación', ruta: 'contacto/' },
  ];

  const publicos = avisosPublicos(ctx.content.avisos, ctx.today);
  const vigentes = publicos.filter((a) => a.vigencia === 'vigente');
  const destacado = vigentes.find((a) => a.prioridad === 'alta');
  const recientes = vigentes.filter((a) => a !== destacado).slice(0, 4);

  const fechas = vigentes
    .flatMap((a) => (a.fechasClave ?? []).map((f) => ({ ...f, aviso: a })))
    .filter((f) => f.fecha >= ctx.today)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, 5);

  const contenido = html`
    <section class="hero">
      <div class="wrap">
        <p class="eyebrow">Sitio institucional</p>
        <h1>${nombre}</h1>
        ${linea ? html`<p class="hero-line">${linea}</p>` : ''}
        ${cct ? html`<p class="hero-cct">CCT ${cct}</p>` : ''}
        <p class="lede">Información para estudiantes, madres, padres, tutores y visitantes: trámites, calendario, avisos y documentos en un solo lugar.</p>
        ${paginaAprobada(ctx, 'familias-inscripcion')
          ? html`<div class="hero-actions"><a class="btn btn-cta btn-lg" href="${ctx.url('estudiantes-y-familias/inscripcion/')}">Preinscripciones aquí${icono('flecha')}</a></div>`
          : ''}
      </div>
    </section>

    <section class="section" aria-labelledby="accesos-titulo">
      <div class="wrap">
        <h2 id="accesos-titulo">¿Qué necesitas hacer?</h2>
        <ul class="quick-links">
          ${accesos.map((a) => html`<li><a href="${ctx.url(a.ruta)}">${icono(a.icono)}<span>${a.titulo}</span>${icono('flecha', 'arrow')}</a></li>`)}
        </ul>
      </div>
    </section>

    <section class="section section-alt" aria-labelledby="perfiles-titulo">
      <div class="wrap">
        <h2 id="perfiles-titulo">Información según tu perfil</h2>
        <ul class="profiles">
          ${PERFILES.map((pf) => html`<li class="profile">
            <h3>${pf.titulo}</h3>
            <ul>${pf.enlaces.map((e) => html`<li><a href="${ctx.url(e.ruta)}"><span>${e.titulo}</span>${icono('flecha')}</a></li>`)}</ul>
          </li>`)}
        </ul>
      </div>
    </section>

    ${destacado
      ? html`<section class="section" aria-labelledby="destacado-titulo">
        <div class="wrap">
          <h2 id="destacado-titulo">Aviso destacado</h2>
          ${tarjetaAviso(ctx, destacado)}
        </div>
      </section>`
      : ''}

    <section class="section section-alt" aria-labelledby="avisos-titulo">
      <div class="wrap">
        <div class="section-head">
          <h2 id="avisos-titulo">Avisos recientes</h2>
          <a class="link-arrow" href="${ctx.url('avisos/')}">Ver todos los avisos${icono('flecha')}</a>
        </div>
        ${recientes.length
          ? html`<div class="notice-list">${recientes.map((a) => tarjetaAviso(ctx, a))}</div>`
          : destacado
            ? html`<p>No hay otros avisos vigentes además del aviso destacado.</p>`
            : estadoVacio({
            titulo: 'Todavía no hay avisos publicados',
            texto: 'Los comunicados oficiales aparecerán aquí cuando la dirección los apruebe y los publique.',
          })}
      </div>
    </section>

    ${fechas.length
      ? html`<section class="section" aria-labelledby="fechas-titulo">
        <div class="wrap">
          <h2 id="fechas-titulo">Próximas fechas</h2>
          <ul class="dates">
            ${fechas.map((f) => html`<li><time datetime="${f.fecha}">${formatDate(f.fecha)}</time><span>${f.descripcion} <a href="${ctx.url(`avisos/${f.aviso.slug}/`)}">Ver aviso<span class="sr-only">: ${f.aviso.titulo}</span></a></span></li>`)}
          </ul>
        </div>
      </section>`
      : ''}

    <section class="section" aria-labelledby="conoce-titulo">
      <div class="wrap two-col">
        <div>
          <h2 id="conoce-titulo">Conoce la escuela</h2>
          <p>Consulta la información general del plantel y la oferta educativa conforme la dirección la vaya validando.</p>
        </div>
        <ul class="link-list">
          <li><a href="${ctx.url('conocenos/')}">Conócenos${icono('flecha')}</a></li>
          <li><a href="${ctx.url('oferta-educativa/')}">Oferta educativa${icono('flecha')}</a></li>
          <li><a href="${ctx.url('vida-escolar/')}">Vida escolar${icono('flecha')}</a></li>
        </ul>
      </div>
    </section>`;

  return { ruta: '', titulo: nombre, descripcion: 'Información institucional, trámites, calendario, avisos y documentos para estudiantes y familias.', contenido };
}

// ---------- Secciones y páginas de contenido ----------
function indiceSeccion(ctx, seccion) {
  const hijas = paginasDeSeccion(seccion.clave);
  const contenido = html`
    ${encabezadoPagina({ titulo: seccion.titulo, descripcion: seccion.descripcion })}
    <section class="section">
      <div class="wrap">
        <ul class="card-links">
          ${hijas.map((p) => html`<li><a href="${ctx.url(rutaPagina(p))}"><span class="card-title">${p.titulo}</span><span class="card-desc">${p.descripcion}</span></a></li>`)}
        </ul>
      </div>
    </section>`;
  return {
    ruta: `${seccion.clave}/`,
    titulo: seccion.titulo,
    descripcion: seccion.descripcion,
    migas: [{ titulo: seccion.titulo }],
    contenido,
  };
}

function paginaContenido(ctx, pagina) {
  const seccion = SECCION_POR_CLAVE[pagina.seccion];
  const aprobada = paginaAprobada(ctx, pagina.clave);
  let cuerpo;
  if (!aprobada) {
    cuerpo = contenidoPendiente(ctx, pagina);
  } else if (pagina.tipo === 'tramite' && aprobada.tramite) {
    cuerpo = tramite(ctx, aprobada.tramite, aprobada, ctx.content.documentos);
  } else if (pagina.tipo === 'faq' && aprobada.preguntas) {
    cuerpo = acordeon(aprobada.preguntas);
  } else if (aprobada.bloques) {
    cuerpo = html`<div class="prose">${bloques(ctx, aprobada.bloques, ctx.content.documentos)}
      ${aprobada.actualizado ? html`<p class="meta">Última actualización: ${formatDate(aprobada.actualizado)}</p>` : ''}</div>`;
  } else {
    cuerpo = contenidoPendiente(ctx, pagina);
  }
  const contenido = html`
    ${encabezadoPagina({ titulo: pagina.titulo, descripcion: pagina.descripcion, eyebrow: seccion.titulo })}
    <section class="section"><div class="wrap narrow">${cuerpo}</div></section>`;
  return {
    ruta: rutaPagina(pagina),
    titulo: pagina.titulo,
    descripcion: pagina.descripcion,
    migas: [{ titulo: seccion.titulo, ruta: `${seccion.clave}/` }, { titulo: pagina.titulo }],
    contenido,
  };
}

// ---------- Avisos ----------
function avisosIndice(ctx) {
  const publicos = avisosPublicos(ctx.content.avisos, ctx.today);
  const vigentes = publicos.filter((a) => a.vigencia === 'vigente');
  const contenido = html`
    ${encabezadoPagina({ titulo: 'Avisos', descripcion: 'Comunicados oficiales, convocatorias, recordatorios y noticias vigentes.' })}
    <section class="section">
      <div class="wrap">
        ${vigentes.length ? filtrosAvisos(vigentes, { mostrarVigencia: false }) : ''}
        ${listaAvisos(ctx, vigentes, {
          nivel: 2,
          vacio: {
            titulo: 'No hay avisos vigentes',
            texto: 'Cuando la dirección publique un comunicado aprobado, aparecerá en esta página.',
          },
        })}
        <p class="after-list"><a class="link-arrow" href="${ctx.url('avisos/archivo/')}">Consultar el archivo de avisos${icono('flecha')}</a></p>
      </div>
    </section>`;
  return {
    ruta: 'avisos/', titulo: 'Avisos',
    descripcion: 'Comunicados oficiales, convocatorias, recordatorios y noticias vigentes de la escuela.',
    migas: [{ titulo: 'Avisos' }], contenido,
  };
}

function avisosArchivo(ctx) {
  const historicos = avisosPublicos(ctx.content.avisos, ctx.today).filter((a) => a.vigencia !== 'vigente');
  const contenido = html`
    ${encabezadoPagina({ titulo: 'Archivo de avisos', descripcion: 'Avisos vencidos o archivados. Pueden contener información que ya no está vigente.' })}
    <section class="section">
      <div class="wrap">
        <div class="notice-info" role="note">${icono('info')}<p>No tomes los avisos de esta página como vigentes. Consulta siempre los <a href="${ctx.url('avisos/')}">avisos actuales</a>.</p></div>
        ${historicos.length ? filtrosAvisos(historicos, { mostrarVigencia: true }) : ''}
        ${listaAvisos(ctx, historicos, {
          nivel: 2,
          vacio: { titulo: 'El archivo está vacío', texto: 'Los avisos vencidos o archivados se conservarán aquí para consulta histórica.' },
        })}
      </div>
    </section>`;
  return {
    ruta: 'avisos/archivo/', titulo: 'Archivo de avisos',
    descripcion: 'Archivo histórico de avisos vencidos o archivados.',
    migas: [{ titulo: 'Avisos', ruta: 'avisos/' }, { titulo: 'Archivo' }], contenido,
  };
}

function avisoDetalle(ctx, a) {
  const docs = (a.archivos ?? []).map((id) => ctx.content.documentos.find((d) => d.id === id)).filter(Boolean);
  const fechas = a.fechasClave ?? [];
  const contenido = html`
    <article class="wrap narrow aviso" data-aviso-detalle data-vence="${a.vence ?? ''}" data-vigencia="${a.vigencia}">
      <div class="notice-tags">${etiquetaCategoria(a.categoria)}${etiquetaVigencia(a.vigencia)}</div>
      <h1>${a.titulo}</h1>
      <p class="meta">
        <span>Publicado el ${formatDate(a.publicado)}</span>
        ${a.actualizado ? html`<span>Actualizado el ${formatDate(a.actualizado)}</span>` : ''}
        <span>Ciclo escolar ${a.cicloEscolar}</span>
        ${a.vence ? html`<span>Vigente hasta el ${formatDate(a.vence)}</span>` : ''}
      </p>
      <div class="notice-info notice-expired" role="status" data-banner-vencido ${a.vigencia === 'vigente' ? raw('hidden') : ''}>
        ${icono('reloj')}<p><strong>Este aviso ya no está vigente.</strong> Se conserva para consulta histórica. Revisa los <a href="${ctx.url('avisos/')}">avisos actuales</a>.</p>
      </div>
      <div class="prose">
        <p class="lede">${a.resumen}</p>
        ${bloques(ctx, a.cuerpo, ctx.content.documentos)}
        ${fechas.length ? html`<h2>Fechas importantes</h2><ul class="dates">${fechas.map((f) => html`<li><time datetime="${f.fecha}">${formatDate(f.fecha)}</time><span>${f.descripcion}</span></li>`)}</ul>` : ''}
      </div>
      ${docs.length ? html`<h2>Documentos relacionados</h2>${listaDocumentos(ctx, docs)}` : ''}
      <p class="after-list"><a class="link-arrow back" href="${ctx.url('avisos/')}">${icono('flecha', 'flip')}Volver a avisos</a></p>
    </article>`;
  return {
    ruta: `avisos/${a.slug}/`, titulo: a.titulo, descripcion: a.seo?.descripcion || a.resumen,
    migas: [{ titulo: 'Avisos', ruta: 'avisos/' }, { titulo: a.titulo }], contenido,
  };
}

// ---------- Documentos ----------
function documentosIndice(ctx) {
  const todos = documentosPublicos(ctx.content.documentos);
  const vigentes = todos.filter((d) => d.estado === 'publicado');
  const archivados = todos.filter((d) => d.estado === 'archivado');
  const porCategoria = Object.entries(CATEGORIAS_DOCUMENTO)
    .map(([clave, etiqueta]) => ({ clave, etiqueta, docs: vigentes.filter((d) => d.categoria === clave) }))
    .filter((g) => g.docs.length);
  const ciclos = [...new Set(archivados.map((d) => d.cicloEscolar))].sort().reverse();

  const contenido = html`
    ${encabezadoPagina({ titulo: 'Documentos', descripcion: 'Calendario, formatos, reglamentos y otros documentos oficiales de descarga.' })}
    <section class="section">
      <div class="wrap">
        ${todos.length
          ? html`
            ${porCategoria.map((g) => html`<section aria-labelledby="cat-${g.clave}"><h2 id="cat-${g.clave}">${g.etiqueta}</h2>${listaDocumentos(ctx, g.docs)}</section>`)}
            ${archivados.length
              ? html`<section aria-labelledby="archivo-docs"><h2 id="archivo-docs">Archivo por ciclo escolar</h2>
                <p>Documentos de ciclos anteriores o sustituidos. Pueden no estar vigentes.</p>
                ${ciclos.map((c) => html`<h3>Ciclo ${c}</h3>${listaDocumentos(ctx, archivados.filter((d) => d.cicloEscolar === c))}`)}
              </section>`
              : ''}`
          : estadoVacio({
            titulo: 'Todavía no hay documentos publicados',
            texto: 'Los documentos oficiales (calendario, formatos, reglamentos y aviso de privacidad) aparecerán aquí cuando la dirección los apruebe.',
          })}
      </div>
    </section>`;
  return {
    ruta: 'documentos/', titulo: 'Documentos',
    descripcion: 'Documentos oficiales de descarga: calendario escolar, formatos, reglamentos y convocatorias.',
    migas: [{ titulo: 'Documentos' }], contenido,
  };
}

// ---------- Contacto ----------
function formularioContacto(ctx) {
  return html`<form class="contact-form" method="post" action="${ctx.config.contactEndpoint}" aria-labelledby="form-titulo">
    <h2 id="form-titulo">Enviar un mensaje</h2>
    <p>Solicitamos únicamente los datos necesarios para responderte. No escribas datos personales de estudiantes (como CURP) ni información sensible.</p>
    <div class="field">
      <label for="c-nombre">Tu nombre</label>
      <input id="c-nombre" name="nombre" type="text" autocomplete="name" required maxlength="100">
    </div>
    <div class="field">
      <label for="c-correo">Correo para responderte</label>
      <input id="c-correo" name="correo" type="email" autocomplete="email" required maxlength="150">
    </div>
    <div class="field">
      <label for="c-asunto">Asunto</label>
      <input id="c-asunto" name="asunto" type="text" required maxlength="120">
    </div>
    <div class="field">
      <label for="c-mensaje">Mensaje</label>
      <textarea id="c-mensaje" name="mensaje" rows="6" required maxlength="2000"></textarea>
    </div>
    <div class="field hp" aria-hidden="true">
      <label for="c-web">No llenar este campo</label>
      <input id="c-web" name="sitio_web" type="text" tabindex="-1" autocomplete="off">
    </div>
    <p class="form-note">Al enviar, aceptas el tratamiento descrito en el <a href="${ctx.url('privacidad/')}">aviso de privacidad</a>.</p>
    <button class="btn" type="submit">Enviar mensaje</button>
  </form>`;
}

function contacto(ctx) {
  const direccion = dato(ctx.site, 'direccion');
  const cp = dato(ctx.site, 'codigoPostal');
  const telefono = dato(ctx.site, 'telefono');
  const correo = dato(ctx.site, 'correo');
  const atencion = dato(ctx.site, 'horarioAtencion');
  const matutino = dato(ctx.site, 'horarioMatutino');
  const vespertino = dato(ctx.site, 'horarioVespertino');
  const redes = dato(ctx.site, 'redesSociales');
  const hayDatos = direccion || telefono || correo || atencion || matutino || vespertino || (redes && redes.length);

  const direccionCompleta = [direccion, cp ? `C. P. ${cp}` : ''].filter(Boolean).join(', ');
  const mapaUrl = direccion
    ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(direccionCompleta)}`
    : '';

  const formularioActivo = Boolean(ctx.config.contactEndpoint) && Boolean(paginaAprobada(ctx, 'privacidad'));

  const contenido = html`
    ${encabezadoPagina({ titulo: 'Contacto', descripcion: 'Medios institucionales para comunicarte con la escuela.' })}
    <section class="section">
      <div class="wrap two-col">
        <div>
          <h2>Datos de contacto</h2>
          ${hayDatos
            ? html`<dl class="contact-data">
              ${direccion ? html`<div><dt>Domicilio</dt><dd>${direccionCompleta}${mapaUrl ? html` <a href="${mapaUrl}" rel="noopener noreferrer">Ver en mapa<span class="sr-only"> (abre OpenStreetMap)</span></a>` : ''}</dd></div>` : ''}
              ${telefono ? html`<div><dt>Teléfono</dt><dd><a href="tel:${telHref(telefono)}">${telefono}</a></dd></div>` : ''}
              ${correo ? html`<div><dt>Correo</dt><dd><a href="mailto:${correo}">${correo}</a></dd></div>` : ''}
              ${atencion ? html`<div><dt>Horario de atención</dt><dd>${atencion}</dd></div>` : ''}
              ${matutino ? html`<div><dt>Turno matutino</dt><dd>${matutino}</dd></div>` : ''}
              ${vespertino ? html`<div><dt>Turno vespertino</dt><dd>${vespertino}</dd></div>` : ''}
              ${redes && redes.length ? html`<div><dt>Redes oficiales</dt><dd><ul>${redes.map((r) => html`<li><a href="${r.url}" rel="noopener noreferrer">${r.nombre}</a></li>`)}</ul></dd></div>` : ''}
            </dl>`
            : html`<div class="pending" role="note">
              <div class="pending-title">${icono('info')}<h3>Datos en validación</h3></div>
              <p>Los medios oficiales de contacto (domicilio, teléfono, correo y horarios) se publicarán cuando la dirección los confirme. No se muestran datos provisionales para evitar que alguien llame o acuda a un lugar equivocado.</p>
            </div>`}
        </div>
        <div>
          ${formularioActivo
            ? formularioContacto(ctx)
            : html`<div class="pending" role="note">
              <div class="pending-title">${icono('info')}<h3>Formulario no disponible</h3></div>
              <p>El formulario de contacto se habilitará cuando la escuela defina quién recibirá los mensajes y apruebe su aviso de privacidad. Por ahora no se envían mensajes desde este sitio.</p>
            </div>`}
        </div>
      </div>
    </section>`;
  return {
    ruta: 'contacto/', titulo: 'Contacto',
    descripcion: 'Medios institucionales de contacto de la escuela.',
    migas: [{ titulo: 'Contacto' }], contenido,
  };
}

// ---------- Páginas transversales ----------
function privacidad(ctx) {
  const aprobada = paginaAprobada(ctx, 'privacidad');
  const contenido = html`
    ${encabezadoPagina({ titulo: 'Privacidad', descripcion: 'Qué datos trata este sitio y cómo se protege la información de la comunidad escolar.' })}
    <section class="section">
      <div class="wrap narrow prose">
        <h2>Qué hace este sitio con tus datos</h2>
        <ul>
          <li>No usa cookies ni herramientas de analítica o publicidad.</li>
          <li>No carga recursos de terceros (tipografías, mapas incrustados, redes sociales).</li>
          <li>No publica datos personales de estudiantes, como CURP, domicilios, calificaciones o expedientes.</li>
          <li>No publica fotografías, videos ni nombres de menores sin autorización documentada.</li>
          <li>${ctx.config.contactEndpoint && paginaAprobada(ctx, 'privacidad')
            ? 'El formulario de contacto envía únicamente los datos que escribes en él.'
            : 'No recopila datos mediante formularios: el formulario de contacto no está habilitado.'}</li>
        </ul>
        <p>Como ocurre con cualquier sitio web, el proveedor de alojamiento y de red de entrega puede registrar datos técnicos de las visitas (por ejemplo, la dirección IP) para entregar el sitio y protegerlo de abusos.</p>
        <h2>Aviso de privacidad integral</h2>
        ${aprobada?.bloques
          ? bloques(ctx, aprobada.bloques, ctx.content.documentos)
          : html`<div class="pending" role="note">
            <div class="pending-title">${icono('info')}<h3>Pendiente de aprobación</h3></div>
            <p>El aviso de privacidad integral (responsable del tratamiento, finalidades, destinatarios, conservación y medios para ejercer derechos) será publicado cuando lo apruebe la persona responsable de la escuela.</p>
          </div>`}
      </div>
    </section>`;
  return {
    ruta: 'privacidad/', titulo: 'Privacidad',
    descripcion: 'Cómo trata este sitio los datos personales y cómo protege a la comunidad escolar.',
    migas: [{ titulo: 'Privacidad' }], contenido,
  };
}

function accesibilidad(ctx) {
  const contenido = html`
    ${encabezadoPagina({ titulo: 'Accesibilidad', descripcion: 'Compromiso y medidas para que el sitio pueda usarse por todas las personas.' })}
    <section class="section">
      <div class="wrap narrow prose">
        <p>El objetivo de diseño de este sitio es cumplir el nivel AA de las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.2. Este sitio <strong>no declara conformidad</strong>: todavía no se ha realizado una auditoría completa con tecnologías de asistencia.</p>
        <h2>Medidas aplicadas</h2>
        <ul>
          <li>Estructura semántica con encabezados ordenados y enlace para saltar al contenido.</li>
          <li>Navegación completa con teclado e indicador de foco visible.</li>
          <li>Diseño adaptable a teléfonos y legible con zoom del navegador.</li>
          <li>Categorías y estados de los avisos comunicados con texto e icono, no solo con color.</li>
          <li>Respeto a la preferencia del sistema de reducir el movimiento.</li>
          <li>Los avisos importantes se publican como texto en la página, no solo como imagen o PDF.</li>
        </ul>
        <h2>Limitaciones conocidas</h2>
        <ul>
          <li>Los documentos descargables (por ejemplo PDF) pueden no ser plenamente accesibles según como los haya elaborado la escuela.</li>
        </ul>
        <h2>Reportar un problema de accesibilidad</h2>
        <p>Cuando los medios de contacto oficiales estén publicados, podrás reportar cualquier barrera desde la página de <a href="${ctx.url('contacto/')}">Contacto</a>.</p>
      </div>
    </section>`;
  return {
    ruta: 'accesibilidad/', titulo: 'Accesibilidad',
    descripcion: 'Objetivos y medidas de accesibilidad de este sitio.',
    migas: [{ titulo: 'Accesibilidad' }], contenido,
  };
}

function politicaUso(ctx) {
  const aprobada = paginaAprobada(ctx, 'politica-uso');
  const contenido = html`
    ${encabezadoPagina({ titulo: 'Política de uso del sitio', descripcion: 'Condiciones generales de uso de este sitio.' })}
    <section class="section"><div class="wrap narrow">
      ${aprobada?.bloques
        ? html`<div class="prose">${bloques(ctx, aprobada.bloques, ctx.content.documentos)}</div>`
        : contenidoPendiente(ctx, { contenidoFuturo: ['Condiciones de uso aprobadas por la dirección, si ésta determina que proceden'] })}
    </div></section>`;
  return {
    ruta: 'politica-de-uso/', titulo: 'Política de uso del sitio',
    descripcion: 'Condiciones de uso del sitio.', migas: [{ titulo: 'Política de uso' }], contenido,
  };
}

function demostracion(ctx) {
  const contenido = html`
    ${encabezadoPagina({ titulo: 'Acerca de esta demostración', descripcion: 'Este sitio es un prototipo funcional pendiente de autorización.' })}
    <section class="section">
      <div class="wrap narrow prose">
        <p>Este sitio es una <strong>versión de demostración</strong>. No ha sido autorizado ni es administrado por la dirección de la escuela, por lo que no debe considerarse su portal oficial.</p>
        <h2>Qué significa</h2>
        <ul>
          <li>Solo se muestran datos que provienen de fuentes públicas y que no requieren validación especial. Los demás aparecen como pendientes.</li>
          <li>No se ha publicado ningún comunicado, fecha, trámite ni documento oficial.</li>
          <li>El logotipo es un marcador provisional, no el escudo ni la identidad oficial de la escuela.</li>
          <li>Los buscadores tienen indicado no indexar esta versión.</li>
        </ul>
        <h2>Qué falta para publicarlo como sitio oficial</h2>
        <ul>
          <li>Autorización expresa de la dirección escolar.</li>
          <li>Validación del domicilio, teléfono, correo y horarios.</li>
          <li>Contenidos institucionales aprobados y aviso de privacidad revisado.</li>
          <li>Definir quién actualizará el sitio y cómo se aprueban las publicaciones.</li>
        </ul>
      </div>
    </section>`;
  return {
    ruta: 'demostracion/', titulo: 'Acerca de esta demostración',
    descripcion: 'Estado de este sitio: versión de demostración no oficial.',
    migas: [{ titulo: 'Demostración' }], contenido,
  };
}

function pagina404(ctx) {
  const contenido = html`
    ${encabezadoPagina({ titulo: 'Página no encontrada', descripcion: 'La dirección que buscas no existe o cambió de lugar.' })}
    <section class="section"><div class="wrap narrow">
      <p>Puedes continuar desde alguno de estos lugares:</p>
      <ul class="link-list">
        <li><a href="${ctx.url('')}">Inicio${icono('flecha')}</a></li>
        <li><a href="${ctx.url('avisos/')}">Avisos${icono('flecha')}</a></li>
        <li><a href="${ctx.url('estudiantes-y-familias/')}">Estudiantes y familias${icono('flecha')}</a></li>
        <li><a href="${ctx.url('documentos/')}">Documentos${icono('flecha')}</a></li>
        <li><a href="${ctx.url('contacto/')}">Contacto${icono('flecha')}</a></li>
      </ul>
    </div></section>`;
  return { ruta: '404.html', archivo: '404.html', titulo: 'Página no encontrada', descripcion: 'La página solicitada no existe.', contenido, noindex: true };
}

function paginaError(ctx) {
  const contenido = html`
    ${encabezadoPagina({ titulo: 'Sitio no disponible por el momento', descripcion: 'Estamos teniendo un problema técnico.' })}
    <section class="section"><div class="wrap narrow">
      <p>Intenta de nuevo en unos minutos. Si el problema continúa, consulta los medios de contacto institucionales cuando estén publicados.</p>
      <p><a class="link-arrow" href="${ctx.url('')}">Ir al inicio${icono('flecha')}</a></p>
    </div></section>`;
  return { ruta: 'error/', titulo: 'Sitio no disponible', descripcion: 'El sitio no está disponible temporalmente.', contenido, noindex: true };
}

export function construirPaginas(ctx) {
  const lista = [inicio(ctx)];
  for (const s of SECCIONES) lista.push(indiceSeccion(ctx, s));
  for (const p of PAGINAS) lista.push(paginaContenido(ctx, p));
  lista.push(avisosIndice(ctx), avisosArchivo(ctx));
  for (const a of avisosPublicos(ctx.content.avisos, ctx.today)) lista.push(avisoDetalle(ctx, a));
  lista.push(documentosIndice(ctx), contacto(ctx), privacidad(ctx), accesibilidad(ctx), politicaUso(ctx));
  if (ctx.config.isDemo) lista.push(demostracion(ctx));
  lista.push(pagina404(ctx), paginaError(ctx));

  return lista.map((p) => ({
    ...p,
    archivo: p.archivo ?? `${p.ruta}index.html`,
    html: layout(ctx, p).toString(),
  }));
}
