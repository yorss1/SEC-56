// Carga y validación del contenido. La compilación falla si hay errores.
import fs from 'node:fs';
import path from 'node:path';

export const CATEGORIAS_AVISO = {
  'comunicado-oficial': { etiqueta: 'Comunicado oficial', icono: 'megafono' },
  convocatoria: { etiqueta: 'Convocatoria', icono: 'portapapeles' },
  recordatorio: { etiqueta: 'Recordatorio', icono: 'campana' },
  noticia: { etiqueta: 'Noticia', icono: 'periodico' },
  documento: { etiqueta: 'Documento', icono: 'archivo' },
};

export const ESTADOS_AVISO = ['borrador', 'en_revision', 'aprobado', 'publicado', 'archivado'];

export const CATEGORIAS_DOCUMENTO = {
  calendario: 'Calendario escolar',
  formatos: 'Formatos oficiales',
  reglamentos: 'Reglamentos y acuerdos',
  convocatorias: 'Convocatorias',
  privacidad: 'Aviso de privacidad',
  accesibilidad: 'Accesibilidad y políticas del sitio',
};

export const FORMATOS_DOCUMENTO = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  odt: 'application/vnd.oasis.opendocument.text',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
};

export const ESTADOS_DATO = ['confirmado_dossier', 'pendiente_validacion', 'propuesta'];

// Campos que, aunque aparezcan en el dossier, solo se publican con aprobación expresa.
export const REQUIEREN_APROBACION_EXPRESA = [
  'cct', 'direccion', 'colonia', 'codigoPostal', 'telefono', 'correo',
  'horarioAtencion', 'horarioMatutino', 'horarioVespertino', 'fundacion',
  'redesSociales', 'dominio', 'director', 'turnos',
];

export const TIPOS_BLOQUE = ['parrafo', 'subtitulo', 'lista', 'enlace', 'documento'];

