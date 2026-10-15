import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT, loadConfig } from '../src/lib/config.mjs';

export function avisoBase(extra = {}) {
  return {
    id: 'aviso-2026-001',
    titulo: 'Aviso de prueba',
    slug: 'aviso-de-prueba',
    resumen: 'Resumen de prueba.',
    categoria: 'comunicado-oficial',
    estado: 'publicado',
    cicloEscolar: '2026-2027',
    creado: '2026-10-01',
    publicado: '2026-10-05',
    autor: 'Autora Uno',
    aprobador: 'Aprobador Dos',
    prioridad: 'normal',
    cuerpo: [{ tipo: 'parrafo', texto: 'Texto de prueba.' }],
    ...extra,
  };
}

// Crea una carpeta de contenido temporal copiando site.json real y plantillas vacías.
export function contenidoTemporal({ avisos = [], documentos = [], paginas = {}, archivos = {}, site } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tec56-'));
  const content = path.join(dir, 'content');
  for (const sub of ['avisos', 'documentos', 'paginas', 'archivos']) fs.mkdirSync(path.join(content, sub), { recursive: true });
  const siteBase = site ?? JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'site.json'), 'utf8'));
  fs.writeFileSync(path.join(content, 'site.json'), JSON.stringify(siteBase, null, 2));
  for (const a of avisos) fs.writeFileSync(path.join(content, 'avisos', `${a.slug}.json`), JSON.stringify(a, null, 2));
  for (const d of documentos) fs.writeFileSync(path.join(content, 'documentos', `${d.id}.json`), JSON.stringify(d, null, 2));
  for (const [clave, p] of Object.entries(paginas)) fs.writeFileSync(path.join(content, 'paginas', `${clave}.json`), JSON.stringify(p, null, 2));
  for (const [nombre, contenido] of Object.entries(archivos)) fs.writeFileSync(path.join(content, 'archivos', nombre), contenido);
  return { dir, content, out: path.join(dir, 'out') };
}

export function configTemporal(tmp, env = {}) {
  return loadConfig({
    CONTENT_DIR: tmp.content,
    OUT_DIR: tmp.out,
    BUILD_DATE: '2026-10-14',
    ...env,
  });
}

export function leer(tmp, ...partes) {
  return fs.readFileSync(path.join(tmp.out, ...partes), 'utf8');
}

export function existe(tmp, ...partes) {
  return fs.existsSync(path.join(tmp.out, ...partes));
}

export function limpiar(tmp) {
  fs.rmSync(tmp.dir, { recursive: true, force: true });
}
