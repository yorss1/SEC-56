#!/usr/bin/env node
// Valida content/ sin compilar. Sale con código 1 si hay errores.
import path from 'node:path';
import { loadConfig, ROOT } from '../src/lib/config.mjs';
import { loadContent } from '../src/lib/content.mjs';

try {
  const config = loadConfig();
  const { errors, warnings, avisos, documentos, paginas } = loadContent(config);
  const rel = (f) => path.relative(ROOT, f);
  for (const w of warnings) console.warn(`AVISO  ${rel(w.file)}: ${w.mensaje}`);
  for (const e of errors) console.error(`ERROR  ${rel(e.file)}: ${e.mensaje}`);
  console.log(`Contenido: ${avisos.length} avisos, ${documentos.length} documentos, ${Object.keys(paginas).length} páginas con contenido.`);
  if (errors.length) {
    console.error(`Validación fallida: ${errors.length} error(es).`);
    process.exit(1);
  }
  console.log('Validación de contenido correcta.');
} catch (error) {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
}
