#!/usr/bin/env node
// Verifica dist/ (compílalo antes con npm run build).
import fs from 'node:fs';
import { loadConfig } from '../src/lib/config.mjs';
import { loadContent } from '../src/lib/content.mjs';
import { verificarDist } from '../src/lib/verify.mjs';

try {
  const config = loadConfig();
  if (!fs.existsSync(config.outDir)) throw new Error(`No existe ${config.outDir}. Ejecuta antes: npm run build`);
  const content = loadContent(config);
  const { problemas, totalPaginas, totalArchivos } = verificarDist(config.outDir, {
    site: content.site, documentos: content.documentos, config,
  });
  console.log(`Verificadas ${totalPaginas} páginas HTML (${totalArchivos} archivos en total).`);
  if (problemas.length) {
    for (const p of problemas) console.error(` - ${p.archivo}: ${p.mensaje}`);
    console.error(`Verificación fallida: ${problemas.length} problema(s).`);
    process.exit(1);
  }
  console.log('Verificación de la salida correcta.');
} catch (error) {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
}