export const CURP_RE = /\b[A-Z]{4}\d{6}[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d\b/i;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const TEL_RE = /\b(?:\d[\s.-]?){10}\b/;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(value) {
  if (typeof value !== 'string' || !ISO_DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function isValidCiclo(value) {
  const m = /^(\d{4})-(\d{4})$/.exec(String(value ?? ''));
  return Boolean(m) && Number(m[2]) === Number(m[1]) + 1;
}

export function todayMexico(buildDate) {
  if (buildDate) return buildDate;
  return new Date(Date.now() - 6 * 3600 * 1000).toISOString().slice(0, 10);
}

function readJson(file, errors) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    errors.push({ file, mensaje: `JSON inválido o ilegible: ${error.message}` });
    return null;
  }
}

function listJson(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
    .sort()
    .map((f) => path.join(dir, f));
}

function scanPrivacidad(texto, file, errors, warnings) {
  if (typeof texto !== 'string') return;
  if (CURP_RE.test(texto)) {
    errors.push({ file, mensaje: 'El contenido parece incluir una CURP. No se publican datos personales de estudiantes.' });
  }
  if (EMAIL_RE.test(texto)) {
    warnings.push({ file, mensaje: 'El contenido incluye una dirección de correo. Confirma que sea institucional y esté aprobada.' });
  }
  if (TEL_RE.test(texto)) {
    warnings.push({ file, mensaje: 'El contenido incluye un número de teléfono. Confirma que sea institucional y esté aprobado.' });
  }
}

function textoDeBloques(bloques) {
  const partes = [];
  for (const b of bloques ?? []) {
    if (typeof b?.texto === 'string') partes.push(b.texto);
    if (Array.isArray(b?.items)) partes.push(...b.items.filter((x) => typeof x === 'string'));
  }
  return partes.join('\n');
}

function validarUrlBloque(url) {
  return typeof url === 'string' && (/^https:\/\/[^\s]+$/i.test(url) || /^\/[^\s]*$/.test(url));
}

export function validateBloques(bloques, file, errors, documentosIds = null) {
  if (!Array.isArray(bloques)) {
    errors.push({ file, mensaje: '"bloques" debe ser una lista.' });
    return;
  }
  bloques.forEach((b, i) => {
    const donde = `bloques[${i}]`;
    if (!b || !TIPOS_BLOQUE.includes(b.tipo)) {
      errors.push({ file, mensaje: `${donde}: tipo inválido. Permitidos: ${TIPOS_BLOQUE.join(', ')}.` });
      return;
    }
    if ((b.tipo === 'parrafo' || b.tipo === 'subtitulo') && !(typeof b.texto === 'string' && b.texto.trim())) {
      errors.push({ file, mensaje: `${donde}: falta "texto".` });
    }
    if (b.tipo === 'lista' && !(Array.isArray(b.items) && b.items.length && b.items.every((x) => typeof x === 'string' && x.trim()))) {
      errors.push({ file, mensaje: `${donde}: "items" debe ser una lista de textos no vacíos.` });
    }
    if (b.tipo === 'enlace') {
      if (!(typeof b.texto === 'string' && b.texto.trim())) errors.push({ file, mensaje: `${donde}: falta "texto".` });
      if (!validarUrlBloque(b.url)) errors.push({ file, mensaje: `${donde}: "url" debe iniciar con https:// o con /.` });
    }
    if (b.tipo === 'documento' && documentosIds && !documentosIds.has(b.id)) {
      errors.push({ file, mensaje: `${donde}: el documento "${b.id}" no existe.` });
    }
  });
}

export function validateSite(site, file, errors) {
  if (!site || typeof site !== 'object') {
    errors.push({ file, mensaje: 'site.json vacío o inválido.' });
    return;
  }
  const aut = site.autorizacion;
  if (!aut || typeof aut.otorgada !== 'boolean') {
    errors.push({ file, mensaje: '"autorizacion.otorgada" debe ser true o false.' });
  } else if (aut.otorgada && !(aut.responsable && isValidIsoDate(aut.fecha))) {
    errors.push({ file, mensaje: 'Si la autorización está otorgada, registra "responsable" y "fecha" (AAAA-MM-DD).' });
  }
  const inst = site.institucion;
  if (!inst || typeof inst !== 'object') {
    errors.push({ file, mensaje: 'Falta el objeto "institucion".' });
    return;
  }
  for (const [clave, campo] of Object.entries(inst)) {
    const donde = `institucion.${clave}`;
    if (!campo || typeof campo !== 'object' || !('valor' in campo)) {
      errors.push({ file, mensaje: `${donde}: debe tener "valor", "estado" y "publicar".` });
      continue;
    }
    if (!ESTADOS_DATO.includes(campo.estado)) {
      errors.push({ file, mensaje: `${donde}: "estado" inválido. Permitidos: ${ESTADOS_DATO.join(', ')}.` });
    }
    if (typeof campo.publicar !== 'boolean') {
      errors.push({ file, mensaje: `${donde}: "publicar" debe ser true o false.` });
      continue;
    }
    if (!campo.publicar) continue;
    if (campo.valor === null || campo.valor === '' || (Array.isArray(campo.valor) && campo.valor.length === 0)) {
      errors.push({ file, mensaje: `${donde}: no se puede publicar un dato vacío.` });
    }
    const aprobado = Boolean(campo.aprobadoPor) && isValidIsoDate(campo.aprobadoEn);
    if (campo.estado === 'propuesta' && !aprobado) {
      errors.push({ file, mensaje: `${donde}: es una propuesta; para publicarla registra "aprobadoPor" y "aprobadoEn".` });
    }
    if (campo.estado === 'pendiente_validacion' && !aprobado) {
      errors.push({ file, mensaje: `${donde}: está pendiente de validación; registra "aprobadoPor" y "aprobadoEn" antes de publicar.` });
    }
    if (REQUIEREN_APROBACION_EXPRESA.includes(clave) && !aprobado) {
      errors.push({ file, mensaje: `${donde}: requiere aprobación expresa de la dirección ("aprobadoPor" y "aprobadoEn").` });
    }
  }
}

export function validatePagina(clave, data, file, errors, warnings, documentosIds) {
  if (!data || typeof data !== 'object') {
    errors.push({ file, mensaje: 'Contenido de página inválido.' });
    return;
  }
  if (!['pendiente', 'aprobado'].includes(data.estado)) {
    errors.push({ file, mensaje: '"estado" debe ser "pendiente" o "aprobado".' });
    return;
  }
  if (data.estado === 'pendiente') return;
  if (!data.aprobadoPor || !isValidIsoDate(data.aprobadoEn)) {
    errors.push({ file, mensaje: 'Una página aprobada requiere "aprobadoPor" y "aprobadoEn" (AAAA-MM-DD).' });
  }
  if (data.actualizado !== undefined && !isValidIsoDate(data.actualizado)) {
    errors.push({ file, mensaje: '"actualizado" debe tener formato AAAA-MM-DD.' });
  }
  if (data.cicloEscolar !== undefined && !isValidCiclo(data.cicloEscolar)) {
    errors.push({ file, mensaje: '"cicloEscolar" debe tener formato AAAA-AAAA consecutivo (ej. 2026-2027).' });
  }
  const tieneContenido = data.bloques || data.tramite || data.preguntas;
  if (!tieneContenido) errors.push({ file, mensaje: 'Una página aprobada necesita "bloques", "tramite" o "preguntas".' });
  if (data.bloques) {
    validateBloques(data.bloques, file, errors, documentosIds);
    scanPrivacidad(textoDeBloques(data.bloques), file, errors, warnings);
  }
  if (data.preguntas) {
    if (!Array.isArray(data.preguntas) || !data.preguntas.length) {
      errors.push({ file, mensaje: '"preguntas" debe ser una lista no vacía.' });
    } else {
      data.preguntas.forEach((p, i) => {
        if (!(typeof p?.pregunta === 'string' && p.pregunta.trim() && typeof p?.respuesta === 'string' && p.respuesta.trim())) {
          errors.push({ file, mensaje: `preguntas[${i}]: requiere "pregunta" y "respuesta".` });
        } else {
          scanPrivacidad(`${p.pregunta}\n${p.respuesta}`, file, errors, warnings);
        }
      });
    }
  }
  if (data.tramite) {
    const t = data.tramite;
    for (const k of ['dirigidoA', 'periodo', 'dondeComo', 'horarios', 'canalDudas']) {
      if (!(typeof t[k] === 'string' && t[k].trim())) errors.push({ file, mensaje: `tramite.${k}: es obligatorio.` });
    }
    for (const k of ['requisitos', 'pasos']) {
      if (!(Array.isArray(t[k]) && t[k].length && t[k].every((x) => typeof x === 'string' && x.trim()))) {
        errors.push({ file, mensaje: `tramite.${k}: debe ser una lista de textos.` });
      }
    }
    if (t.formatos !== undefined) {
      if (!Array.isArray(t.formatos) || t.formatos.some((id) => !documentosIds?.has(id))) {
        errors.push({ file, mensaje: 'tramite.formatos: cada elemento debe ser el id de un documento existente.' });
      }
    }
    if (!isValidCiclo(data.cicloEscolar)) errors.push({ file, mensaje: 'Un trámite aprobado requiere "cicloEscolar" (ej. 2026-2027).' });
    if (!isValidIsoDate(data.actualizado)) errors.push({ file, mensaje: 'Un trámite aprobado requiere "actualizado" (AAAA-MM-DD).' });
    scanPrivacidad(
      [t.dirigidoA, t.periodo, t.dondeComo, t.horarios, t.canalDudas, ...(t.requisitos ?? []), ...(t.pasos ?? [])].join('\n'),
      file, errors, warnings,
    );
  }
}

export function validateAviso(aviso, file, errors, warnings, ctx = {}) {
  const base = path.basename(file, '.json');
  if (!aviso || typeof aviso !== 'object') {
    errors.push({ file, mensaje: 'Aviso inválido.' });
    return;
  }
  for (const k of ['id', 'titulo', 'slug', 'resumen', 'categoria', 'estado', 'cicloEscolar', 'creado', 'autor']) {
    if (aviso[k] === undefined || aviso[k] === null || aviso[k] === '') errors.push({ file, mensaje: `Falta el campo "${k}".` });
  }
  if (typeof aviso.slug === 'string') {
    if (!SLUG_RE.test(aviso.slug)) errors.push({ file, mensaje: '"slug" solo admite minúsculas, números y guiones.' });
    if (aviso.slug !== base) errors.push({ file, mensaje: `El archivo debe llamarse "${aviso.slug}.json".` });
  }
  if (!(aviso.categoria in CATEGORIAS_AVISO)) {
    errors.push({ file, mensaje: `"categoria" inválida. Permitidas: ${Object.keys(CATEGORIAS_AVISO).join(', ')}.` });
  }
  if (!ESTADOS_AVISO.includes(aviso.estado)) {
    errors.push({ file, mensaje: `"estado" inválido. Permitidos: ${ESTADOS_AVISO.join(', ')}.` });
  }
  if (aviso.cicloEscolar && !isValidCiclo(aviso.cicloEscolar)) {
    errors.push({ file, mensaje: '"cicloEscolar" debe tener formato AAAA-AAAA consecutivo (ej. 2026-2027).' });
  }
  for (const k of ['creado', 'publicado', 'actualizado', 'vence']) {
    if (aviso[k] !== undefined && aviso[k] !== null && !isValidIsoDate(aviso[k])) {
      errors.push({ file, mensaje: `"${k}" debe tener formato AAAA-MM-DD válido.` });
    }
  }
  if (aviso.prioridad !== undefined && !['normal', 'alta'].includes(aviso.prioridad)) {
    errors.push({ file, mensaje: '"prioridad" debe ser "normal" o "alta".' });
  }
  if (aviso.estado === 'publicado' || aviso.estado === 'archivado') {
    if (!aviso.aprobador) errors.push({ file, mensaje: 'Un aviso publicado o archivado requiere "aprobador".' });
    if (!isValidIsoDate(aviso.publicado)) errors.push({ file, mensaje: 'Un aviso publicado o archivado requiere "publicado" (AAAA-MM-DD).' });
  }
  if (aviso.estado === 'aprobado' && !aviso.aprobador) {
    errors.push({ file, mensaje: 'Un aviso aprobado requiere "aprobador".' });
  }
  if (aviso.aprobador && aviso.autor && String(aviso.aprobador).trim().toLowerCase() === String(aviso.autor).trim().toLowerCase()) {
    errors.push({ file, mensaje: 'El aprobador debe ser una persona distinta del autor.' });
  }
  if (isValidIsoDate(aviso.vence) && isValidIsoDate(aviso.publicado) && aviso.vence < aviso.publicado) {
    errors.push({ file, mensaje: '"vence" no puede ser anterior a "publicado".' });
  }
  if (isValidIsoDate(aviso.actualizado) && isValidIsoDate(aviso.creado) && aviso.actualizado < aviso.creado) {
    errors.push({ file, mensaje: '"actualizado" no puede ser anterior a "creado".' });
  }
  if (typeof aviso.resumen === 'string' && aviso.resumen.length > 300) {
    errors.push({ file, mensaje: '"resumen" no debe exceder 300 caracteres.' });
  }
  if (aviso.imagenes !== undefined) {
    errors.push({ file, mensaje: 'Los avisos no admiten imágenes en esta versión. Publica sin fotografías.' });
  }
  if (aviso.autorizacionImagenes !== undefined && aviso.autorizacionImagenes !== null && typeof aviso.autorizacionImagenes !== 'boolean') {
    errors.push({ file, mensaje: '"autorizacionImagenes" debe ser true, false o null.' });
  }
  if (!Array.isArray(aviso.cuerpo) || !aviso.cuerpo.length) {
    errors.push({ file, mensaje: '"cuerpo" debe ser una lista de bloques no vacía.' });
  } else {
    validateBloques(aviso.cuerpo, file, errors, ctx.documentosIds);
  }
  if (aviso.fechasClave !== undefined) {
    if (!Array.isArray(aviso.fechasClave)) {
      errors.push({ file, mensaje: '"fechasClave" debe ser una lista.' });
    } else {
      aviso.fechasClave.forEach((f, i) => {
        if (!isValidIsoDate(f?.fecha) || !(typeof f?.descripcion === 'string' && f.descripcion.trim())) {
          errors.push({ file, mensaje: `fechasClave[${i}]: requiere "fecha" (AAAA-MM-DD) y "descripcion".` });
        }
      });
    }
  }
  if (aviso.archivos !== undefined) {
    if (!Array.isArray(aviso.archivos) || aviso.archivos.some((id) => !ctx.documentosIds?.has(id))) {
      errors.push({ file, mensaje: '"archivos" debe listar ids de documentos existentes.' });
    }
  }
  const textoAviso = `${aviso.titulo}\n${aviso.resumen}\n${textoDeBloques(aviso.cuerpo)}`;
  if (aviso.estado !== 'borrador' && textoAviso.includes('[REDACTAR]')) {
    errors.push({ file, mensaje: 'Quedan marcadores [REDACTAR] sin completar. Termina el texto antes de enviarlo a revisión.' });
  }
  scanPrivacidad(textoAviso, file, errors, warnings);
}

export function validateDocumento(doc, file, errors, warnings, ctx = {}) {
  const base = path.basename(file, '.json');
  if (!doc || typeof doc !== 'object') {
    errors.push({ file, mensaje: 'Documento inválido.' });
    return;
  }
  for (const k of ['id', 'nombre', 'descripcion', 'archivo', 'categoria', 'estado', 'cicloEscolar']) {
    if (!doc[k]) errors.push({ file, mensaje: `Falta el campo "${k}".` });
  }
  if (doc.id && doc.id !== base) errors.push({ file, mensaje: `El archivo debe llamarse "${doc.id}.json".` });
  if (doc.id && !SLUG_RE.test(doc.id)) errors.push({ file, mensaje: '"id" solo admite minúsculas, números y guiones.' });
  if (doc.categoria && !(doc.categoria in CATEGORIAS_DOCUMENTO)) {
    errors.push({ file, mensaje: `"categoria" inválida. Permitidas: ${Object.keys(CATEGORIAS_DOCUMENTO).join(', ')}.` });
  }
  if (doc.estado && !['en_revision', 'aprobado', 'publicado', 'archivado'].includes(doc.estado)) {
    errors.push({ file, mensaje: '"estado" inválido. Permitidos: en_revision, aprobado, publicado, archivado.' });
  }
  if (doc.cicloEscolar && !isValidCiclo(doc.cicloEscolar)) {
    errors.push({ file, mensaje: '"cicloEscolar" debe tener formato AAAA-AAAA consecutivo.' });
  }
  if (doc.publicado !== undefined && !isValidIsoDate(doc.publicado)) {
    errors.push({ file, mensaje: '"publicado" debe tener formato AAAA-MM-DD.' });
  }
  if (doc.estado === 'publicado' || doc.estado === 'archivado') {
    if (!doc.aprobador) errors.push({ file, mensaje: 'Un documento publicado requiere "aprobador".' });
    if (!isValidIsoDate(doc.publicado)) errors.push({ file, mensaje: 'Un documento publicado requiere "publicado".' });
    if (doc.contieneDatosPersonales === true) {
      errors.push({ file, mensaje: 'Un documento con datos personales no puede publicarse.' });
    } else if (doc.contieneDatosPersonales !== false) {
      errors.push({ file, mensaje: 'Confirma con "contieneDatosPersonales": false que el archivo no incluye datos personales de menores.' });
    }
  }
  if (typeof doc.archivo === 'string') {
    if (!/^archivos\/[A-Za-z0-9._-]+$/.test(doc.archivo)) {
      errors.push({ file, mensaje: '"archivo" debe tener la forma archivos/nombre.ext (sin subcarpetas).' });
    } else {
      const ext = path.extname(doc.archivo).slice(1).toLowerCase();
      if (!(ext in FORMATOS_DOCUMENTO)) {
        errors.push({ file, mensaje: `Extensión no permitida (.${ext}). Permitidas: ${Object.keys(FORMATOS_DOCUMENTO).join(', ')}.` });
      }
      const abs = path.join(ctx.contentDir ?? '', doc.archivo);
      if (ctx.contentDir && !fs.existsSync(abs)) {
        errors.push({ file, mensaje: `No existe el archivo ${doc.archivo} en content/.` });
      }
    }
  }
  if (!doc.textoAccesible && (doc.estado === 'publicado' || doc.estado === 'archivado')) {
    warnings.push({ file, mensaje: 'Añade "textoAccesible" con un resumen en texto del documento (los avisos importantes no deben depender solo de un PDF).' });
  }
}

export function loadContent(config) {
  const errors = [];
  const warnings = [];
  const dir = config.contentDir;

  const siteFile = path.join(dir, 'site.json');
  const site = fs.existsSync(siteFile) ? readJson(siteFile, errors) : null;
  if (!site) errors.push({ file: siteFile, mensaje: 'No se encontró content/site.json.' });
  else validateSite(site, siteFile, errors);

  // Documentos
  const documentos = [];
  for (const file of listJson(path.join(dir, 'documentos'))) {
    const d = readJson(file, errors);
    if (d) documentos.push({ ...d, _file: file });
  }
  const documentosIds = new Set(documentos.map((d) => d.id));
  const vistosDoc = new Set();
  for (const d of documentos) {
    if (vistosDoc.has(d.id)) errors.push({ file: d._file, mensaje: `Id de documento duplicado: ${d.id}.` });
    vistosDoc.add(d.id);
    validateDocumento(d, d._file, errors, warnings, { contentDir: dir });
    if (d.archivo && /^archivos\/[A-Za-z0-9._-]+$/.test(d.archivo)) {
      const abs = path.join(dir, d.archivo);
      if (fs.existsSync(abs)) d.tamanoBytes = fs.statSync(abs).size;
      d.formato = path.extname(d.archivo).slice(1).toLowerCase();
    }
  }

  // Avisos
  const avisos = [];
  for (const file of listJson(path.join(dir, 'avisos'))) {
    const a = readJson(file, errors);
    if (a) avisos.push({ ...a, _file: file });
  }
  const slugs = new Set();
  const ids = new Set();
  for (const a of avisos) {
    if (slugs.has(a.slug)) errors.push({ file: a._file, mensaje: `Slug duplicado: ${a.slug}.` });
    if (ids.has(a.id)) errors.push({ file: a._file, mensaje: `Id duplicado: ${a.id}.` });
    slugs.add(a.slug);
    ids.add(a.id);
    validateAviso(a, a._file, errors, warnings, { documentosIds });
  }

  // Páginas
  const paginas = {};
  for (const file of listJson(path.join(dir, 'paginas'))) {
    const clave = path.basename(file, '.json');
    const data = readJson(file, errors);
    if (!data) continue;
    validatePagina(clave, data, file, errors, warnings, documentosIds);
    paginas[clave] = data;
  }

  return { site, avisos, documentos, paginas, errors, warnings };
}

// Clasificación pública de un aviso a una fecha dada.
export function vigenciaAviso(aviso, today) {
  if (aviso.estado === 'archivado') return 'archivado';
  if (aviso.estado !== 'publicado') return 'no_publicado';
  if (isValidIsoDate(aviso.publicado) && aviso.publicado > today) return 'programado';
  if (isValidIsoDate(aviso.vence) && aviso.vence < today) return 'vencido';
  return 'vigente';
}

export function avisosPublicos(avisos, today) {
  return avisos
    .map((a) => ({ ...a, vigencia: vigenciaAviso(a, today) }))
    .filter((a) => ['vigente', 'vencido', 'archivado'].includes(a.vigencia))
    .sort((x, y) => String(y.publicado).localeCompare(String(x.publicado)) || x.slug.localeCompare(y.slug));
}

export function documentosPublicos(documentos) {
  return documentos
    .filter((d) => d.estado === 'publicado' || d.estado === 'archivado')
    .sort((a, b) => String(b.publicado).localeCompare(String(a.publicado)) || a.id.localeCompare(b.id));
}

// Devuelve el valor de un dato institucional solo si está autorizado para publicarse.
export function dato(site, clave) {
  const campo = site?.institucion?.[clave];
  if (!campo || campo.publicar !== true) return null;
  return campo.valor ?? null;
}
