#!/usr/bin/env node
import { loadConfig } from '../src/lib/config.mjs';
import { build } from '../src/lib/build.mjs';

try {
  const config = loadConfig();
  const { paginas, warnings, today } = build(config);
  for (const w of warnings) console.warn(`AVISO  ${w.file}: ${w.mensaje}`);
  console.log(`Sitio compilado en ${config.outDir}`);
  console.log(`Modo: ${config.mode} · Páginas: ${paginas.length} · Fecha de compilación: ${today}`);
} catch (error) {
  console.error(`ERROR: ${error.message}`);
  for (const d of error.detalles ?? []) console.error(` - ${d.file}: ${d.mensaje}`);
  process.exit(1);
}
