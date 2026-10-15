import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { build } from '../src/lib/build.mjs';
import { loadContent } from '../src/lib/content.mjs';
import { verificarDist } from '../src/lib/verify.mjs';
import { loadConfig, ROOT } from '../src/lib/config.mjs';
import {
  avisoBase, contenidoTemporal, configTemporal, leer, existe, limpiar,
} from './helpers.mjs';

function compilar(tmp, env = {}) {
  const config = configTemporal(tmp, env);
  const resultado = build(config);
  return { config, resultado };
}

function verificar(tmp, config) {
  const content = loadContent(config);
  return verificarDist(tmp.out, { site: content.site, documentos: content.documentos, config });
}

test('el contenido real compila en modo demostración y la salida pasa la verificación', () => {
  const tmp = contenidoTemporal();
  try {
    const { config, resultado } = compilar(tmp);
    assert.ok(resultado.paginas.length >= 40);
    const { problemas } = verificar(tmp, config);
    assert.deepEqual(problemas, []);
  } finally {
    limpiar(tmp);
  }
});

test('todas las rutas de la arquitectura existen', () => {
  const tmp = contenidoTemporal();
  try {
    compilar(tmp);
    const rutas = [
      '', 'conocenos/', 'conocenos/historia/', 'conocenos/identidad/', 'conocenos/modelo-educativo/',
      'conocenos/autoridades/', 'conocenos/instalaciones/', 'oferta-educativa/', 'oferta-educativa/primer-grado/',
      'oferta-educativa/segundo-grado/', 'oferta-educativa/tercer-grado/', 'oferta-educativa/asignaturas/',
      'oferta-educativa/tecnologias-talleres/', 'oferta-educativa/actividades-complementarias/',
      'estudiantes-y-familias/', 'estudiantes-y-familias/inscripcion/', 'estudiantes-y-familias/reinscripcion/',
      'estudiantes-y-familias/requisitos/', 'estudiantes-y-familias/calendario/',
      'estudiantes-y-familias/evaluaciones-tramites/', 'estudiantes-y-familias/acuerdos-escolares/',
      'estudiantes-y-familias/preguntas-frecuentes/', 'estudiantes-y-familias/orientacion-apoyo/',
      'estudiantes-y-familias/participacion-familiar/', 'vida-escolar/', 'vida-escolar/actividades-academicas/',
      'vida-escolar/cultura-y-artes/', 'vida-escolar/deportes/', 'vida-escolar/eventos-civicos/',
      'vida-escolar/proyectos-y-exposiciones/', 'vida-escolar/galeria/', 'vida-escolar/reconocimientos/',
      'avisos/', 'avisos/archivo/', 'documentos/', 'contacto/', 'privacidad/', 'accesibilidad/',
      'politica-de-uso/', 'demostracion/', 'error/',
    ];
    for (const r of rutas) assert.ok(existe(tmp, r, 'index.html'), `falta ${r}`);
    assert.ok(existe(tmp, '404.html'));
  } finally {
    limpiar(tmp);
  }
});

test('sin información aprobada las páginas muestran estados pendientes neutrales', () => {
  const tmp = contenidoTemporal();
  try {
    compilar(tmp);
    const home = leer(tmp, 'index.html');
    assert.match(home, /Todavía no hay avisos publicados/);
    assert.match(leer(tmp, 'conocenos/historia/index.html'), /Información en preparación/);
    assert.match(leer(tmp, 'contacto/index.html'), /Datos en validación/);
    assert.match(leer(tmp, 'contacto/index.html'), /Formulario no disponible/);
    assert.match(leer(tmp, 'documentos/index.html'), /Todavía no hay documentos publicados/);
  } finally {
    limpiar(tmp);
  }
});

