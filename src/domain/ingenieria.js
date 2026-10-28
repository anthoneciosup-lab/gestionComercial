/** Casos técnicos (solicitudes a ingeniería): fechas comprometidas, cumplimiento, avance y alertas. */
import { ESPECIALIDADES, ESP_CORTO, ETAPAS_ING, ENTREGABLES } from './constants.js';
import { hoyISO, diffDays } from './format.js';

export const espKey = e => (ESPECIALIDADES.includes(e) ? e : ['Security', 'Conectividad', 'Teleco'].includes(e) ? 'Security, conectividad y telco' : e);
export const espCorto = e => ESP_CORTO[e] || e;
export const espIdx = e => Math.max(0, ETAPAS_ING.indexOf(e.etapa));
export const espVigente = e => e.fRevisada || e.fComprometida || null;
export const espFinal = e => e.fEntregaFinal || e.fSolucion || null;
export const espRubro = e => (e.rubro === 'Otro' ? e.rubroOtro || 'Otro' : e.rubro || '');
export function espAvance(e) {
  const ap = ENTREGABLES.filter(([k]) => (e.ent || {})[k]?.st !== 'na');
  if (!ap.length) return 1;
  return ap.filter(([k]) => (e.ent || {})[k]?.st === 'ok').length / ap.length;
}
/** La fecha comprometida solo se corrige el mismo día en que se registró y sin revisiones. */
export const compCorregible = e => !e.fComprometida || (e.compFecha === hoyISO() && !(e.revisiones || []).length);
/**
 * Cumplimiento de una especialidad. Devuelve {k, t, c, d}:
 * k = atiempo | revisado | atraso | vencida | porvencer | plazo | sinfecha | sincomp | na
 */
