import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { nuevoAviso, transicionar, slugify, registrarBitacora, leerBitacora, validarAvisoEditorial } from '../src/lib/editorial.mjs';
import { contenidoTemporal, limpiar } from './helpers.mjs';

const HOY = '2026-10-14';
const nuevo = () => nuevoAviso({ titulo: 'Inscripción: ¡nuevo ingreso!', categoria: 'convocatoria', ciclo: '2026-2027', autor: 'Autora Uno' }, HOY, 3);

test('slugify quita acentos y símbolos', () => {
  assert.equal(slugify('Inscripción: ¡nuevo ingreso!'), 'inscripcion-nuevo-ingreso');
});

test('nuevo aviso nace como borrador con marcadores por completar', () => {
  const a = nuevo();
  assert.equal(a.estado, 'borrador');
  assert.equal(a.id, 'aviso-2026-003');
  assert.equal(a.slug, 'inscripcion-nuevo-ingreso');
  assert.ok(JSON.stringify(a).includes('[REDACTAR]'));
});

test('nuevo aviso valida categoría, ciclo y autor', () => {
  assert.throws(() => nuevoAviso({ titulo: 'x', categoria: 'nada', ciclo: '2026-2027', autor: 'A' }, HOY), /categoria/);
  assert.throws(() => nuevoAviso({ titulo: 'x', categoria: 'noticia', ciclo: '2026', autor: 'A' }, HOY), /ciclo/);
  assert.throws(() => nuevoAviso({ titulo: 'x', categoria: 'noticia', ciclo: '2026-2027', autor: '' }, HOY), /autor/);
});

test('flujo completo borrador → en_revision → aprobado → publicado → archivado', () => {
  let a = { ...nuevo(), resumen: 'Resumen real.', cuerpo: [{ tipo: 'parrafo', texto: 'Texto real.' }] };
  a = transicionar(a, 'enviar-revision', { por: 'Autora Uno' }, HOY);
  assert.equal(a.estado, 'en_revision');
  a = transicionar(a, 'aprobar', { por: 'Aprobador Dos' }, HOY);
  assert.equal(a.estado, 'aprobado');
  assert.equal(a.aprobador, 'Aprobador Dos');
  a = transicionar(a, 'publicar', { por: 'Aprobador Dos', vence: '2026-11-01' }, HOY);
  assert.equal(a.estado, 'publicado');
  assert.equal(a.publicado, HOY);
  assert.equal(a.vence, '2026-11-01');
  assert.deepEqual(validarAvisoEditorial(a, '/x/inscripcion-nuevo-ingreso.json', { documentosIds: new Set() }).errors, []);
  a = transicionar(a, 'archivar', { por: 'Aprobador Dos' }, HOY);
  assert.equal(a.estado, 'archivado');
});

test('no se permiten saltos de estado ni aprobar el propio aviso', () => {
  const a = nuevo();
  assert.throws(() => transicionar(a, 'publicar', { por: 'X' }, HOY), /No se puede ejecutar/);
  assert.throws(() => transicionar(a, 'aprobar', { por: 'X' }, HOY), /No se puede ejecutar/);
  const enRevision = transicionar(a, 'enviar-revision', { por: 'Autora Uno' }, HOY);
  assert.throws(() => transicionar(enRevision, 'aprobar', { por: 'autora uno' }, HOY), /distinta del autor/);
});

test('devolver y retirar exigen motivo y limpian la aprobación', () => {
  let a = { ...nuevo(), resumen: 'R', cuerpo: [{ tipo: 'parrafo', texto: 'T' }] };
  a = transicionar(a, 'enviar-revision', { por: 'Autora Uno' }, HOY);
  a = transicionar(a, 'aprobar', { por: 'Otra' }, HOY);
  assert.throws(() => transicionar(a, 'devolver', { por: 'Otra' }, HOY), /motivo/);
  const dev = transicionar(a, 'devolver', { por: 'Otra', motivo: 'Falta una fecha' }, HOY);
  assert.equal(dev.estado, 'borrador');
  assert.equal(dev.aprobador, undefined);
  const pub = transicionar(a, 'publicar', { por: 'Otra' }, HOY);
  assert.throws(() => transicionar(pub, 'retirar', { por: 'Otra' }, HOY), /motivo/);
  const retirado = transicionar(pub, 'retirar', { por: 'Otra', motivo: 'Publicado por error' }, HOY);
  assert.equal(retirado.estado, 'borrador');
  assert.equal(retirado.publicado, undefined);
});

test('se exige --por y una fecha de publicación válida', () => {
  const a = { ...nuevo(), estado: 'aprobado', aprobador: 'Otra' };
  assert.throws(() => transicionar(a, 'publicar', {}, HOY), /--por/);
  assert.throws(() => transicionar(a, 'publicar', { por: 'X', fecha: '14/10/2026' }, HOY), /--fecha/);
});

test('la bitácora es append-only y se puede leer', () => {
  const tmp = contenidoTemporal();
  try {
    registrarBitacora(tmp.content, { ts: '2026-10-14T10:00:00Z', accion: 'nuevo', slug: 'a', usuario: 'X', de: null, a: 'borrador' });
    registrarBitacora(tmp.content, { ts: '2026-10-14T11:00:00Z', accion: 'enviar-revision', slug: 'a', usuario: 'X', de: 'borrador', a: 'en_revision' });
    const filas = leerBitacora(tmp.content);
    assert.equal(filas.length, 2);
    assert.equal(filas[1].a, 'en_revision');
    assert.equal(fs.readFileSync(path.join(tmp.content, 'bitacora.jsonl'), 'utf8').split('\n').filter(Boolean).length, 2);
  } finally {
    limpiar(tmp);
  }
});
