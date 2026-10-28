/**
 * Reglas de negocio de oportunidades. Funciones puras: reciben la oportunidad y un “contexto”
 * (configuración, parámetros, índice de clientes y casos técnicos) creado con makeCtx().
 */
import { DEFAULT_PARAMS, DEFAULT_CATALOGO, ESPECIALIDADES } from './constants.js';
import { hoyISO, diffDays, etLabel } from './format.js';

/** Parámetros vigentes = valores por defecto + lo guardado en config.parametros. */
export function getParams(cfg = {}) {
  const c = cfg.parametros || {};
  return { ...DEFAULT_PARAMS, ...c, probEtapa: { ...DEFAULT_PARAMS.probEtapa, ...(c.probEtapa || {}) } };
}
/** Textos de referencia de cada categoría de pronóstico. */
export function forecastTexts(p) {
  return {
    Commit: `Se cierra en este periodo (${p.periodo.toLowerCase()}) · acuerdo verbal o fecha de firma confirmada · cierre esperado ${p.tasaCommit}`,
    Best: `Podría cerrar si todo sale bien · pendiente de aprobación · cierre esperado ${p.tasaBest}`,
    Pipeline: `Activa pero sin cierre esperado en el periodo · cierre esperado ${p.tasaPipeline}`,
  };
}
/** Catálogo de rubros por especialidad (lo guardado o la propuesta por defecto). */
export function getCatalog(cfg = {}) {
  const c = cfg.catalogo || {}, o = {};
  ESPECIALIDADES.forEach(e => { const x = c[e] || {}; o[e] = { d: x.d ?? DEFAULT_CATALOGO[e].d, r: x.r && x.r.length ? x.r : DEFAULT_CATALOGO[e].r, validado: x.validado || null }; });
  return o;
}

/** Contexto de cálculo: se crea una vez por render con useCtx(). */
export function makeCtx({ config = {}, clientes = [], solicitudes = [] }) {
  const cli = Object.fromEntries(clientes.map(c => [c.id, c]));
  const equipo = config.equipo || [], archivo = (config.archivo || {}).equipo || [];
  return {
    cfg: config,
    params: getParams(config),
    catalog: getCatalog(config),
    coordDef: config.coordinadorDefault || 'Hernán Olguín',
    cliById: id => cli[id],
    respName: ini => (equipo.find(x => x.ini === ini) || archivo.find(x => x.ini === ini) || {}).nombre || ini || '—',
    respActivo: ini => equipo.some(p => p.ini === ini && p.activo),
    equipoActivo: equipo.filter(p => p.activo),
    especialistasActivos: (config.especialistas || []).filter(x => x.activo),
    solsDe: oid => solicitudes.filter(s => s.oppId === oid),
  };
}

export const isClosed = o => o.etapa === 'CERRADA GANADA' || o.etapa === 'CERRADA PERDIDA';
export const isStandby = o => !isClosed(o) && !!o.standby;
export const isActive = o => !isClosed(o) && !o.standby;
export const isOpen = o => !isClosed(o);
export const stageKey = o => (o.etapa === 'CERRADA GANADA' ? 'GANADA' : o.etapa === 'CERRADA PERDIDA' ? 'PERDIDA' : o.standby ? 'STANDBY' : o.etapa || 'SIN');
export const stageLabel = o => ({ GANADA: 'Ganada', PERDIDA: 'Perdida', STANDBY: 'Standby', SIN: 'Sin etapa' })[stageKey(o)] || etLabel(o.etapa);
export const causaTxt = o => (o.causaPerdida === 'Otra' && o.causaOtra ? 'Otra: ' + o.causaOtra : o.causaPerdida);
export const cliName = (o, ctx) => (o && ctx.cliById(o.clienteId)?.nombre) || o?.cliente || '—';
export const cliFinalName = (o, ctx) => (o && ctx.cliById(o.clienteFinalId)?.nombre) || o?.clienteFinal || '';

