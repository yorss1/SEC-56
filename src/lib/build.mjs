// Compilación del sitio estático a dist/.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT } from './config.mjs';
import { loadContent, todayMexico, documentosPublicos } from './content.mjs';
import { construirPaginas } from './pages.mjs';

function hashArchivo(file) {
  return crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, 8);
}

export function reglasProduccion(config, site) {
  const problemas = [];
  if (config.isDemo) return problemas;
  if (!site?.autorizacion?.otorgada) {
    problemas.push('SITE_MODE=produccion requiere autorización expresa de la dirección en content/site.json (autorizacion.otorgada: true, con responsable y fecha).');
  }
  if (!config.siteUrl) {
    problemas.push('SITE_MODE=produccion requiere SITE_URL con el dominio confirmado por la escuela (https://...).');
  }
  return problemas;
}

export function generarHeaders(config) {
  const formOrigin = config.contactEndpoint ? ` ${new URL(config.contactEndpoint).origin}` : '';
  const csp = [
    "default-src 'self'",
    "img-src 'self' data:",
    "style-src 'self'",
    "script-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    `form-action 'self'${formOrigin}`,
    "frame-ancestors 'none'",
  ].join('; ');
  const comunes = [
    `Content-Security-Policy: ${csp}`,
    'X-Content-Type-Options: nosniff',
    'X-Frame-Options: DENY',
    'Referrer-Policy: strict-origin-when-cross-origin',
    'Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy: same-origin',
  ];
  if (!config.isDemo) comunes.push('Strict-Transport-Security: max-age=31536000; includeSubDomains');
  if (config.isDemo) comunes.push('X-Robots-Tag: noindex, nofollow');
  const bloque = (ruta, lineas) => `${ruta}\n${lineas.map((l) => `  ${l}`).join('\n')}\n`;
  return [
    bloque('/*', comunes),
    bloque('/assets/*', ['Cache-Control: public, max-age=31536000, immutable']),
    bloque('/archivos/*', ['Cache-Control: public, max-age=3600']),
  ].join('\n');
}

export function generarRobots(config) {
  if (config.isDemo) return 'User-agent: *\nDisallow: /\n';
  return `User-agent: *\nAllow: /\n\nSitemap: ${config.siteUrl}${config.base}sitemap.xml\n`;
}

export function generarSitemap(config, paginas, today) {
  const urls = paginas
    .filter((p) => !p.noindex && p.archivo !== '404.html')
    .map((p) => {
      const loc = `${config.siteUrl}${config.base}${p.ruta}`;
      return `  <url><loc>${loc}</loc><lastmod>${today}</lastmod></url>`;
    });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

export function build(config) {
  const content = loadContent(config);
  if (content.errors.length) {
    const error = new Error('El contenido tiene errores y no se puede compilar.');
    error.detalles = content.errors;
    throw error;
  }
  const problemas = reglasProduccion(config, content.site);
  if (problemas.length) {
    const error = new Error('No se cumplen las condiciones para compilar en modo producción.');
    error.detalles = problemas.map((mensaje) => ({ file: 'configuración', mensaje }));
    throw error;
  }

  const today = todayMexico(config.buildDate);
  const assetsDir = path.join(ROOT, 'assets');
  const hashes = new Map();
  const asset = (nombre) => {
    const abs = path.join(ROOT, nombre);
    if (!hashes.has(nombre)) hashes.set(nombre, hashArchivo(abs));
    return `${config.base}${nombre}?v=${hashes.get(nombre)}`;
  };
  const url = (ruta) => `${config.base}${ruta}`;
  const ctx = { config, site: content.site, content, today, url, asset };

  const paginas = construirPaginas(ctx);

  fs.rmSync(config.outDir, { recursive: true, force: true });
  fs.mkdirSync(config.outDir, { recursive: true });
  fs.cpSync(assetsDir, path.join(config.outDir, 'assets'), { recursive: true });

  // Solo se copian los archivos de documentos publicados o archivados.
  for (const d of documentosPublicos(content.documentos)) {
    const destino = path.join(config.outDir, d.archivo);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.copyFileSync(path.join(config.contentDir, d.archivo), destino);
  }

  for (const p of paginas) {
    const destino = path.join(config.outDir, p.archivo);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, p.html);
  }

  fs.writeFileSync(path.join(config.outDir, 'robots.txt'), generarRobots(config));
  fs.writeFileSync(path.join(config.outDir, '_headers'), generarHeaders(config));
  if (!config.isDemo && config.siteUrl) {
    fs.writeFileSync(path.join(config.outDir, 'sitemap.xml'), generarSitemap(config, paginas, today));
  }

  return { paginas, warnings: content.warnings, today };
}
