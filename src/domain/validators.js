/** Validaciones de datos de empresa. */
/** RUC Perú (11 dígitos, empieza con 10/15/17/20) o RUT Chile (12345678-9). Vacío = válido. */
export function rucCheck(v, pais) {
  const s = String(v || '').trim();
  if (!s) return null;
  if (/^(10|15|17|20)\d{9}$/.test(s)) return null;
  if (/^\d{7,8}-[\dkK]$/.test(s)) return null;
  return pais === 'CHILE' ? 'El RUT debe tener el formato 12345678-9.' : 'El RUC debe tener 11 dígitos y empezar con 10, 15, 17 o 20.';
}
/** Normaliza una web: quita protocolo y barra final. */
export const webNorm = v => String(v || '').trim().replace(/^https?:\/\//i, '').replace(/\/$/, '');
export const emailOk = v => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
/** Id estable para una empresa a partir de su nombre. */
export const slugCliente = n => 'cl-' + String(n).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