/** Pronóstico: manual si se eligió; si no, según probabilidad. Sin probabilidad → '' (sin pronóstico, no se inventa). */
export function forecastOf(o, params) {
  if (!isActive(o)) return '';
  if (o.forecast) return o.forecast;
  if (o.prob == null) return '';
  const p = o.prob;
  if (p >= params.commitMin || (o.etapa === 'CIERRE' && p >= params.commitCierreMin)) return 'Commit';
  if (p >= params.bestMin) return 'Best';
  return 'Pipeline';
}
export function lastActivity(o) {
  let m = o.fCreacion || '';
  for (const e of o.bitacora || []) if (e.f && e.f > m) m = e.f;
  if (o.fUltimaOferta && o.fUltimaOferta > m) m = o.fUltimaOferta;
  if (o.actualizado && o.actualizado.slice(0, 10) > m) m = o.actualizado.slice(0, 10);
  return m;
}
/** Alertas de una oportunidad: [nivel 'crit'|'warn', texto, clave]. */
export function alerts(o, ctx) {
  const a = [], h = hoyISO(), P = ctx.params;
  if (isActive(o)) {
    if (!o.etapa) a.push(['crit', 'Activa sin etapa', 'sinEtapa']);
    if (!o.proxAccion) a.push(['crit', 'Sin próxima acción', 'sinAccion']);
    else if (!o.fProxAccion) a.push(['warn', 'Acción sin fecha', 'accionSinFecha']);
    else if (o.fProxAccion < h) a.push(['crit', 'Acción vencida', 'accionVencida']);
    if (o.monto == null) a.push(['warn', 'Sin monto', 'sinMonto']);
    if (o.prob == null && !o.forecast) a.push(['warn', 'Sin probabilidad', 'sinProb']);
    if (o.fCierre && o.fCierre < h) a.push(['warn', 'Cierre previsto vencido', 'cierreVencido']);
    if (!o.fCierre) a.push(['warn', 'Sin fecha de cierre', 'sinCierre']);
    const la = lastActivity(o);
    if (la && diffDays(h, la) > P.diasSinMovimiento) a.push(['warn', `${diffDays(h, la)} días sin movimiento`, 'sinMovimiento']);
    if (!o.decisorFinal && !o.decisorTecnico && ['PROPUESTA', 'CIERRE'].includes(o.etapa)) a.push(['warn', 'Sin decisores', 'sinDecisor']);
    if (o.etapa === 'PROPUESTA' && !ctx.solsDe(o.id).length) a.push(['warn', 'Sin caso técnico', 'sinIngenieria']);
  } else if (isStandby(o)) {
    if (!o.standby.fRevision) a.push(['warn', 'Standby sin fecha de revisión', 'standbySinFecha']);
    else if (o.standby.fRevision < h) a.push(['crit', 'Revisar standby', 'standbyVencido']);
  } else if (o.etapa === 'CERRADA PERDIDA' && (!o.lecciones || !o.causaPerdida)) a.push(['warn', 'Pérdida sin análisis', 'sinLeccion']);
  if (isOpen(o) && o.resp && (ctx.cfg.equipo || []).length && !ctx.respActivo(o.resp)) a.push(['warn', 'Por reasignar (ex colaborador)', 'respInactivo']);
  if (isOpen(o) && (!o.clienteId || ctx.cliById(o.clienteId)?.nombre === 'POR CONFIRMAR')) a.push(['warn', 'Cliente por confirmar', 'sinCliente']);
  if (o.obs && o.obs.length) a.push(['warn', 'Numeración a revisar', 'numeracion']);
  return a;
}
export const ISSUES = {
  sinEtapa: 'Activas sin etapa', sinAccion: 'Activas sin próxima acción', accionVencida: 'Próxima acción vencida', accionSinFecha: 'Próxima acción sin fecha',
  sinProb: 'Activas sin probabilidad', sinMonto: 'Activas sin monto USD', cierreVencido: 'Fecha de cierre prevista ya pasó', sinCierre: 'Activas sin fecha de cierre',
  sinMovimiento: 'Sin movimiento (según parámetro de días)', sinDecisor: 'Propuesta o cierre sin decisores', sinIngenieria: 'En propuesta sin caso técnico',
  standbySinFecha: 'Standby sin fecha de revisión', standbyVencido: 'Standby con revisión vencida', respInactivo: 'Por reasignar (ex colaborador)',
  sinCliente: 'Cliente por confirmar', sinLeccion: 'Pérdidas sin causa o lección', numeracion: 'Numeración duplicada o irregular',
};
/** Oportunidades abiertas a nombre de personas que ya no están activas. */
export const porReasignar = (opps, ctx) => opps.filter(o => isOpen(o) && o.resp && !ctx.respActivo(o.resp))
  .sort((a, b) => (isStandby(a) - isStandby(b)) || (b.monto || 0) - (a.monto || 0));
/** Siguiente número de oportunidad: AA-P + correlativo de 3 dígitos (P = código de país). El correlativo es único en el año para todos los países. */
export function nextNumero(opps, paisCod = 1) {
  const yy = String(new Date().getFullYear()).slice(2);
  const mx = opps.filter(o => String(o.anio).slice(2) === yy && !(o.obs && o.obs.length)).reduce((m, o) => { const c = parseInt(o.correlativo, 10); return c > m && c < 1000 ? c : m; }, 0);
  const c = String(mx + 1).padStart(3, '0');
  return { numero: `${yy}-${paisCod}${c}`, correlativo: c, anio: 2000 + +yy };
}
