/** Agrupa las oportunidades activas por la fecha de su próxima acción. */
import { hoyISO, diffDays } from '../../domain/format.js';
import { isActive, isStandby } from '../../domain/rules.js';

const byFecha = a => [...a].sort((x, y) => (x.fProxAccion || '').localeCompare(y.fProxAccion || '') || (y.monto || 0) - (x.monto || 0));

export function agendaGroups(O) {
  const h = hoyISO(), g = { v: [], hoy: [], s: [], p: [], sf: [], n: [] };
  O.filter(isActive).forEach(o => {
    if (!o.proxAccion) g.n.push(o);
    else if (!o.fProxAccion) g.sf.push(o);
    else if (o.fProxAccion < h) g.v.push(o);
    else if (o.fProxAccion === h) g.hoy.push(o);
    else if (diffDays(o.fProxAccion, h) <= 7) g.s.push(o);
    else g.p.push(o);
  });
  Object.keys(g).forEach(k => { g[k] = byFecha(g[k]); });
  g.stb = O.filter(o => isStandby(o) && (!o.standby.fRevision || diffDays(o.standby.fRevision, h) <= 7))
    .sort((a, b) => (a.standby.fRevision || '0').localeCompare(b.standby.fRevision || '0'));
  return g;
}
