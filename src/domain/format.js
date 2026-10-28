/** Fechas (ISO AAAA-MM-DD, zona local) y formatos de montos y porcentajes. */
const pad = n => String(n).padStart(2, '0');
export const hoyISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
export const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
export const diffDays = (a, b) => Math.round((new Date(a + 'T12:00:00') - new Date(b + 'T12:00:00')) / 864e5);
export const fd = iso => { if (!iso) return '—'; const [y, m, d] = String(iso).slice(0, 10).split('-'); return `${d}/${m}/${y.slice(2)}`; };
export const nowTs = () => new Date().toISOString();
/** Monto en USD: compacto ($1.25M, $566K) o completo (US$ 1,250,000). */
export function usd(n, compact = true) {
  if (n == null || isNaN(n)) return '—';
  if (!compact) return 'US$ ' + Math.round(n).toLocaleString('es-PE');
  const a = Math.abs(n);
  if (a >= 1e6) return '$' + (n / 1e6).toFixed(a >= 1e7 ? 1 : 2) + 'M';
  if (a >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
  return '$' + Math.round(n);
}
export const pct = x => (x == null || isNaN(x) ? '—' : Math.round(x * 100) + '%');
export const clone = o => JSON.parse(JSON.stringify(o));
export const etLabel = e => (e ? e[0] + e.slice(1).toLowerCase() : '');
