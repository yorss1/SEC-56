// Comprobaciones estáticas sobre la salida compilada (dist/).
import fs from 'node:fs';
import path from 'node:path';
import { documentosPublicos } from './content.mjs';

function listar(dir, base = dir) {
  const out = [];
  for (const nombre of fs.readdirSync(dir)) {
    const abs = path.join(dir, nombre);
    if (fs.statSync(abs).isDirectory()) out.push(...listar(abs, base));
    else out.push(path.relative(base, abs));
  }
  return out;
}

function atributos(htmlTexto, nombre) {
  const re = new RegExp(`\\s${nombre}="([^"]*)"`, 'g');
  const valores = [];
  let m;
  while ((m = re.exec(htmlTexto))) valores.push(m[1]);
  return valores;
}

function resolverInterno(distDir, base, valor) {
  const limpio = valor.split('#')[0].split('?')[0];
  if (!limpio.startsWith(base)) return null;
  const rel = decodeURIComponent(limpio.slice(base.length));
  const candidato = rel === '' || rel.endsWith('/') ? `${rel}index.html` : rel;
  return path.join(distDir, candidato);
}

// Valores de datos institucionales que NO están autorizados para publicarse.
export function valoresNoPublicables(site) {
  const valores = new Set();
  for (const campo of Object.values(site?.institucion ?? {})) {
    if (campo.publicar === true) continue;
    const candidatos = [campo.valor, ...(campo.candidatos ?? [])];
    for (const v of candidatos) {
      if (typeof v === 'string' && v.trim().length >= 4) valores.add(v.trim());
    }
  }
  return [...valores];
}

const PROHIBIDOS_FIJOS = [
  'tecnica56.com.mx',
  'miescuela.app',
  'Osuna Villa',
  'Tamaulipas',
  'tec56poligono',
  'escuelasmex',
  'estec56@yahoo',
];

