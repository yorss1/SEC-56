import test from 'node:test';
import assert from 'node:assert/strict';
import { html, esc, raw, safeUrl, formatDate } from '../src/lib/html.mjs';
import {
  validateAviso, validateSite, validateDocumento, validatePagina, vigenciaAviso, isValidIsoDate, isValidCiclo,
} from '../src/lib/content.mjs';
import { avisoBase } from './helpers.mjs';

const validar = (aviso, file = '/x/aviso-de-prueba.json', ctx = { documentosIds: new Set() }) => {
  const errors = [];
  const warnings = [];
  validateAviso(aviso, file, errors, warnings, ctx);
  return { errors, warnings };
};

test('html escapa valores interpolados', () => {
  const out = html`<p>${'<script>alert(1)</script>'}</p>`.toString();
  assert.equal(out, '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
  assert.equal(esc('"&\''), '&quot;&amp;&#39;');
});

test('raw no se vuelve a escapar y las listas se unen', () => {
  assert.equal(html`<b>${raw('<i>x</i>')}</b>`.toString(), '<b><i>x</i></b>');
  assert.equal(html`${['<a>', '<b>']}`.toString(), '&lt;a&gt;&lt;b&gt;');
});

test('safeUrl rechaza esquemas peligrosos', () => {
  assert.equal(safeUrl('javascript:alert(1)'), '#');
  assert.equal(safeUrl('data:text/html,hola'), '#');
  assert.equal(safeUrl('https://ejemplo.mx/a'), 'https://ejemplo.mx/a');
  assert.equal(safeUrl('/avisos/'), '/avisos/');
});

test('formatDate y validadores de fecha y ciclo', () => {
  assert.equal(formatDate('2026-10-14'), '14 de octubre de 2026');
  assert.ok(isValidIsoDate('2026-02-28'));
  assert.ok(!isValidIsoDate('2026-02-30'));
  assert.ok(isValidCiclo('2026-2027'));
  assert.ok(!isValidCiclo('2026-2028'));
});

test('un aviso válido no produce errores', () => {
  assert.deepEqual(validar(avisoBase()).errors, []);
});

test('el nombre del archivo debe coincidir con el slug', () => {
  const { errors } = validar(avisoBase(), '/x/otro.json');
  assert.ok(errors.some((e) => /debe llamarse/.test(e.mensaje)));
});

test('aprobador y autor deben ser personas distintas', () => {
  const { errors } = validar(avisoBase({ aprobador: 'autora uno' }));
  assert.ok(errors.some((e) => /persona distinta/.test(e.mensaje)));
});

test('un aviso publicado exige aprobador y fecha de publicación', () => {
  const sinAprobador = avisoBase();
  delete sinAprobador.aprobador;
  assert.ok(validar(sinAprobador).errors.some((e) => /requiere "aprobador"/.test(e.mensaje)));
  const sinFecha = avisoBase();
  delete sinFecha.publicado;
  assert.ok(validar(sinFecha).errors.some((e) => /requiere "publicado"/.test(e.mensaje)));
});

test('se rechaza una CURP en el contenido', () => {
  const { errors } = validar(avisoBase({ cuerpo: [{ tipo: 'parrafo', texto: 'Alumno GOMC120304HHGMRR09 aprobado' }] }));
  assert.ok(errors.some((e) => /CURP/.test(e.mensaje)));
});

test('correos y teléfonos generan advertencia, no error', () => {
  const { errors, warnings } = validar(avisoBase({ cuerpo: [{ tipo: 'parrafo', texto: 'Llama al 775 755 1590 o escribe a alguien@ejemplo.mx' }] }));
  assert.deepEqual(errors, []);
  assert.equal(warnings.length, 2);
});

test('se rechazan imágenes, fechas incoherentes y bloques inválidos', () => {
  assert.ok(validar(avisoBase({ imagenes: ['a.jpg'] })).errors.length);
  assert.ok(validar(avisoBase({ vence: '2026-10-01' })).errors.some((e) => /"vence"/.test(e.mensaje)));
  assert.ok(validar(avisoBase({ cuerpo: [{ tipo: 'html', texto: '<b>x</b>' }] })).errors.length);
  assert.ok(validar(avisoBase({ cuerpo: [{ tipo: 'enlace', texto: 'x', url: 'javascript:alert(1)' }] })).errors.length);
});

test('los marcadores [REDACTAR] solo se admiten en borradores', () => {
  const borrador = avisoBase({ estado: 'borrador', resumen: '[REDACTAR] resumen' });
  delete borrador.aprobador;
  delete borrador.publicado;
  assert.deepEqual(validar(borrador).errors, []);
  const enRevision = { ...borrador, estado: 'en_revision' };
  assert.ok(validar(enRevision).errors.some((e) => /REDACTAR/.test(e.mensaje)));
});

test('vigencia de avisos: vigente, vencido, programado, archivado y no publicado', () => {
  const hoy = '2026-10-14';
  assert.equal(vigenciaAviso(avisoBase(), hoy), 'vigente');
  assert.equal(vigenciaAviso(avisoBase({ vence: '2026-10-14' }), hoy), 'vigente');
  assert.equal(vigenciaAviso(avisoBase({ vence: '2026-10-13' }), hoy), 'vencido');
  assert.equal(vigenciaAviso(avisoBase({ publicado: '2026-10-20' }), hoy), 'programado');
  assert.equal(vigenciaAviso(avisoBase({ estado: 'archivado' }), hoy), 'archivado');
  assert.equal(vigenciaAviso(avisoBase({ estado: 'aprobado' }), hoy), 'no_publicado');
});

const siteMinimo = (campo) => ({
  autorizacion: { otorgada: false },
  institucion: { nombre: { valor: 'X', estado: 'confirmado_dossier', publicar: true }, ...campo },
});
const validarSite = (site) => {
  const errors = [];
  validateSite(site, 'site.json', errors);
  return errors;
};

test('un dato pendiente de validación no puede publicarse sin aprobación', () => {
  const errores = validarSite(siteMinimo({ telefono: { valor: '775 000 0000', estado: 'pendiente_validacion', publicar: true } }));
  assert.ok(errores.some((e) => /telefono/.test(e.mensaje)));
});

test('datos sensibles exigen aprobación expresa aunque vengan del dossier', () => {
  const errores = validarSite(siteMinimo({ cct: { valor: '13DST0058M', estado: 'confirmado_dossier', publicar: true } }));
  assert.ok(errores.some((e) => /aprobación expresa/.test(e.mensaje)));
  const ok = validarSite(siteMinimo({
    cct: { valor: '13DST0058M', estado: 'confirmado_dossier', publicar: true, aprobadoPor: 'Dirección', aprobadoEn: '2026-10-20' },
  }));
  assert.deepEqual(ok, []);
});

test('no se puede publicar un dato vacío ni una autorización incompleta', () => {
  assert.ok(validarSite(siteMinimo({ correo: { valor: null, estado: 'confirmado_dossier', publicar: true, aprobadoPor: 'A', aprobadoEn: '2026-10-20' } })).length);
  const errors = [];
  validateSite({ autorizacion: { otorgada: true, responsable: null, fecha: null }, institucion: {} }, 'site.json', errors);
  assert.ok(errors.some((e) => /autorización/i.test(e.mensaje)));
});

test('el content/site.json real es válido y no publica datos pendientes', async () => {
  const fs = await import('node:fs');
  const { ROOT } = await import('../src/lib/config.mjs');
  const site = JSON.parse(fs.readFileSync(`${ROOT}/content/site.json`, 'utf8'));
  assert.deepEqual(validarSite(site), []);
  for (const clave of ['cct', 'direccion', 'codigoPostal', 'telefono', 'correo', 'fundacion', 'director', 'turnos']) {
    assert.equal(site.institucion[clave].publicar, false, `${clave} debe seguir sin publicarse`);
  }
});

test('documentos: extensión, datos personales y archivo existente', () => {
  const errors = [];
  const doc = {
    id: 'calendario', nombre: 'Calendario', descripcion: 'x', archivo: 'archivos/calendario.exe',
    categoria: 'calendario', estado: 'publicado', cicloEscolar: '2026-2027', publicado: '2026-10-05',
    aprobador: 'A', contieneDatosPersonales: false,
  };
  validateDocumento(doc, '/x/calendario.json', errors, [], {});
  assert.ok(errors.some((e) => /Extensión no permitida/.test(e.mensaje)));
  const e2 = [];
  validateDocumento({ ...doc, archivo: 'archivos/calendario.pdf', contieneDatosPersonales: true }, '/x/calendario.json', e2, [], {});
  assert.ok(e2.some((e) => /datos personales/.test(e.mensaje)));
  const e3 = [];
  validateDocumento({ ...doc, archivo: 'archivos/../secreto.pdf' }, '/x/calendario.json', e3, [], {});
  assert.ok(e3.some((e) => /forma archivos/.test(e.mensaje)));
  const e4 = [];
  const sinFlag = { ...doc, archivo: 'archivos/calendario.pdf' };
  delete sinFlag.contieneDatosPersonales;
  validateDocumento(sinFlag, '/x/calendario.json', e4, [], {});
  assert.ok(e4.some((e) => /contieneDatosPersonales/.test(e.mensaje)));
});

test('páginas: una página aprobada necesita aprobador y contenido', () => {
  const errors = [];
  validatePagina('conocenos-historia', { estado: 'aprobado', bloques: [{ tipo: 'parrafo', texto: 'x' }] }, 'p.json', errors, [], new Set());
  assert.ok(errors.some((e) => /aprobadoPor/.test(e.mensaje)));
  const e2 = [];
  validatePagina('x', { estado: 'pendiente' }, 'p.json', e2, [], new Set());
  assert.deepEqual(e2, []);
});

test('trámites aprobados exigen todos los campos', () => {
  const errors = [];
  validatePagina('familias-inscripcion', {
    estado: 'aprobado', aprobadoPor: 'Dirección', aprobadoEn: '2026-10-20', tramite: { dirigidoA: 'x' },
  }, 'p.json', errors, [], new Set());
  assert.ok(errors.some((e) => /tramite\.periodo/.test(e.mensaje)));
  assert.ok(errors.some((e) => /cicloEscolar/.test(e.mensaje)));
});
