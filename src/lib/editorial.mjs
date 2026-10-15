// Flujo editorial de avisos: borrador → en_revision → aprobado → publicado → archivado.
// La identidad de "por" es declarativa. El control de acceso real lo da el repositorio
// (quién puede confirmar cambios y aprobar solicitudes de integración).
import fs from 'node:fs';
import path from 'node:path';
import { validateAviso, isValidIsoDate, isValidCiclo, CATEGORIAS_AVISO } from './content.mjs';

export const TRANSICIONES = {
  'enviar-revision': { de: ['borrador'], a: 'en_revision' },
  aprobar: { de: ['en_revision'], a: 'aprobado' },
  devolver: { de: ['en_revision', 'aprobado'], a: 'borrador' },
  publicar: { de: ['aprobado'], a: 'publicado' },
  archivar: { de: ['publicado'], a: 'archivado' },
  retirar: { de: ['publicado'], a: 'borrador' },
};

const REQUIEREN_MOTIVO = ['devolver', 'retirar'];

export function slugify(texto) {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function nuevoAviso({ titulo, categoria, ciclo, autor, slug }, today, consecutivo = 1) {
  if (!titulo?.trim()) throw new Error('Falta --titulo.');
  if (!(categoria in CATEGORIAS_AVISO)) throw new Error(`--categoria inválida. Opciones: ${Object.keys(CATEGORIAS_AVISO).join(', ')}.`);
  if (!isValidCiclo(ciclo)) throw new Error('--ciclo debe tener formato AAAA-AAAA consecutivo (ej. 2026-2027).');
  if (!autor?.trim()) throw new Error('Falta --autor.');
  const finalSlug = slug || slugify(titulo);
  if (!finalSlug) throw new Error('No se pudo generar un slug; usa --slug.');
  return {
    id: `aviso-${today.slice(0, 4)}-${String(consecutivo).padStart(3, '0')}`,
    titulo: titulo.trim(),
    slug: finalSlug,
    resumen: '[REDACTAR] Resumen del aviso (máximo 300 caracteres).',
    categoria,
    estado: 'borrador',
    cicloEscolar: ciclo,
    creado: today,
    autor: autor.trim(),
    prioridad: 'normal',
    cuerpo: [{ tipo: 'parrafo', texto: '[REDACTAR] Texto del aviso.' }],
  };
}

export function transicionar(aviso, accion, { por, motivo, fecha, vence } = {}, today) {
  const t = TRANSICIONES[accion];
  if (!t) throw new Error(`Acción desconocida: ${accion}. Opciones: ${Object.keys(TRANSICIONES).join(', ')}.`);
  if (!por?.trim()) throw new Error('Falta --por (nombre de quien realiza la acción).');
  if (!t.de.includes(aviso.estado)) {
    throw new Error(`No se puede ejecutar "${accion}" sobre un aviso en estado "${aviso.estado}". Estados válidos: ${t.de.join(', ')}.`);
  }
  if (REQUIEREN_MOTIVO.includes(accion) && !motivo?.trim()) throw new Error(`"${accion}" requiere --motivo.`);

  const nuevo = { ...aviso, estado: t.a, actualizado: today };
  if (accion === 'aprobar') {
    if (por.trim().toLowerCase() === String(aviso.autor).trim().toLowerCase()) {
      throw new Error('El aprobador debe ser una persona distinta del autor.');
    }
    nuevo.aprobador = por.trim();
  }
  if (accion === 'publicar') {
    const f = fecha || today;
    if (!isValidIsoDate(f)) throw new Error('--fecha debe tener formato AAAA-MM-DD.');
    nuevo.publicado = f;
    if (vence !== undefined) {
      if (!isValidIsoDate(vence)) throw new Error('--vence debe tener formato AAAA-MM-DD.');
      nuevo.vence = vence;
    }
  }
  if (accion === 'devolver' || accion === 'retirar') {
    delete nuevo.aprobador;
    if (accion === 'retirar') delete nuevo.publicado;
  }
  return nuevo;
}

export function validarAvisoEditorial(aviso, file, ctx = {}) {
  const errors = [];
  const warnings = [];
  validateAviso(aviso, file, errors, warnings, ctx);
  return { errors, warnings };
}

export function registrarBitacora(contentDir, entrada) {
  const file = path.join(contentDir, 'bitacora.jsonl');
  fs.appendFileSync(file, `${JSON.stringify(entrada)}\n`);
}

export function leerBitacora(contentDir) {
  const file = path.join(contentDir, 'bitacora.jsonl');
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}
