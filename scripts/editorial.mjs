#!/usr/bin/env node
// Uso: npm run editorial -- <comando> [argumentos]
import fs from 'node:fs';
import path from 'node:path';
import { loadConfig } from '../src/lib/config.mjs';
import { todayMexico, CATEGORIAS_AVISO } from '../src/lib/content.mjs';
import {
  TRANSICIONES, nuevoAviso, transicionar, validarAvisoEditorial, registrarBitacora,
} from '../src/lib/editorial.mjs';

const AYUDA = `Flujo editorial de avisos

  npm run editorial -- nuevo --titulo "..." --categoria <cat> --ciclo 2026-2027 --autor "Nombre"
  npm run editorial -- enviar-revision <slug> --por "Nombre"
  npm run editorial -- aprobar <slug> --por "Otra persona"
  npm run editorial -- publicar <slug> --por "Nombre" [--fecha AAAA-MM-DD] [--vence AAAA-MM-DD]
  npm run editorial -- devolver <slug> --por "Nombre" --motivo "..."
  npm run editorial -- archivar <slug> --por "Nombre"
  npm run editorial -- retirar <slug> --por "Nombre" --motivo "..."
  npm run editorial -- listar [--estado borrador|en_revision|aprobado|publicado|archivado]

Categorías: ${Object.keys(CATEGORIAS_AVISO).join(', ')}
Cada acción queda registrada en content/bitacora.jsonl.
Nota: el nombre en --por es declarativo; el control de acceso real lo da el repositorio.`;

function parseArgs(argv) {
  const pos = [];
  const opts = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      opts[argv[i].slice(2)] = argv[i + 1];
      i += 1;
    } else pos.push(argv[i]);
  }
  return { pos, opts };
}

function cargar(dir, slug) {
  const file = path.join(dir, 'avisos', `${slug}.json`);
  if (!fs.existsSync(file)) throw new Error(`No existe el aviso "${slug}".`);
  return { file, aviso: JSON.parse(fs.readFileSync(file, 'utf8')) };
}

function documentosIds(dir) {
  const d = path.join(dir, 'documentos');
  if (!fs.existsSync(d)) return new Set();
  return new Set(fs.readdirSync(d).filter((f) => f.endsWith('.json') && !f.startsWith('_')).map((f) => f.replace(/\.json$/, '')));
}

try {
  const config = loadConfig();
  const dir = config.contentDir;
  const today = todayMexico(config.buildDate);
  const { pos, opts } = parseArgs(process.argv.slice(2));
  const [comando, slug] = pos;

  if (!comando || comando === 'ayuda' || comando === '--help') {
    console.log(AYUDA);
  } else if (comando === 'listar') {
    const carpeta = path.join(dir, 'avisos');
    const archivos = fs.existsSync(carpeta) ? fs.readdirSync(carpeta).filter((f) => f.endsWith('.json') && !f.startsWith('_')) : [];
    let n = 0;
    for (const f of archivos.sort()) {
      const a = JSON.parse(fs.readFileSync(path.join(carpeta, f), 'utf8'));
      if (opts.estado && a.estado !== opts.estado) continue;
      console.log(`${a.estado.padEnd(12)} ${a.cicloEscolar}  ${a.slug}  — ${a.titulo}`);
      n += 1;
    }
    if (!n) console.log('No hay avisos que coincidan.');
  } else if (comando === 'nuevo') {
    const carpeta = path.join(dir, 'avisos');
    fs.mkdirSync(carpeta, { recursive: true });
    const existentes = fs.readdirSync(carpeta).filter((f) => f.endsWith('.json') && !f.startsWith('_')).length;
    const aviso = nuevoAviso(
      { titulo: opts.titulo, categoria: opts.categoria, ciclo: opts.ciclo, autor: opts.autor, slug: opts.slug },
      today, existentes + 1,
    );
    const file = path.join(carpeta, `${aviso.slug}.json`);
    if (fs.existsSync(file)) throw new Error(`Ya existe ${path.relative(process.cwd(), file)}.`);
    fs.writeFileSync(file, `${JSON.stringify(aviso, null, 2)}\n`);
    registrarBitacora(dir, { ts: new Date().toISOString(), accion: 'nuevo', slug: aviso.slug, usuario: aviso.autor, de: null, a: 'borrador' });
    console.log(`Borrador creado: ${path.relative(process.cwd(), file)}. Edita "resumen" y "cuerpo" (quita los marcadores [REDACTAR]).`);
  } else if (TRANSICIONES[comando]) {
    if (!slug) throw new Error('Indica el slug del aviso.');
    const { file, aviso } = cargar(dir, slug);
    const nuevo = transicionar(aviso, comando, opts, today);
    const { errors } = validarAvisoEditorial(nuevo, file, { documentosIds: documentosIds(dir) });
    if (errors.length) {
      for (const e of errors) console.error(` - ${e.mensaje}`);
      throw new Error('El aviso no pasa la validación; no se guardó ningún cambio.');
    }
    fs.writeFileSync(file, `${JSON.stringify(nuevo, null, 2)}\n`);
    registrarBitacora(dir, {
      ts: new Date().toISOString(), accion: comando, slug, usuario: opts.por, de: aviso.estado, a: nuevo.estado,
      ...(opts.motivo ? { motivo: opts.motivo } : {}),
    });
    console.log(`${slug}: ${aviso.estado} → ${nuevo.estado}`);
  } else {
    throw new Error(`Comando desconocido: ${comando}.\n\n${AYUDA}`);
  }
} catch (error) {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
}
