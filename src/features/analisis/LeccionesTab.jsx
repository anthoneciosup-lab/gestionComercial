import { useMemo } from 'react';
import { useCtx, useScopedOpps } from '../../store/StoreProvider.jsx';
import { useDrawer } from '../../app/useDrawer.js';
import { usd } from '../../domain/format.js';
import { cliName, causaTxt } from '../../domain/rules.js';
import { BarRows, Card, Kpi, Empty } from '../../components/ui/index.js';

const sum = a => a.reduce((s, o) => s + (o.monto || 0), 0);

function lecciones(O) {
  const lost = O.filter(o => o.etapa === 'CERRADA PERDIDA').sort((a, b) => (b.monto || 0) - (a.monto || 0));
  const won = O.filter(o => o.etapa === 'CERRADA GANADA');
  const pend = lost.filter(o => !(o.lecciones && o.causaPerdida));
  const causas = {}; lost.forEach(o => { const k = o.causaPerdida || 'Sin analizar'; (causas[k] = causas[k] || { n: 0, v: 0 }); causas[k].n++; causas[k].v += o.monto || 0; });
  return { lost, won, pend, done: lost.length - pend.length, cr: Object.entries(causas).sort((a, b) => b[1].v - a[1].v),
    otras: lost.filter(o => o.causaPerdida === 'Otra' && o.causaOtra), withLesson: O.filter(o => o.lecciones) };
}

/** Ganadas y perdidas: causas de pérdida, lecciones registradas y pérdidas por analizar. */
export default function LeccionesTab() {
  const ctx = useCtx(), d = useDrawer(), O = useScopedOpps();
  const L = useMemo(() => lecciones(O), [O]);
  const openCierre = id => d.open('opp', id, 'cierre');
  return <>
    <div className="grid g2">
      <Card title="Monto perdido por causa">
        <BarRows rows={L.cr.map(([k, x]) => ({ label: k, v: x.v, txt: <>{usd(x.v)} <small>· {x.n}</small></> }))} max={L.cr[0] ? L.cr[0][1].v : 0}
          color={r => (r.label === 'Sin analizar' ? 'var(--s0)' : 'var(--crit)')} />
        {L.otras.length > 0 && <p className="muted" style={{ fontSize: 12.5, margin: '10px 0 0' }}>Causas escritas en “Otra”: {L.otras.map(o => o.causaOtra).join(' · ')}</p>}
      </Card>
      <Card title="Estado del análisis">
        <div className="kpis" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}>
          <Kpi label="Perdidas" value={L.lost.length} detail={usd(sum(L.lost))} />
          <Kpi label="Analizadas" value={L.done} detail="causa + lección" />
          <Kpi label="Pendientes" value={L.pend.length} detail="por completar" tone={L.pend.length ? 'crit' : ''} />
        </div>
        <p className="muted" style={{ fontSize: 12.5, margin: '10px 0 0' }}>Ganadas: {L.won.length} ({usd(sum(L.won))}). Al cerrar como perdida, el sistema pide causa (de la lista o escrita en “Otra”) y lección.</p>
      </Card>
    </div>
    <Card title="Lecciones registradas" sub={String(L.withLesson.length)}><div className="grid g2">{L.withLesson.length ? L.withLesson.map(o =>
      <div key={o.id} className="lesson">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <a href="#" className="mono" style={{ fontSize: 12 }} onClick={e => { e.preventDefault(); openCierre(o.id); }}>{o.numero || o.id} · {cliName(o, ctx)}</a>
          {o.causaPerdida ? <span className="flag crit">{causaTxt(o)}</span> : o.etapa === 'CERRADA GANADA' ? <span className="flag ok">Ganada</span> : null}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{o.ref} · {usd(o.monto)}</div>
        <q>{o.lecciones}</q>
      </div>) : <Empty>Aún no hay lecciones.</Empty>}</div></Card>
    <Card title="Pérdidas pendientes de análisis" sub={String(L.pend.length)}><div className="tw" style={{ border: 'none' }}><table><tbody>
      {L.pend.map(o => <tr key={o.id} className="click" onClick={() => d.open('opp', o.id)}>
        <td className="mono">{o.numero || o.id}</td>
        <td className="ref"><div className="t">{o.ref}</div><div className="c">{cliName(o, ctx)} · {o.resp}</div></td>
        <td className="r num">{usd(o.monto)}</td>
        <td>{o.causaPerdida ? <span className="flag warn">{causaTxt(o)} · falta lección</span> : <span className="flag warn">Falta causa</span>}</td>
        <td><button className="btn sm" type="button" onClick={e => { e.stopPropagation(); openCierre(o.id); }}>Completar</button></td>
      </tr>)}</tbody></table></div></Card>
  </>;
}
