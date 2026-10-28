import { useMemo } from 'react';
import { useStore, useCtx } from '../../store/StoreProvider.jsx';
import { usd, pct, diffDays } from '../../domain/format.js';
import { Card, KpiGrid, Kpi } from '../../components/ui/index.js';

const sum = a => a.reduce((t, o) => t + (o.monto || 0), 0);
const rate = (a, b) => (a + b ? a / (a + b) : null);

/** Valores reales medidos sobre todas las oportunidades (como en la v2.3: no aplica los filtros globales). */
export function realStats(O) {
  const w = O.filter(o => o.etapa === 'CERRADA GANADA'), l = O.filter(o => o.etapa === 'CERRADA PERDIDA');
  const cyc = w.filter(o => o.fCierre && o.fCreacion).map(o => diffDays(o.fCierre, o.fCreacion)).filter(d => d >= 0).sort((a, b) => a - b);
  return {
    w, l, cyc, med: cyc.length ? cyc[Math.floor((cyc.length - 1) / 2)] : null,
    cal: ['Commit', 'Best', 'Pipeline'].map(k => { const c = O.filter(o => o.forecastAlCierre === k); return { k, n: c.length, g: c.filter(o => o.etapa === 'CERRADA GANADA').length }; }),
    byR: [...new Set(O.map(o => o.resp))].filter(Boolean).sort().map(r => { const W = w.filter(o => o.resp === r).length, L = l.filter(o => o.resp === r).length; return { r, W, L, t: rate(W, L) }; }),
  };
}

export default function RealesTab() {
  const { state } = useStore(), ctx = useCtx();
  const R = useMemo(() => realStats(state.opps), [state.opps]);
  const sw = sum(R.w), sl = sum(R.l);
  return <Card title="Valores reales medidos" sub="calculados en vivo con los datos del sistema">
    <KpiGrid cols={4}>
      <Kpi label="Tasa de cierre real" value={pct(rate(R.w.length, R.l.length))} detail={`${R.w.length} ganadas de ${R.w.length + R.l.length} cerradas`} />
      <Kpi label="Tasa de cierre en monto" value={pct(rate(sw, sl))} detail={`${usd(sw)} de ${usd(sw + sl)}`} />
      <Kpi label="Ciclo de venta (mediana)" value={R.med == null ? '—' : R.med + ' d'} detail={`creación → cierre de ${R.cyc.length} ganadas`} />
      <Kpi label="Ticket ganado promedio" value={usd(R.w.length ? sw / R.w.length : null)} detail="monto USD" />
    </KpiGrid>
    <div className="grid g2" style={{ marginTop: 12 }}>
      <div><h3 style={{ fontSize: 14, margin: '0 0 6px' }}>Calibración del pronóstico</h3>
        <div className="tw" style={{ border: 'none' }}><table>
          <thead><tr><th>Pronóstico al cerrar</th><th className="r">Cerradas</th><th className="r">Ganadas</th><th className="r">% real</th></tr></thead>
          <tbody>{R.cal.map(c => <tr key={c.k}><td>{c.k === 'Best' ? 'Best case' : c.k}</td><td className="r num">{c.n}</td><td className="r num">{c.g}</td><td className="r num">{c.n ? pct(c.g / c.n) : '—'}</td></tr>)}</tbody>
        </table></div>
        <small className="muted">Desde esta versión, cada cierre guarda el pronóstico que tenía. Con unos 10 cierres por categoría, compara el % real con el texto de referencia y ajústalo.</small></div>
      <div><h3 style={{ fontSize: 14, margin: '0 0 6px' }}>Tasa de cierre real por responsable</h3>
        <div className="tw" style={{ border: 'none' }}><table>
          <thead><tr><th>Resp.</th><th className="r">Ganadas</th><th className="r">Perdidas</th><th className="r">Tasa</th></tr></thead>
          <tbody>{R.byR.map(x => <tr key={x.r}><td>{x.r} · {ctx.respName(x.r)}</td><td className="r num">{x.W}</td><td className="r num">{x.L}</td><td className="r num">{pct(x.t)}</td></tr>)}</tbody>
        </table></div></div>
    </div>
  </Card>;
}
