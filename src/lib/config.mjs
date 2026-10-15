// Configuración del entorno. Nada sensible vive en el código.
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function normalizeBase(value) {
  let base = (value || '/').trim();
  if (!base.startsWith('/')) base = `/${base}`;
  if (!base.endsWith('/')) base = `${base}/`;
  return base;
}

function normalizeSite(value) {
  const site = (value || '').trim().replace(/\/+$/, '');
  if (!site) return '';
  if (!/^https:\/\/[^\s]+$/i.test(site)) {
    throw new Error('SITE_URL debe comenzar con https:// (ejemplo: https://dominio-confirmado.example)');
  }
  return site;
}

export function loadConfig(env = process.env) {
  const mode = (env.SITE_MODE || 'demo').trim();
  if (!['demo', 'produccion'].includes(mode)) {
    throw new Error(`SITE_MODE inválido: "${mode}". Usa "demo" o "produccion".`);
  }
  const endpoint = (env.CONTACT_FORM_ENDPOINT || '').trim();
  if (endpoint && !/^https:\/\//i.test(endpoint)) {
    throw new Error('CONTACT_FORM_ENDPOINT debe ser una URL https://');
  }
  return {
    mode,
    isDemo: mode === 'demo',
    base: normalizeBase(env.BASE_PATH),
    siteUrl: normalizeSite(env.SITE_URL),
    contactEndpoint: endpoint,
    outDir: path.resolve(ROOT, env.OUT_DIR || 'dist'),
    contentDir: path.resolve(ROOT, env.CONTENT_DIR || 'content'),
    buildDate: (env.BUILD_DATE || '').trim() || null,
  };
}
