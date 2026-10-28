/**
 * Formulario “Resumen” de la ficha de oportunidad: valores iniciales y cálculo de cambios + bitácora (funciones puras).
 * Reglas de la v2.3 (d_ficha.js · dsave).
 */
import { ETAPAS_ABIERTAS } from '../../domain/constants.js';
import { etLabel, fd, usd } from '../../domain/format.js';
import { cliName, isStandby, stageLabel } from '../../domain/rules.js';

const s = v => (v == null ? '' : String(v));

export function initResumen(o) {
  return {
    proxAccion: s(o.proxAccion), fProxAccion: s(o.fProxAccion), resp: s(o.resp), etapa: s(o.etapa),
    monto: s(o.monto), prob: o.prob ?? null, forecast: s(o.forecast), fCierre: s(o.fCierre), montoLocal: s(o.montoLocal),
    ref: s(o.ref), clienteId: s(o.clienteId), clienteFinalId: o.clienteFinalId && o.clienteFinalId !== o.clienteId ? o.clienteFinalId : '',
    decisorTecnico: s(o.decisorTecnico), decisorFinal: s(o.decisorFinal), vertical: s(o.vertical), sharepoint: s(o.sharepoint),
    lineas: { energia: !!o.lineas?.energia, clima: !!o.lineas?.clima, security: !!o.lineas?.security },
    ingenieria: s(o.ingenieria), fConsulta: s(o.fConsulta), fOfertaRequerida: s(o.fOfertaRequerida), fUltimaOferta: s(o.fUltimaOferta),
  };
}

const LABELS = {
  forecast: 'Pronóstico', prob: 'Probabilidad', fCierre: 'Fecha prevista de cierre', montoLocal: 'Monto moneda local', ref: 'Referencia',
  clienteFinalId: 'Cliente final', decisorTecnico: 'Decisor técnico', decisorFinal: 'Decisor final', vertical: 'Vertical', sharepoint: 'Carpeta SharePoint',
  lineas: 'Especialidades involucradas', ingenieria: 'Estado de ingeniería', fConsulta: 'Fecha de consultas', fOfertaRequerida: 'Fecha requerida de oferta',
  fUltimaOferta: 'Fecha de última oferta',
};
const CON_ENTRADA_PROPIA = ['etapa', 'proxAccion', 'fProxAccion', 'monto', 'resp', 'clienteId', 'cliente', 'clienteFinal'];

const num = v => (v === '' || v == null ? null : parseFloat(v));
const nv = v => (v == null || v === '' ? null : v);

/**
 * Devuelve { error } o { ch, log, closeTo, aviso }.
 * closeTo: si se eligió una etapa de cierre (se abre la ventana de cierre después de guardar lo demás).
 */
export function buildResumenSave(o, f, ctx) {
  const t = v => String(v ?? '').trim();
  const p = {
    proxAccion: t(f.proxAccion), fProxAccion: t(f.fProxAccion) || null, resp: t(f.resp), etapa: t(f.etapa), monto: num(t(f.monto)), prob: f.prob ?? null,
    forecast: t(f.forecast), fCierre: t(f.fCierre) || null, montoLocal: num(t(f.montoLocal)), ref: t(f.ref), clienteId: t(f.clienteId),
    clienteFinalId: t(f.clienteFinalId) || t(f.clienteId), decisorTecnico: t(f.decisorTecnico), decisorFinal: t(f.decisorFinal), vertical: t(f.vertical),
    sharepoint: t(f.sharepoint), lineas: { ...f.lineas }, ingenieria: t(f.ingenieria), fConsulta: t(f.fConsulta) || null,
    fOfertaRequerida: t(f.fOfertaRequerida) || null, fUltimaOferta: t(f.fUltimaOferta) || null,
  };
  if (!p.clienteId) return { error: 'Elige el cliente comprador de la lista.' };
  p.cliente = ctx.cliById(p.clienteId)?.nombre || o.cliente; p.clienteFinal = ctx.cliById(p.clienteFinalId)?.nombre || '';
  if (p.sharepoint && !/^https?:\/\//.test(p.sharepoint)) return { error: 'El enlace de SharePoint debe empezar con https://' };
  const sb = isStandby(o);
  if (!sb && !p.etapa) return { error: 'Una oportunidad activa debe estar en una etapa. Si no se puede ubicar, pásala a standby.' };
  const willActive = !sb && ETAPAS_ABIERTAS.includes(p.etapa);
  if (willActive && (!p.proxAccion || !p.fProxAccion)) return { error: 'Una oportunidad activa necesita próxima acción y fecha.' };

  const ch = {};
  for (const k in p) if (JSON.stringify(nv(p[k])) !== JSON.stringify(nv(k === 'lineas' ? { energia: !!o.lineas?.energia, clima: !!o.lineas?.clima, security: !!o.lineas?.security } : o[k]))) ch[k] = p[k];
  if (!Object.keys(ch).length) return { ch, log: [] };

  let closeTo = null, aviso = '';
  if (ch.etapa === 'CERRADA PERDIDA' || ch.etapa === 'CERRADA GANADA') { closeTo = ch.etapa; delete ch.etapa; }
  if (sb && ch.etapa != null) { delete ch.etapa; aviso = 'Para cambiar la etapa de una oportunidad en standby, usa Reactivar.'; }

  const log = [];
  if (ch.etapa) log.push({ t: `Cambio de etapa: ${stageLabel(o)} → ${etLabel(ch.etapa)}`, tipo: 'Cambio de etapa' });
  if ('proxAccion' in ch || 'fProxAccion' in ch) log.push({ t: `Próxima acción: ${p.proxAccion} (${fd(p.fProxAccion)})` });
  if ('monto' in ch) log.push({ t: `Monto actualizado: ${usd(o.monto, false)} → ${usd(p.monto, false)}` });
  if ('resp' in ch) log.push({ t: `Responsable: ${o.resp} → ${p.resp}` });
  if ('clienteId' in ch) log.push({ t: `Cliente comprador: ${cliName(o, ctx)} → ${p.cliente}` });
  const otros = Object.keys(ch).filter(k => !CON_ENTRADA_PROPIA.includes(k)).map(k => LABELS[k] || k);
  if (otros.length) log.push({ t: `Datos actualizados: ${otros.join(', ')}.` });
  return { ch, log, closeTo, aviso };
}
