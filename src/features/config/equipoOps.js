/**
 * Lógica pura de “Equipo y reasignación”: borrador editable de equipo y especialistas,
 * validación y cálculo de los cambios en cascada (iniciales y nombres renombrados, reemplazos).
 */
import { clone } from '../../domain/format.js';
import { isOpen } from '../../domain/rules.js';

/** Borrador a partir de la configuración guardada; _orig recuerda el valor original para la cascada. */
export function draftFrom(cfg) {
  const c = clone(cfg || {});
  return {
    equipo: (c.equipo || []).map(p => ({ ...p, _orig: p.ini })),
    especialistas: (c.especialistas || []).map(p => ({ ...p, _orig: p.nombre })),
    archivo: { equipo: [], especialistas: [], ...(c.archivo || {}) },
  };
}
const strip = L => L.map(({ _orig, ...p }) => p);

export function validarBorrador(dr) {
  const ini = dr.equipo.map(p => p.ini);
  if (dr.equipo.some(p => !p.ini || !String(p.nombre || '').trim())) return 'Cada persona necesita iniciales y nombre.';
  if (new Set(ini).size !== ini.length || dr.equipo.some(p => dr.archivo.equipo.some(a => a.ini === p.ini))) return 'Las iniciales no pueden repetirse (tampoco con personas eliminadas).';
  if (dr.especialistas.some(p => !String(p.nombre || '').trim())) return 'Cada especialista necesita nombre.';
  const nom = dr.especialistas.map(p => p.nombre.trim().toLowerCase());
  if (new Set(nom).size !== nom.length) return 'Hay especialistas con el mismo nombre.';
  return '';
}

export const renombresEquipo = dr => dr.equipo.filter(p => p._orig && p._orig !== p.ini).map(p => [p._orig, p.ini]);
export const renombresEsp = dr => dr.especialistas.filter(p => p._orig && p._orig !== p.nombre.trim()).map(p => [p._orig, p.nombre.trim()]);

/**
 * Cambios por caso técnico (una sola pasada, para no pisar actualizaciones sobre el mismo caso).
 * esp: [[de, a]] renombres de especialista; ini: [[de, a]] renombres de iniciales (solicitante);
 * reemplazo: {de, a} al eliminar un especialista (solo casos abiertos).
 * Devuelve [{id, cambios, texto}].
 */
export function cambiosCasos(sols, { esp = [], ini = [], reemplazo = null }) {
  const out = [];
  for (const s of sols) {
    let coord = s.coordinador, sol = s.solicitante, lista = s.esp || [], txt = [];
    for (const [a, b] of ini) if (sol === a) { sol = b; }
    for (const [a, b] of esp) {
      if (coord === a || lista.some(e => e.especialista === a)) {
        if (coord === a) coord = b;
        lista = lista.map(e => (e.especialista === a ? { ...e, especialista: b } : e));
        txt.push(`Especialista renombrado: ${a} → ${b}.`);
      }
    }
    if (reemplazo && s.estado === 'Abierta' && (coord === reemplazo.de || lista.some(e => e.especialista === reemplazo.de))) {
      if (coord === reemplazo.de) coord = reemplazo.a;
      lista = lista.map(e => (e.especialista === reemplazo.de ? { ...e, especialista: reemplazo.a } : e));
      txt.push(`${reemplazo.de} eliminado de especialistas; reemplazo: ${reemplazo.a || 'sin asignar'}.`);
    }
    const cambios = {};
    if (coord !== s.coordinador) cambios.coordinador = coord;
    if (sol !== s.solicitante) cambios.solicitante = sol;
    if (lista !== (s.esp || [])) cambios.esp = lista;
    if (Object.keys(cambios).length) out.push({ id: s.id, cambios, texto: txt.join(' ') });
  }
  return out;
}

/** Configuración final a guardar desde el borrador. */
export function configDesde(cfg, dr, coordDefault) {
  return { ...cfg, equipo: strip(dr.equipo).map(p => ({ ...p, nombre: p.nombre.trim() })), especialistas: strip(dr.especialistas).map(p => ({ ...p, nombre: p.nombre.trim() })), archivo: dr.archivo, coordinadorDefault: coordDefault };
}

export const abiertasDe = (ini, opps) => opps.filter(o => o.resp === ini && isOpen(o));
export const totalDe = (ini, opps) => opps.filter(o => o.resp === ini).length;
/** Casos abiertos donde la persona es especialista o coordinador. */
export const casosDe = (nombre, sols) => sols.filter(s => s.estado === 'Abierta' && ((s.esp || []).some(e => e.especialista === nombre) || s.coordinador === nombre));