test('los datos pendientes del dossier no aparecen en la salida pública', () => {
  const tmp = contenidoTemporal();
  try {
    compilar(tmp);
    const todo = ['index.html', 'contacto/index.html', 'conocenos/instalaciones/index.html', 'privacidad/index.html']
      .map((f) => leer(tmp, f)).join('\n');
    for (const prohibido of ['775 755 1590', '13DST0058M', 'Cosme Hernández', '43684', '43680', 'El Paraíso', 'yahoo', '683']) {
      assert.ok(!todo.includes(prohibido), `no debe aparecer "${prohibido}"`);
    }
  } finally {
    limpiar(tmp);
  }
});

test('un dato aprobado sí se publica en contacto y pie', () => {
  const tmp = contenidoTemporal();
  try {
    const sitePath = path.join(tmp.content, 'site.json');
    const site = JSON.parse(fs.readFileSync(sitePath, 'utf8'));
    Object.assign(site.institucion.telefono, { publicar: true, aprobadoPor: 'Dirección', aprobadoEn: '2026-10-20' });
    Object.assign(site.institucion.cct, { publicar: true, aprobadoPor: 'Dirección', aprobadoEn: '2026-10-20' });
    fs.writeFileSync(sitePath, JSON.stringify(site));
    const { config } = compilar(tmp);
    assert.match(leer(tmp, 'contacto/index.html'), /href="tel:\+527757551590"/);
    assert.match(leer(tmp, 'index.html'), /CCT 13DST0058M/);
    // El verificador conoce el nuevo estado y no lo marca como fuga.
    assert.deepEqual(verificar(tmp, config).problemas, []);
  } finally {
    limpiar(tmp);
  }
});

test('avisos: vigentes, vencidos, archivados, borradores y programados', () => {
  const tmp = contenidoTemporal({
    avisos: [
      avisoBase({ id: 'aviso-2026-001', slug: 'vigente', titulo: 'Aviso vigente', prioridad: 'alta', vence: '2026-12-01',
        fechasClave: [{ fecha: '2026-11-02', descripcion: 'Fecha de prueba' }] }),
      avisoBase({ id: 'aviso-2026-002', slug: 'vencido', titulo: 'Aviso vencido', vence: '2026-10-10' }),
      avisoBase({ id: 'aviso-2026-003', slug: 'archivado', titulo: 'Aviso archivado', estado: 'archivado' }),
      avisoBase({ id: 'aviso-2026-004', slug: 'borrador', titulo: 'Aviso borrador', estado: 'borrador', aprobador: undefined, publicado: undefined }),
      avisoBase({ id: 'aviso-2026-005', slug: 'programado', titulo: 'Aviso programado', publicado: '2026-12-01' }),
      avisoBase({ id: 'aviso-2026-006', slug: 'en-revision', titulo: 'Aviso en revisión', estado: 'en_revision', aprobador: undefined, publicado: undefined }),
    ].map((a) => JSON.parse(JSON.stringify(a))),
  });
  try {
    const { config } = compilar(tmp);
    assert.ok(existe(tmp, 'avisos', 'vigente', 'index.html'));
    assert.ok(existe(tmp, 'avisos', 'vencido', 'index.html'));
    assert.ok(existe(tmp, 'avisos', 'archivado', 'index.html'));
    assert.ok(!existe(tmp, 'avisos', 'borrador', 'index.html'));
    assert.ok(!existe(tmp, 'avisos', 'programado', 'index.html'));
    assert.ok(!existe(tmp, 'avisos', 'en-revision', 'index.html'));

    const lista = leer(tmp, 'avisos', 'index.html');
    assert.match(lista, /Aviso vigente/);
    assert.ok(!/Aviso vencido/.test(lista), 'los vencidos no van en la lista principal');
    assert.ok(!/Aviso borrador|Aviso programado|Aviso en revisión/.test(lista));

    const archivo = leer(tmp, 'avisos', 'archivo', 'index.html');
    assert.match(archivo, /Aviso vencido/);
    assert.match(archivo, /Aviso archivado/);
    assert.match(archivo, /data-vigencia="vencido"/);
    assert.match(archivo, /<span>Vencido<\/span>/);

    const detalleVencido = leer(tmp, 'avisos', 'vencido', 'index.html');
    assert.ok(!/data-banner-vencido[^>]*hidden/.test(detalleVencido), 'el banner de vencido debe estar visible');
    const detalleVigente = leer(tmp, 'avisos', 'vigente', 'index.html');
    assert.match(detalleVigente, /data-banner-vencido[^>]*hidden/);

    const home = leer(tmp, 'index.html');
    assert.match(home, /Aviso destacado/);
    assert.match(home, /Próximas fechas/);
    assert.match(home, /2 de noviembre de 2026/);
    assert.deepEqual(verificar(tmp, config).problemas, []);
  } finally {
    limpiar(tmp);
  }
});

