// Plantillas HTML con escape automático.
// Todo valor interpolado se escapa salvo que se marque explícitamente con raw().

class Raw {
  constructor(value) {
    this.value = value;
  }
  toString() {
    return this.value;
  }
}

export const raw = (value) => new Raw(String(value ?? ''));

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(value) {
  if (value instanceof Raw) return value.value;
  if (Array.isArray(value)) return value.map(esc).join('');
  if (value === null || value === undefined || value === false) return '';
  return String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i += 1) {
    out += esc(values[i]) + strings[i + 1];
  }
  return new Raw(out);
}

// Acepta solo rutas internas o http(s)/mailto/tel; evita javascript: y similares.
export function safeUrl(url) {
  const value = String(url ?? '').trim();
  if (/^(https?:|mailto:|tel:|\/|#|\.\/|\.\.\/)/i.test(value)) return value;
  return '#';
}

export function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  if (!y || !m || !d) return '';
  return `${d} de ${meses[m - 1]} de ${y}`;
}
