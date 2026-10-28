/** Cálculos del tablero (funciones puras). */
import { ETAPAS_ABIERTAS } from '../../domain/constants.js';
import { etLabel } from '../../domain/format.js';
import { isActive, isStandby, stageKey, forecastOf, alerts } from '../../domain/rules.js';
import { espFinal, espCumpl } from '../../domain/ingenieria.js';

export const sum = a => a.reduce((s, o) => s + (o.monto || 0), 0);
const rate = (a, b) => (a + b ? a / (a + b) : null);

export function tableroStats(O, ctx, solicitudes) {
  const act = O.filter(isActive), stb = O.filter(isStandby);
  const won = O.filter(o => o.etapa === 'CERRADA GANADA'), lost = O.filter(o => o.etapa === 'CERRADA PERDIDA');
  const conM = act.filter(o => o.monto != null), conP = act.filter(o => o.monto != null && o.prob != null);
  const sinP = act.filter(o => o.prob == null).length;
  const fcs = { Commit: 0, Best: 0, Pipeline: 0 }, fcn = { Commit: 0, Best: 0, Pipeline: 0 };
  let nSinFc = 0, mSinFc = 0;
  act.forEach(o => { const f = forecastOf(o, ctx.params); if (f) { fcs[f] += o.monto || 0; fcn[f]++; } else { nSinFc++; mSinFc += o.monto || 0; } });
  const compl = [
    { k: 'sinMonto', l: 'Con monto', n: conM.length },
    { k: 'sinProb', l: 'Con probabilidad', n: act.length - sinP },
    { k: 'sinCierre', l: 'Con fecha de cierre', n: act.filter(o => o.fCierre).length },
    { k: 'sinAccion', l: 'Con próxima acción', n: act.filter(o => o.proxAccion).length },
  ];
  const stages = [...ETAPAS_ABIERTAS, 'GANADA', 'PERDIDA'].map(k => {
    const a = O.filter(o => stageKey(o) === k);
    return { k, label: k === 'GANADA' ? 'Ganada' : k === 'PERDIDA' ? 'Perdida' : etLabel(k), n: a.length, v: sum(a) };
  });
  const resp = [...new Set(O.map(o => o.resp))].filter(Boolean).sort().map(r => {
    const a = O.filter(o => o.resp === r), op = a.filter(isActive);
    const w = a.filter(o => o.etapa === 'CERRADA GANADA'), l = a.filter(o => o.etapa === 'CERRADA PERDIDA');
    return { r, n: op.length, sm: op.filter(o => o.monto == null).length, sb: a.filter(isStandby).length, pip: sum(op),
      pond: op.reduce((s, o) => s + (o.monto || 0) * (o.prob || 0), 0), w: w.length, l: l.length, wv: sum(w), wr: rate(w.length, l.length),
      al: a.filter(o => alerts(o, ctx).some(x => x[0] === 'crit')).length, act: ctx.respActivo(r) };
  });
  const vert = {}; act.forEach(o => { const k = o.vertical || 'Sin vertical'; vert[k] = (vert[k] || 0) + (o.monto || 0); });
  const causas = {}; lost.forEach(o => { const k = o.causaPerdida || 'Sin analizar'; causas[k] = (causas[k] || 0) + 1; });
  const solA = solicitudes.filter(s => s.estado === 'Abierta');
  const solV = solA.flatMap(s => (s.esp || []).filter(e => !espFinal(e)));
  return {
    act, stb, won, lost, conM, conP, sinM: act.length - conM.length, sinP,
    pip: sum(act), pond: conP.reduce((s, o) => s + o.monto * o.prob, 0),
    fcs, fcn, nSinFc, mSinFc, compl, stages,
    wrN: rate(won.length, lost.length), wr$: rate(sum(won), sum(lost)),
    resp, vr: Object.entries(vert).sort((a, b) => b[1] - a[1]), cr: Object.entries(causas).sort((a, b) => b[1] - a[1]),
    top: [...act].sort((a, b) => (b.monto || 0) - (a.monto || 0)).slice(0, 8),
    solA, solV, cV: solV.filter(e => espCumpl(e, true, ctx.params).k === 'vencida').length, cS: solV.filter(e => !e.fComprometida).length,
  };
}