test('el contenido de los avisos se escapa (sin XSS)', () => {
  const tmp = contenidoTemporal({
    avisos: [avisoBase({
      titulo: '<img src=x onerror=alert(1)>',
      resumen: '"><script>alert(1)</script>',
      cuerpo: [
        { tipo: 'parrafo', texto: '<script>alert("x")</script>' },
        { tipo: 'enlace', texto: 'Enlace', url: 'https://ejemplo.mx/?a=1&b="2"' },
      ],
    })],
  });
  try {
    const { config } = compilar(tmp);
    const detalle = leer(tmp, 'avisos', 'aviso-de-prueba', 'index.html');
    assert.ok(!detalle.includes('<script>alert'));
    assert.ok(!detalle.includes('<img src=x'));
    assert.match(detalle, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
    assert.deepEqual(verificar(tmp, config).problemas, []);
  } finally {
    limpiar(tmp);
  }
});

test('un contenido inválido detiene la compilación con detalles', () => {
  const tmp = contenidoTemporal({ avisos: [avisoBase({ cuerpo: [{ tipo: 'parrafo', texto: 'CURP GOMC120304HHGMRR09' }] })] });
  try {
    assert.throws(() => compilar(tmp), (error) => {
      assert.match(error.message, /errores/);
      assert.ok(error.detalles.some((d) => /CURP/.test(d.mensaje)));
      return true;
    });
  } finally {
    limpiar(tmp);
  }
});

test('modo producción exige autorización y SITE_URL', () => {
  const tmp = contenidoTemporal();
  try {
    assert.throws(() => compilar(tmp, { SITE_MODE: 'produccion' }), (error) => {
      assert.ok(error.detalles.length >= 2);
      return true;
    });
    assert.throws(() => compilar(tmp, { SITE_MODE: 'produccion', SITE_URL: 'http://inseguro.example' }), /https/);
  } finally {
    limpiar(tmp);
  }
});

test('modo producción autorizado: indexable, canonical, sitemap, HSTS y sin banner de demo', () => {
  const tmp = contenidoTemporal();
  try {
    const sitePath = path.join(tmp.content, 'site.json');
    const site = JSON.parse(fs.readFileSync(sitePath, 'utf8'));
    site.autorizacion = { otorgada: true, responsable: 'Dirección', fecha: '2026-10-30' };
    fs.writeFileSync(sitePath, JSON.stringify(site));
    const { config } = compilar(tmp, { SITE_MODE: 'produccion', SITE_URL: 'https://dominio-de-prueba.example' });
    const home = leer(tmp, 'index.html');
    assert.match(home, /<meta name="robots" content="index, follow">/);
    assert.match(home, /<link rel="canonical" href="https:\/\/dominio-de-prueba\.example\/">/);
    assert.ok(!/demo-banner/.test(home));
    assert.ok(!existe(tmp, 'demostracion', 'index.html'));
    const sitemap = leer(tmp, 'sitemap.xml');
    assert.match(sitemap, /<loc>https:\/\/dominio-de-prueba\.example\/avisos\/<\/loc>/);
    assert.ok(!/404|error\//.test(sitemap));
    assert.match(leer(tmp, 'robots.txt'), /Sitemap: https:\/\/dominio-de-prueba\.example\/sitemap\.xml/);
    assert.match(leer(tmp, '_headers'), /Strict-Transport-Security/);
    assert.ok(!/X-Robots-Tag/.test(leer(tmp, '_headers')));
    // La 404 no debe llevar canonical ni indexarse.
    assert.match(leer(tmp, '404.html'), /noindex/);
    assert.ok(!/rel="canonical"/.test(leer(tmp, '404.html')));
    assert.deepEqual(verificar(tmp, config).problemas, []);
  } finally {
    limpiar(tmp);
  }
});

test('modo demostración: noindex, robots bloqueado y sin sitemap', () => {
  const tmp = contenidoTemporal();
  try {
    compilar(tmp);
    assert.match(leer(tmp, 'index.html'), /noindex, nofollow/);
    assert.match(leer(tmp, 'robots.txt'), /Disallow: \//);
    assert.ok(!existe(tmp, 'sitemap.xml'));
    assert.match(leer(tmp, '_headers'), /X-Robots-Tag: noindex/);
    assert.ok(!/Strict-Transport-Security/.test(leer(tmp, '_headers')));
  } finally {
    limpiar(tmp);
  }
});

test('BASE_PATH reescribe todos los enlaces internos', () => {
  const tmp = contenidoTemporal();
  try {
    const { config } = compilar(tmp, { BASE_PATH: 'escuela' });
    const home = leer(tmp, 'index.html');
    assert.match(home, /href="\/escuela\/avisos\/"/);
    assert.match(home, /href="\/escuela\/assets\/site\.css\?v=/);
    assert.deepEqual(verificar(tmp, config).problemas, []);
  } finally {
    limpiar(tmp);
  }
});

test('el formulario de contacto solo aparece con endpoint configurado y aviso de privacidad aprobado', () => {
  const privacidadAprobada = {
    estado: 'aprobado', aprobadoPor: 'Dirección', aprobadoEn: '2026-10-30', actualizado: '2026-10-30',
    bloques: [{ tipo: 'parrafo', texto: 'Texto del aviso de privacidad aprobado.' }],
  };
  const endpoint = 'https://formularios.dominio-de-prueba.example/contacto';

  const soloEndpoint = contenidoTemporal();
  const soloAviso = contenidoTemporal({ paginas: { privacidad: privacidadAprobada } });
  const ambos = contenidoTemporal({ paginas: { privacidad: privacidadAprobada } });
  try {
    compilar(soloEndpoint, { CONTACT_FORM_ENDPOINT: endpoint });
    assert.ok(!/contact-form/.test(leer(soloEndpoint, 'contacto', 'index.html')));

    compilar(soloAviso);
    assert.ok(!/contact-form/.test(leer(soloAviso, 'contacto', 'index.html')));

    const { config } = compilar(ambos, { CONTACT_FORM_ENDPOINT: endpoint });
    const contacto = leer(ambos, 'contacto', 'index.html');
    assert.match(contacto, /<form class="contact-form" method="post" action="https:\/\/formularios\.dominio-de-prueba\.example\/contacto"/);
    assert.match(contacto, /<label for="c-correo">/);
    assert.match(contacto, /name="sitio_web"/);
    assert.match(leer(ambos, '_headers'), /form-action 'self' https:\/\/formularios\.dominio-de-prueba\.example/);
    assert.deepEqual(verificar(ambos, config).problemas, []);
  } finally {
    limpiar(soloEndpoint);
    limpiar(soloAviso);
    limpiar(ambos);
  }
});

test('solo se copian a dist los documentos publicados o archivados', () => {
  const doc = (id, estado, extra = {}) => ({
    id, nombre: `Documento ${id}`, descripcion: 'Descripción', archivo: `archivos/${id}.pdf`, categoria: 'formatos',
    estado, cicloEscolar: '2026-2027', publicado: '2026-10-05', aprobador: 'Dirección', contieneDatosPersonales: false,
    textoAccesible: 'Resumen en texto.', ...extra,
  });
  const tmp = contenidoTemporal({
    documentos: [doc('publicado', 'publicado'), doc('revision', 'en_revision'), doc('viejo', 'archivado', { cicloEscolar: '2025-2026' })],
    archivos: { 'publicado.pdf': '%PDF-1.4 a', 'revision.pdf': '%PDF-1.4 b', 'viejo.pdf': '%PDF-1.4 c' },
  });
  try {
    const { config } = compilar(tmp);
    assert.ok(existe(tmp, 'archivos', 'publicado.pdf'));
    assert.ok(existe(tmp, 'archivos', 'viejo.pdf'));
    assert.ok(!existe(tmp, 'archivos', 'revision.pdf'));
    const pagina = leer(tmp, 'documentos', 'index.html');
    assert.match(pagina, /Documento publicado/);
    assert.match(pagina, /Archivo por ciclo escolar/);
    assert.match(pagina, /Ciclo 2025-2026/);
    assert.ok(!/Documento revision/.test(pagina));
    assert.match(pagina, /download/);
    assert.deepEqual(verificar(tmp, config).problemas, []);
  } finally {
    limpiar(tmp);
  }
});

test('trámites y preguntas frecuentes aprobados se muestran completos', () => {
  const tmp = contenidoTemporal({
    paginas: {
      'familias-inscripcion': {
        estado: 'aprobado', aprobadoPor: 'Dirección', aprobadoEn: '2026-10-30', cicloEscolar: '2026-2027', actualizado: '2026-10-30',
        tramite: {
          dirigidoA: 'Familias de aspirantes', periodo: 'Del 1 al 5 de febrero', requisitos: ['Requisito A'], pasos: ['Paso 1', 'Paso 2'],
          dondeComo: 'En la dirección', horarios: 'Horario de prueba', canalDudas: 'Canal de prueba',
        },
      },
      'familias-preguntas-frecuentes': {
        estado: 'aprobado', aprobadoPor: 'Dirección', aprobadoEn: '2026-10-30',
        preguntas: [{ pregunta: '¿Pregunta de prueba?', respuesta: 'Respuesta de prueba.' }],
      },
    },
  });
  try {
    const { config } = compilar(tmp);
    const t = leer(tmp, 'estudiantes-y-familias', 'inscripcion', 'index.html');
    assert.match(t, /Familias de aspirantes/);
    assert.match(t, /<ol><li>Paso 1<\/li><li>Paso 2<\/li><\/ol>/);
    assert.match(t, /Ciclo escolar 2026-2027/);
    assert.match(leer(tmp, 'estudiantes-y-familias', 'preguntas-frecuentes', 'index.html'), /<summary>¿Pregunta de prueba\?<\/summary>/);
    assert.deepEqual(verificar(tmp, config).problemas, []);
  } finally {
    limpiar(tmp);
  }
});

test('el verificador detecta fugas de datos, recursos externos y enlaces rotos', () => {
  const tmp = contenidoTemporal();
  try {
    const { config } = compilar(tmp);
    const archivo = path.join(tmp.out, 'conocenos', 'historia', 'index.html');
    const original = fs.readFileSync(archivo, 'utf8');
    const roto = original
      .replace('</main>', '<p>Llama al 775 755 1590</p><a href="/no-existe/">x</a><img src="https://externo.example/a.png"><div style="color:red"></div></main>');
    fs.writeFileSync(archivo, roto);
    const { problemas } = verificar(tmp, config);
    const texto = problemas.map((p) => p.mensaje).join('\n');
    assert.match(texto, /dato no autorizado/);
    assert.match(texto, /Enlace roto: \/no-existe\//);
    assert.match(texto, /Recurso externo/);
    assert.match(texto, /style en línea/);
    assert.match(texto, /sin atributo alt/);
  } finally {
    limpiar(tmp);
  }
});

test('configuración inválida se rechaza', () => {
  assert.throws(() => loadConfig({ SITE_MODE: 'otro' }), /SITE_MODE/);
  assert.throws(() => loadConfig({ CONTACT_FORM_ENDPOINT: 'http://x.example' }), /https/);
  assert.equal(loadConfig({ BASE_PATH: 'a/b' }).base, '/a/b/');
  assert.ok(ROOT.length > 0);
});
