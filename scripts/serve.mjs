#!/usr/bin/env node
// Servidor local de vista previa de dist/. Compila primero si hace falta.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { loadConfig } from '../src/lib/config.mjs';
import { build } from '../src/lib/build.mjs';

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
  '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
};

const config = loadConfig();
try {
  build(config);
} catch (e) {
  console.error(`ERROR: ${e.message}`);
  for (const d of e.detalles ?? []) console.error(` - ${d.file}: ${d.mensaje}`);
  process.exit(1);
}

const puerto = Number(process.env.PORT || 4173);
const raiz = config.outDir;

// Aplica el bloque "/*" de _headers para reproducir la CSP y demás cabeceras del hosting.
function cabecerasGlobales() {
  const texto = fs.readFileSync(path.join(raiz, '_headers'), 'utf8');
  const bloque = texto.split(/\n\n/).find((b) => b.startsWith('/*')) ?? '';
  const cabeceras = {};
  for (const linea of bloque.split('\n').slice(1)) {
    const i = linea.indexOf(':');
    if (i > 0) cabeceras[linea.slice(0, i).trim()] = linea.slice(i + 1).trim();
  }
  return cabeceras;
}
const globales = cabecerasGlobales();

const servidor = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let ruta;
  try {
    ruta = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400).end('Solicitud inválida');
    return;
  }
  if (!ruta.startsWith(config.base)) ruta = `/${ruta.replace(/^\/+/, '')}`;
  else ruta = `/${ruta.slice(config.base.length)}`;
  let archivo = path.join(raiz, ruta);
  if (!archivo.startsWith(raiz)) {
    res.writeHead(403).end('Prohibido');
    return;
  }
  if (fs.existsSync(archivo) && fs.statSync(archivo).isDirectory()) archivo = path.join(archivo, 'index.html');
  if (!fs.existsSync(archivo)) {
    res.writeHead(404, { ...globales, 'Content-Type': TIPOS['.html'] });
    res.end(fs.readFileSync(path.join(raiz, '404.html')));
    return;
  }
  res.writeHead(200, {
    ...globales,
    'Content-Type': TIPOS[path.extname(archivo)] || 'application/octet-stream',
  });
  fs.createReadStream(archivo).pipe(res);
});

servidor.listen(puerto, '127.0.0.1', () => {
  console.log(`Vista previa en http://127.0.0.1:${puerto}${config.base} (modo ${config.mode})`);
});
