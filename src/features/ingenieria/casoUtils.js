/** Funciones puras y acciones compartidas del módulo de casos técnicos. */
import { ESP_CORTO, ESPECIALIDADES } from '../../domain/constants.js';
import { hoyISO, fd, diffDays, pct } from '../../domain/format.js';
import { cliName } from '../../domain/rules.js';
import { espIdx, espFinal, espRubro, espCumpl, espAvance, cumplAgg, allEsp } from '../../domain/ingenieria.js';

/** “N° · cliente” si viene de una oportunidad; si no, “Proyecto: … · cliente”. */
export function solTitulo(s, opps, ctx) {
  const o = opps.find(x => x.id === s.oppId);
  if (o) return `${o.numero} · ${cliName(o, ctx)}`;
  return `Proyecto: ${s.proyecto || '—'}${s.clienteId ? ' · ' + (ctx.cliById(s.clienteId)?.nombre || '') : ''}`;
}

export const espLabel = e => ESP_CORTO[e] || e;

/** Especialidad nueva, vacía. */
export function blankEsp(esp, id, fAsignado = hoyISO()) {
  return { id, esp, rubro: '', rubroOtro: '', especialista: '', etapa: 'Asignada', fAsignado, ent: {}, fConsultas: null, sinConsultas: false, fSolucion: null, fCosteo: null, notas: '',
    fComprometida: null, compPor: '', compFecha: null, fRevisada: null, revisiones: [], fEntregaFinal: null };
}

/** Reemplaza la especialidad i del caso y agrega el texto al historial. */
export function writeEsp(actions, s, i, ne, logT) {
  const esp = s.esp.map((x, j) => (j === i ? ne : x));
  return actions.updateCaso(s.id, { esp }, logT);
}

/** Fija la fecha comprometida (acción rápida de la tabla). Lanza Error si falta algo. */
export function fijarComp(actions, s, i, fecha, por) {
  const e = s.esp[i];
  if (!fecha) throw new Error('Elige la fecha comprometida.');
  if (!por) throw new Error('Indica el coordinador técnico que compromete la fecha.');
  if (e.fAsignado && fecha < e.fAsignado) throw new Error('La fecha comprometida no puede ser anterior a la asignación.');
  return writeEsp(actions, s, i, { ...e, fComprometida: fecha, compPor: por, compFecha: hoyISO() }, `${e.esp}: fecha comprometida ${fd(fecha)} (${por}).`);
}

/** Rendimiento por especialista. */
export function espStats(sols, params) {
  const h = hoyISO(), M = {};
  sols.forEach(s => (s.esp || []).forEach(e => {
    const k = e.especialista || '(sin asignar)';
    const m = M[k] = M[k] || { n: k, esp: new Set(), abiertas: 0, entregadas: 0, dias: [], aTiempo: 0, conFecha: 0, atrasadas: 0 };
    m.esp.add(espLabel(e.esp));
    if (s.estado === 'Abierta' && espIdx(e) < 4) m.abiertas++;
    if (e.fSolucion) {
      m.entregadas++; if (e.fAsignado) m.dias.push(diffDays(e.fSolucion, e.fAsignado));
      if (s.fRequeridaSolucion) { m.conFecha++; if (e.fSolucion <= s.fRequeridaSolucion) m.aTiempo++; }
    } else if (s.estado === 'Abierta' && s.fRequeridaSolucion && s.fRequeridaSolucion < h) m.atrasadas++;
  }));
  const R = allEsp(sols);
  return Object.values(M).map(m => ({ ...m, esp: [...m.esp].join(', '), prom: m.dias.length ? m.dias.reduce((a, b) => a + b, 0) / m.dias.length : null,
    pct: m.conFecha ? m.aTiempo / m.conFecha : null, cmp: cumplAgg(R.filter(r => (r.e.especialista || '(sin asignar)') === m.n), params) })).sort((a, b) => b.abiertas - a.abiertas);
}

export const desvTxt = d => (d == null ? '—' : (d > 0 ? '+' : '') + Math.round(d) + ' d');

/** Columnas de la exportación CSV (una fila por especialidad). */
export function csvCols(tit, params) {
  return [['id', 'Caso', r => r.s.id], ['origen', 'Origen', r => tit(r.s)], ['alcance', 'Alcance', r => r.s.alcance], ['estado', 'Estado', r => r.s.estado], ['prioridad', 'Prioridad', r => r.s.prioridad],
    ['solicitante', 'Solicitante', r => r.s.solicitante], ['coord', 'Coordinador técnico', r => r.s.coordinador], ['fs', 'Fecha solicitud', r => r.s.fSolicitud], ['fk', 'Kickoff', r => r.s.fKickoff],
    ['fl', 'Límite consultas', r => r.s.fLimiteConsultas], ['fr', 'Requerida por comercial', r => r.s.fRequeridaSolucion], ['fc', 'Costeo requerido', r => r.s.fRequeridaCosteo],
    ['esp', 'Especialidad', r => r.e.esp], ['rubro', 'Rubro', r => espRubro(r.e)], ['quien', 'Especialista', r => r.e.especialista], ['etapa', 'Etapa', r => r.e.etapa],
    ['fcomp', 'Fecha comprometida', r => r.e.fComprometida], ['cpor', 'Comprometida por', r => r.e.compPor], ['frev', 'Fecha comprometida revisada', r => r.e.fRevisada],
    ['nrev', 'Cambios de fecha', r => (r.e.revisiones || []).length], ['mrev', 'Motivos de revisión', r => (r.e.revisiones || []).map(x => x.motivo).join(' / ')],
    ['ffin', 'Fecha de entrega final', r => espFinal(r.e)], ['cumpl', 'Cumplimiento', r => espCumpl(r.e, r.s.estado === 'Abierta', params).t],
    ['av', 'Avance entregables', r => pct(espAvance(r.e))], ['fcos', 'Costeo listo', r => r.e.fCosteo]];
}

export const ESTADOS_CASO = [['Abierta', 'Abiertos'], ['Cerrada', 'Cerrados'], ['Cancelada', 'Cancelados']];
export const FILTROS_C = { abiertos: 'casos abiertos', vencidas: 'entregas vencidas', porvencer: 'por vencer', sinfecha: 'sin fecha comprometida' };
export const FILTRO_K = { vencidas: 'vencida', porvencer: 'porvencer', sinfecha: 'sinfecha' };
export { ESPECIALIDADES };