export function verificarDist(distDir, { site, documentos = [], config }) {
  const problemas = [];
  const agregar = (archivo, mensaje) => problemas.push({ archivo, mensaje });
  const archivos = listar(distDir);
  const paginas = archivos.filter((f) => f.endsWith('.html'));
  const titulos = new Map();
  const noPublicables = valoresNoPublicables(site);

  for (const rel of paginas) {
    const texto = fs.readFileSync(path.join(distDir, rel), 'utf8');

    if (!/<html lang="es-MX">/.test(texto)) agregar(rel, 'Falta lang="es-MX".');
    const titulo = /<title>([^<]+)<\/title>/.exec(texto)?.[1];
    if (!titulo) agregar(rel, 'Falta <title>.');
    else {
      if (titulos.has(titulo)) agregar(rel, `Título duplicado con ${titulos.get(titulo)}: "${titulo}".`);
      titulos.set(titulo, rel);
    }
    if (!/<meta name="description" content="[^"]+">/.test(texto)) agregar(rel, 'Falta meta description.');
    const h1 = (texto.match(/<h1[\s>]/g) || []).length;
    if (h1 !== 1) agregar(rel, `Debe haber exactamente un <h1> (hay ${h1}).`);
    if (!/<main id="contenido"/.test(texto)) agregar(rel, 'Falta <main id="contenido">.');
    if (!/class="skip-link" href="#contenido"/.test(texto)) agregar(rel, 'Falta el enlace para saltar al contenido.');

    // CSP estricta: sin estilos ni scripts en línea.
    if (/\sstyle="/.test(texto)) agregar(rel, 'Hay atributos style en línea (incompatibles con la CSP).');
    if (/<style[\s>]/.test(texto)) agregar(rel, 'Hay un bloque <style> en línea.');
    for (const m of texto.matchAll(/<script\b([^>]*)>/g)) {
      if (!/\ssrc="/.test(m[1])) agregar(rel, 'Hay un <script> en línea.');
    }
    if (/\son[a-z]+="/i.test(texto)) agregar(rel, 'Hay manejadores de eventos en línea (onclick, etc.).');
    if (/javascript:/i.test(texto)) agregar(rel, 'Hay enlaces javascript:.');

    // Sin recursos de terceros.
    for (const m of texto.matchAll(/<(script|img|iframe|link|source|video|audio)\b[^>]*\s(?:src|href)="(https?:)?\/\/[^"]*"[^>]*>/g)) {
      // canonical y alternate son metadatos, no recursos que se descarguen.
      if (m[1] === 'link' && /\srel="(canonical|alternate|next|prev)"/.test(m[0])) continue;
      agregar(rel, `Recurso externo cargado desde <${m[1]}>.`);
    }
    if (/<iframe\b/.test(texto)) agregar(rel, 'Hay un <iframe>.');

    // Imágenes con alt.
    for (const m of texto.matchAll(/<img\b[^>]*>/g)) {
      if (!/\salt="/.test(m[0])) agregar(rel, 'Imagen sin atributo alt.');
    }

    // ids duplicados.
    const ids = atributos(texto, 'id');
    const vistos = new Set();
    for (const id of ids) {
      if (vistos.has(id)) agregar(rel, `id duplicado: "${id}".`);
      vistos.add(id);
    }

    // Anclas internas de la propia página y aria-controls.
    for (const h of atributos(texto, 'href')) {
      if (h.startsWith('#') && h.length > 1 && !vistos.has(h.slice(1)) && !h.startsWith('#i-')) {
        agregar(rel, `Ancla sin destino: ${h}.`);
      }
    }
    for (const id of atributos(texto, 'aria-controls')) {
      if (!vistos.has(id)) agregar(rel, `aria-controls apunta a un id inexistente: ${id}.`);
    }

    // Enlaces internos que resuelven a un archivo existente.
    for (const attr of ['href', 'src']) {
      for (const valor of atributos(texto, attr)) {
        if (/^(https?:|mailto:|tel:|#|data:)/i.test(valor)) continue;
        const destino = resolverInterno(distDir, config.base, valor);
        if (!destino) agregar(rel, `Enlace no resoluble (fuera de la ruta base): ${valor}`);
        else if (!fs.existsSync(destino)) agregar(rel, `Enlace roto: ${valor}`);
      }
    }

    // Saltos de nivel de encabezado.
    let previo = 0;
    for (const m of texto.matchAll(/<h([1-6])[\s>]/g)) {
      const nivel = Number(m[1]);
      if (previo && nivel > previo + 1) agregar(rel, `Salto de encabezado de h${previo} a h${nivel}.`);
      previo = nivel;
    }

    // Modo demostración: noindex y banner.
    if (config.isDemo) {
      if (!/<meta name="robots" content="noindex, nofollow">/.test(texto)) agregar(rel, 'Modo demostración sin noindex.');
      if (!/class="demo-banner"/.test(texto)) agregar(rel, 'Modo demostración sin banner visible.');
    }

    // Datos no autorizados y fuentes homónimas o de terceros.
    for (const v of noPublicables) {
      if (texto.includes(v)) agregar(rel, `Aparece un dato no autorizado para publicarse: "${v}".`);
    }
    for (const v of PROHIBIDOS_FIJOS) {
      if (texto.includes(v)) agregar(rel, `Aparece una referencia prohibida: "${v}".`);
    }
    // Estadísticas históricas del dossier presentadas como actuales.
    if (/\b683\b/.test(texto) || /\b261\b.*\b218\b.*\b204\b/s.test(texto)) {
      agregar(rel, 'Aparecen cifras históricas de matrícula del dossier.');
    }
  }

  // Formularios: solo el de búsqueda de avisos, salvo endpoint configurado.
  for (const rel of paginas) {
    const texto = fs.readFileSync(path.join(distDir, rel), 'utf8');
    const forms = [...texto.matchAll(/<form\b[^>]*>/g)].map((m) => m[0]);
    for (const f of forms) {
      const esFiltro = /data-filtros/.test(f);
      const esContacto = /class="contact-form"/.test(f);
      if (esContacto && !config.contactEndpoint) agregar(rel, 'Formulario de contacto presente sin CONTACT_FORM_ENDPOINT configurado.');
      if (!esFiltro && !esContacto) agregar(rel, 'Formulario no reconocido.');
    }
  }

  // Solo se publican archivos de documentos aprobados.
  const permitidos = new Set(documentosPublicos(documentos).map((d) => d.archivo));
  for (const f of archivos.filter((x) => x.startsWith('archivos/'))) {
    if (!permitidos.has(f.split(path.sep).join('/'))) agregar(f, 'Archivo de documento no publicado dentro de dist.');
  }

  // Archivos esperados.
  for (const f of ['404.html', 'robots.txt', '_headers', 'index.html', 'assets/site.css', 'assets/site.js']) {
    if (!archivos.includes(f)) agregar(f, 'Archivo esperado ausente.');
  }
  if (config.isDemo) {
    const robots = fs.readFileSync(path.join(distDir, 'robots.txt'), 'utf8');
    if (!/Disallow: \/\s*$/m.test(robots)) agregar('robots.txt', 'En modo demostración debe bloquear a los buscadores.');
    if (archivos.includes('sitemap.xml')) agregar('sitemap.xml', 'No debe generarse sitemap en modo demostración.');
  }

  return { problemas, totalPaginas: paginas.length, totalArchivos: archivos.length };
}
