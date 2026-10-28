import { useNavigate } from 'react-router-dom';
import { useCtx } from '../../store/StoreProvider.jsx';
import { usd } from '../../domain/format.js';
import { forecastTexts } from '../../domain/rules.js';
import { BarRows, Card, Tag, Empty, stageColor } from '../../components/ui/index.js';
import { sum } from './tableroStats.js';

const fcColor = r => (r.label === 'Commit' ? 'var(--good)' : r.label === 'Best case' ? 'var(--accent)' : r.label === 'Sin pronóstico' ? 'var(--s0)' : 'var(--s1)');

/** Embudo por etapa + pronóstico. */
export function EmbudoPronostico({ s }) {
  const nav = useNavigate(), ctx = useCtx(), FC = forecastTexts(ctx.params);
  const goEtapa = etapa => nav('/oportunidades', { state: { etapa, alerta: '' } });
  const fcRows = [['Commit', 'Commit'], ['Best', 'Best case'], ['Pipeline', 'Pipeline']]
    .map(([k, l]) => ({ label: l, v: s.fcs[k], txt: <>{usd(s.fcs[k])} <small>· {s.fcn[k]}</small></>, title: FC[k] }))
    .concat([{ label: 'Sin pronóstico', v: s.mSinFc, txt: <>{usd(s.mSinFc)} <small>· {s.nSinFc}</small></>, title: 'Activas sin probabilidad registrada' }]);
  return <div className="grid g2">
    <div className="card"><h2>Embudo por etapa <small><Tag kind="real">Real</Tag> monto USD registrado · cantidad</small></h2>
      <BarRows rows={s.stages.map(x => ({ label: x.label, v: x.v, txt: <>{usd(x.v)} <small>· {x.n}</small></>, color: stageColor[x.k], onClick: () => goEtapa(x.k) }))}
        max={Math.max(...s.stages.map(x => x.v), 1)} />
      <p className="muted" style={{ fontSize: 12, margin: '10px 0 0' }}>Standby ({s.stb.length}, {usd(sum(s.stb))}) no se suma al embudo.{' '}
        <button className="glink" type="button" onClick={() => goEtapa('STANDBY')}>Ver standby</button></p></div>
    <div className="card"><h2>Pronóstico <small><Tag kind="est">Estimado</Tag> monto registrado por categoría</small></h2>
      <BarRows rows={fcRows} max={Math.max(s.fcs.Commit, s.fcs.Best, s.fcs.Pipeline, s.mSinFc, 1)} color={fcColor} />
      <details className="what"><summary>¿Qué significa cada pronóstico?</summary>
        <div className="legend-fc" style={{ marginTop: 8 }}>{Object.entries(FC).map(([k, v]) => <div key={k}><b>{k === 'Best' ? 'Best case' : k}</b>{v}</div>)}</div></details></div>
  </div>;
}

/** Pipeline por vertical, causas de pérdida y casos técnicos. */
export function Fila3({ s }) {
  const nav = useNavigate();
  return <div className="grid g3">
    <Card title="Pipeline por vertical" sub="real">{s.vr.length ? <BarRows rows={s.vr.map(([k, v]) => ({ label: k, v, txt: usd(v) }))} max={s.vr[0][1]} /> : <Empty>Sin datos</Empty>}</Card>
    <Card title="Causas de pérdida" sub={String(s.lost.length)}>{s.cr.length
      ? <BarRows rows={s.cr.map(([k, v]) => ({ label: k, v, txt: String(v) }))} max={s.cr[0][1]} color={r => (r.label === 'Sin analizar' ? 'var(--s0)' : 'var(--crit)')} />
      : <Empty>Sin pérdidas</Empty>}</Card>
    <Card title="Casos técnicos" sub={`${s.solA.length} abiertos`} onClick={() => nav('/ingenieria')}>{s.solA.length
      ? <div className="mini3"><div><b className="num">{s.solV.length}</b><span>especialidades en curso</span></div>
        <div className={s.cV ? 'crit' : ''}><b className="num">{s.cV}</b><span>entregas vencidas</span></div>
        <div className={s.cS ? 'warn' : ''}><b className="num">{s.cS}</b><span>sin fecha comprometida</span></div></div>
      : <div className="empty" style={{ padding: 14 }}>Aún no hay casos técnicos. Se crean desde una oportunidad o en Ingeniería → Casos técnicos.</div>}</Card>
  </div>;
}
