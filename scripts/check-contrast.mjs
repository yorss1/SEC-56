#!/usr/bin/env node
// Calcula la relación de contraste de las combinaciones de color usadas en assets/site.css.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../src/lib/config.mjs';

const css = fs.readFileSync(path.join(ROOT, 'assets', 'site.css'), 'utf8');
const vars = {};
for (const m of css.matchAll(/--c-([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)) vars[m[1]] = m[2];

function luminancia(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contraste(a, b) {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const v = (n) => {
  if (!vars[n]) throw new Error(`Falta la variable --c-${n} en site.css`);
  return vars[n];
};

// [descripción, texto, fondo, mínimo]. Texto normal: 4.5. Componentes de interfaz y foco: 3.
const pares = [
  ['Texto principal sobre fondo de página', v('ink'), v('bg-alt'), 4.5],
  ['Texto principal sobre superficie blanca', v('ink'), v('bg'), 4.5],
  ['Texto secundario sobre fondo de página', v('muted'), v('bg-alt'), 4.5],
  ['Texto secundario sobre superficie blanca', v('muted'), v('bg'), 4.5],
  ['Títulos y enlaces (primario) sobre fondo de página', v('primary'), v('bg-alt'), 4.5],
  ['Títulos y enlaces (primario) sobre superficie blanca', v('primary'), v('bg'), 4.5],
  ['Primario sobre tinte primario', v('primary'), v('primary-tint'), 4.5],
  ['Texto principal sobre tinte de acento (aviso urgente)', v('ink'), v('accent-tint'), 4.5],
  ['Enlaces primarios sobre tinte de acento', v('primary'), v('accent-tint'), 4.5],
  ['Blanco sobre primario (barra, pie, botones)', '#FFFFFF', v('primary'), 4.5],
  ['Blanco sobre primario hover', '#FFFFFF', v('primary-dark'), 4.5],
  ['Blanco sobre acento (CTA, etiqueta prioritaria, menú activo)', '#FFFFFF', v('accent'), 4.5],
  ['Blanco sobre acento hover', '#FFFFFF', v('accent-dark'), 4.5],
  ['Acento sobre superficie blanca (texto o icono)', v('accent'), v('bg'), 4.5],
  ['Acento sobre fondo de página', v('accent'), v('bg-alt'), 4.5],
  ['Borde de acento de aviso urgente sobre tinte (componente)', v('accent'), v('accent-tint'), 3],
  ['Aviso de demostración', v('warn-ink'), v('warn-bg'), 4.5],
  ['Indicador de foco sobre fondo de página', v('focus'), v('bg-alt'), 3],
  ['Indicador de foco sobre superficie blanca', v('focus'), v('bg'), 3],
  ['Indicador de foco sobre tinte de acento', v('focus'), v('accent-tint'), 3],
  ['Foco blanco sobre barra primaria', '#FFFFFF', v('primary'), 3],
  ['Foco blanco sobre menú activo (acento)', '#FFFFFF', v('accent'), 3],
  ['Etiqueta de categoría', v('primary'), v('primary-tint'), 4.5],
  ['Etiqueta vencido/archivado', '#37424b', '#eceff1', 4.5],
  ['Borde de campos de formulario sobre blanco', '#7d8d99', v('bg'), 3],
];

let fallos = 0;
for (const [nombre, fg, bg, minimo] of pares) {
  const r = contraste(fg, bg);
  const ok = r >= minimo;
  if (!ok) fallos += 1;
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${r.toFixed(2).padStart(5)}:1 (mín. ${minimo})  ${nombre}`);
}
if (fallos) {
  console.error(`${fallos} combinación(es) no cumplen el contraste mínimo.`);
  process.exit(1);
}
console.log('Todas las combinaciones cumplen el contraste mínimo.');
