#!/usr/bin/env node
// Lint sin dependencias: sintaxis de todos los módulos y patrones inseguros en el JS del navegador.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from '../src/lib/config.mjs';

function archivosJs(dir) {
  const out = [];
  for (const n of fs.readdirSync(dir)) {
    const abs = path.join(dir, n);
    if (n === 'node_modules' || n === 'dist') continue;
    if (fs.statSync(abs).isDirectory()) out.push(...archivosJs(abs));
    else if (/\.(mjs|js)$/.test(n)) out.push(abs);
  }
  return out;
}

let problemas = 0;
const archivos = ['src', 'scripts', 'tests', 'assets'].flatMap((d) => (fs.existsSync(path.join(ROOT, d)) ? archivosJs(path.join(ROOT, d)) : []));

for (const f of archivos) {
  const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
  if (r.status !== 0) {
    problemas += 1;
    console.error(`SINTAXIS ${path.relative(ROOT, f)}\n${r.stderr}`);
  }
}

const prohibidos = [
  [/\beval\s*\(/, 'eval()'],
  [/\.innerHTML\s*=/, 'innerHTML'],
  [/document\.write\s*\(/, 'document.write'],
  [/new Function\s*\(/, 'new Function'],
];
const js = path.join(ROOT, 'assets', 'site.js');
const textoJs = fs.readFileSync(js, 'utf8');
for (const [re, nombre] of prohibidos) {
  if (re.test(textoJs)) {
    problemas += 1;
    console.error(`INSEGURO assets/site.js usa ${nombre}`);
  }
}

// Las plantillas deben escapar: raw() solo con literales o con funciones propias.
const fuentes = ['pages.mjs', 'components.mjs', 'layout.mjs'].map((n) => path.join(ROOT, 'src', 'lib', n));
for (const f of fuentes) {
  const lineas = fs.readFileSync(f, 'utf8').split('\n');
  lineas.forEach((l, i) => {
    for (const m of l.matchAll(/raw\(([^)]*)\)/g)) {
      const arg = m[1].trim();
      // Se admiten literales sin interpolación y constantes del módulo cuyo nombre termina en _SEGURO.
      if (!/^['"`][^$]*['"`]$/.test(arg) && !/^[A-Z_]+_SEGURO$/.test(arg)) {
        problemas += 1;
        console.error(`RAW ${path.relative(ROOT, f)}:${i + 1} raw() con argumento no literal: ${arg}`);
      }
    }
  });
}

if (problemas) {
  console.error(`Lint fallido: ${problemas} problema(s).`);
  process.exit(1);
}
console.log(`Lint correcto (${archivos.length} archivos revisados).`);
