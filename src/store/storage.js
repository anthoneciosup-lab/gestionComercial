/**
 * Persistencia en localStorage.
 * - Todo el estado de datos se guarda en una sola clave (STORAGE_KEY) con versión de esquema.
 * - La primera vez se carga la base inicial (src/data/seed.json: los datos reales migrados del Excel).
 * - Otras pestañas del mismo navegador se sincronizan con el evento 'storage'.
 * Para conectar el servidor Node.js + MongoDB, reemplace este módulo por un repositorio que use la API
 * (mismas funciones: load, save, subscribe) sin tocar los componentes.
 */
import seed from '../data/seed.json';

export const STORAGE_KEY = 'voyant.comercial.datos';
export const UI_KEY = 'voyant.comercial.ui';
export const SCHEMA = 1;
const COLLS = ['opps', 'clientes', 'contacts', 'solicitudes'];

function safeGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
function safeSet(key, val) { try { localStorage.setItem(key, val); return true; } catch { return false; } }

export function seedData() {
  return { esquema: SCHEMA, opps: seed.opps, clientes: seed.clientes, contacts: seed.contacts, solicitudes: seed.solicitudes || [], config: seed.config, guardado: null };
}
/** Normaliza cualquier respaldo (de esta app o del sistema anterior) al formato interno. */
export function normalize(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('El archivo no es un respaldo válido.');
  const out = { esquema: SCHEMA, guardado: raw.guardado || null };
  for (const c of COLLS) {
    const v = raw[c] ?? (c === 'solicitudes' ? raw.sols : undefined);
    if (v != null && !Array.isArray(v)) throw new Error(`“${c}” debe ser una lista.`);
    out[c] = (v || []).map(d => ({ ...d }));
    if (out[c].some(d => !d.id)) throw new Error(`Hay registros sin id en “${c}”.`);
  }
  out.config = { equipo: [], especialistas: [], ...(raw.config || {}) };
  if (!out.opps.length && !out.clientes.length) throw new Error('El respaldo no contiene oportunidades ni clientes.');
  return out;
}
/** Carga desde localStorage; si no hay nada (o está dañado), usa la base inicial. */
export function load() {
  const raw = safeGet(STORAGE_KEY);
  if (!raw) return { data: seedData(), origen: 'base inicial' };
  try { return { data: normalize(JSON.parse(raw)), origen: 'localStorage' }; }
  catch { return { data: seedData(), origen: 'base inicial (los datos guardados estaban dañados)' }; }
}
export function save(data) {
  const ok = safeSet(STORAGE_KEY, JSON.stringify({ ...data, guardado: new Date().toISOString() }));
  return ok;
}
/** Avisa cuando otra pestaña guarda cambios. Devuelve la función para dejar de escuchar. */
export function subscribe(onChange) {
  const h = e => { if (e.key === STORAGE_KEY && e.newValue) { try { onChange(normalize(JSON.parse(e.newValue))); } catch { /* ignorar */ } } };
  window.addEventListener('storage', h);
  return () => window.removeEventListener('storage', h);
}
export function clear() { try { localStorage.removeItem(STORAGE_KEY); } catch { /* sin acceso */ } }
export function sizeKb() { const r = safeGet(STORAGE_KEY); return r ? Math.round(r.length * 2 / 1024) : 0; }
export const uiGet = () => { try { return JSON.parse(safeGet(UI_KEY) || '{}'); } catch { return {}; } };
export const uiSet = v => safeSet(UI_KEY, JSON.stringify(v));