export function espCumpl(e, abierta = true, params = { diasCompromisoAviso: 2 }) {
  const h = hoyISO(), fin = espFinal(e), v = espVigente(e);
  if (!e.fComprometida) { if (fin) return { k: 'sincomp', t: 'Entregada sin fecha comprometida', c: '' }; return abierta ? { k: 'sinfecha', t: 'Sin fecha comprometida', c: 'warn' } : { k: 'na', t: '—', c: '' }; }
  if (fin) {
    const d = diffDays(fin, e.fComprometida);
    if (d <= 0) return { k: 'atiempo', t: 'A tiempo', c: 'good', d };
    if (e.fRevisada && fin <= e.fRevisada) return { k: 'revisado', t: `Dentro de lo revisado (+${d} d)`, c: 'info', d };
    return { k: 'atraso', t: `Con atraso (+${diffDays(fin, v)} d)`, c: 'crit', d };
  }
  if (!abierta) return { k: 'na', t: 'Sin entrega', c: '' };
  const d = diffDays(v, h);
  if (d < 0) return { k: 'vencida', t: `Vencida hace ${-d} d`, c: 'crit', d };
  if (d <= params.diasCompromisoAviso) return { k: 'porvencer', t: d ? `Vence en ${d} d` : 'Vence hoy', c: 'warn', d };
  return { k: 'plazo', t: 'En plazo', c: 'good', d };
}
export function solEtapa(s) { if (!s.esp || !s.esp.length) return 'Sin especialidades'; return ETAPAS_ING[Math.min(...s.esp.map(espIdx))]; }
export const solListo = s => !!(s.esp && s.esp.length && s.esp.every(e => e.etapa === 'Costeo listo'));
export function solAvance(s) {
  if (!s.esp || !s.esp.length) return 0;
  return s.esp.reduce((t, e) => t + (espIdx(e) / (ETAPAS_ING.length - 1)) * 0.4 + espAvance(e) * 0.6, 0) / s.esp.length;
}
export function solAlerts(s, params) {
  const a = [], h = hoyISO();
  if (s.estado !== 'Abierta') return a;
  const consultasPend = (s.esp || []).filter(e => !e.fConsultas && !e.sinConsultas && espIdx(e) <= 2);
  if (s.fLimiteConsultas && consultasPend.length) { const d = diffDays(s.fLimiteConsultas, h); if (d < 0) a.push(['crit', 'Consultas vencidas', 'consultasVencidas']); else if (d <= params.diasConsultasAviso) a.push(['warn', `Consultas vencen en ${d} d`, 'consultasPorVencer']); }
  if (s.fRequeridaSolucion && s.fRequeridaSolucion < h && (s.esp || []).some(e => espIdx(e) < 4)) a.push(['crit', 'Solución técnica atrasada', 'solAtrasada']);
  if (s.fRequeridaCosteo && s.fRequeridaCosteo < h && !solListo(s)) a.push(['warn', 'Costeo atrasado', 'costeoAtrasado']);
  if ((s.esp || []).some(e => !e.especialista)) a.push(['crit', 'Especialidad sin especialista', 'sinEspecialista']);
  const pend = (s.esp || []).filter(e => !espFinal(e));
  const venc = pend.filter(e => espCumpl(e, true, params).k === 'vencida'); if (venc.length) a.push(['crit', `Entrega comprometida vencida: ${venc.map(e => espCorto(e.esp)).join(', ')}`, 'compVencida']);
  const porv = pend.filter(e => espCumpl(e, true, params).k === 'porvencer'); if (porv.length) a.push(['warn', `Entrega comprometida por vencer: ${porv.map(e => espCorto(e.esp)).join(', ')}`, 'compPorVencer']);
  const sinC = pend.filter(e => !e.fComprometida && e.fAsignado && diffDays(h, e.fAsignado) >= params.diasParaComprometer); if (sinC.length) a.push(['warn', `Sin fecha comprometida: ${sinC.map(e => espCorto(e.esp)).join(', ')}`, 'sinCompromiso']);
  if (!s.coordinador) a.push(['warn', 'Sin coordinador técnico', 'sinCoord']);
  if (solListo(s)) a.push(['ok', 'Lista para propuesta', 'listo']);
  return a;
}
/** Agregado de cumplimiento para un conjunto de filas {s, e}. */
export function cumplAgg(rows, params) {
  const o = { n: rows.length, curso: 0, conComp: 0, venc: 0, porv: 0, sinFecha: 0, ent: 0, atiempo: 0, revisado: 0, atraso: 0, revs: 0, desv: [] };
  rows.forEach(({ s, e }) => {
    const ab = s.estado === 'Abierta', c = espCumpl(e, ab, params);
    if (ab && !espFinal(e)) o.curso++;
    if (e.fComprometida) o.conComp++;
    o.revs += (e.revisiones || []).length;
    if (c.k === 'vencida') o.venc++; if (c.k === 'porvencer') o.porv++; if (c.k === 'sinfecha') o.sinFecha++;
    if (espFinal(e) && e.fComprometida) { o.ent++; o[c.k === 'atiempo' ? 'atiempo' : c.k === 'revisado' ? 'revisado' : 'atraso']++; o.desv.push(c.d); }
  });
  o.pct = o.ent ? o.atiempo / o.ent : null;
  o.pctRev = o.ent ? (o.atiempo + o.revisado) / o.ent : null;
  o.desvProm = o.desv.length ? o.desv.reduce((a, b) => a + b, 0) / o.desv.length : null;
  o.revProm = o.conComp ? o.revs / o.conComp : null;
  return o;
}
/** Filas {s, e, i} de todas las especialidades de casos no cancelados. */
export const allEsp = sols => sols.filter(s => s.estado !== 'Cancelada').flatMap(s => (s.esp || []).map((e, i) => ({ s, e, i })));
export function nextSolId(sols) {
  const yy = String(new Date().getFullYear()).slice(2);
  const mx = sols.filter(s => s.id.startsWith(`SI-${yy}-`)).reduce((m, s) => Math.max(m, parseInt(s.id.split('-')[2], 10) || 0), 0);
  return `SI-${yy}-${String(mx + 1).padStart(3, '0')}`;
}
/** Agrupa rubros “Grupo · rubro” para mostrarlos en <optgroup>. */
export function groupRubros(list) {
  const g = new Map();
  list.forEach(r => { const k = r.includes(' · ') ? r.split(' · ')[0] : ''; if (!g.has(k)) g.set(k, []); g.get(k).push({ value: r, label: r.includes(' · ') ? r.split(' · ').slice(1).join(' · ') : r }); });
  return [...g.entries()].map(([group, items]) => ({ group, items }));
}
