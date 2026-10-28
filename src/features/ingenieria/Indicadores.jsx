import { useMemo } from 'react';
import { useStore, useCtx } from '../../store/StoreProvider.jsx';
import { Kpi, KpiGrid } from '../../components/ui/index.js';
import { ESPECIALIDADES } from '../../domain/constants.js';
import { pct } from '../../domain/format.js';
import { allEsp, cumplAgg, espKey } from '../../domain/ingenieria.js';
import { espStats, desvTxt } from './casoUtils.js';

const red = v => (v ? { color: 'var(--crit)', fontWeight: 600 } : undefined);

/** Pestaña “Indicadores”: cumplimiento por especialidad, rendimiento por especialista y KPI. */
export default function Indicadores({ onEsp, onQuien }) {
  const { state } = useStore(); const ctx = useCtx(); const P = ctx.params;
  const { R, G, st } = useMemo(() => { const R = allEsp(state.solicitudes); return { R, G: cumplAgg(R, P), st: espStats(state.solicitudes, P) }; }, [state.solicitudes, P]);
  if (!R.length) return <div className="empty">Los indicadores se calculan cuando haya casos técnicos registrados.</div>;
  return <>
    <div className="card"><h2>Cumplimiento por especialidad <small>fecha comprometida → revisada → entrega final</small></h2>
      <div className="tw" style={{ border: 'none' }}><table><thead><tr><th>Especialidad</th><th className="r">En curso</th><th className="r">Vencidas</th><th className="r">Por vencer</th><th className="r">Sin fecha</th>
        <th className="r">Entregadas</th><th className="r">A tiempo</th><th className="r">Dentro de lo revisado</th><th className="r">Con atraso</th><th className="r">% cumplimiento</th><th className="r">Desvío prom.</th><th className="r">Cambios de fecha</th></tr></thead>
        <tbody>{ESPECIALIDADES.map(e => { const x = cumplAgg(R.filter(r => espKey(r.e.esp) === e), P); return <tr key={e} className="click" onClick={() => onEsp(e)}>
          <td><b>{e}</b></td><td className="r num">{x.curso}</td><td className="r num" style={red(x.venc)}>{x.venc}</td><td className="r num">{x.porv}</td><td className="r num">{x.sinFecha}</td>
          <td className="r num">{x.ent}</td><td className="r num">{x.atiempo}</td><td className="r num">{x.revisado}</td><td className="r num">{x.atraso}</td><td className="r num">{pct(x.pct)}</td>
          <td className="r num">{desvTxt(x.desvProm)}</td><td className="r num">{x.revs}</td></tr>; })}</tbody></table></div></div>
    <div className="card"><h2>Rendimiento por especialista</h2>
      <div className="tw" style={{ border: 'none' }}><table><thead><tr><th>Especialista</th><th>Especialidades atendidas</th><th className="r">En curso</th><th className="r">Atrasadas vs. requerida</th>
        <th className="r">Entregadas</th><th className="r">Días promedio</th><th className="r">Cumple fecha comprometida</th><th className="r">Cambios de fecha</th></tr></thead>
        <tbody>{st.map(m => <tr key={m.n} className="click" onClick={() => onQuien(m.n === '(sin asignar)' ? '' : m.n)}>
          <td><b>{m.n}</b></td><td>{m.esp}</td><td className="r num">{m.abiertas}</td><td className="r num" style={red(m.atrasadas)}>{m.atrasadas}</td><td className="r num">{m.entregadas}</td>
          <td className="r num">{m.prom == null ? '—' : Math.round(m.prom)}</td><td className="r num">{pct(m.cmp.pct)}</td><td className="r num">{m.cmp.revs}</td></tr>)}</tbody></table></div></div>
    <KpiGrid>
      <Kpi label="Cumplimiento con fecha revisada" value={pct(G.pctRev)} detail="a tiempo + dentro de lo revisado" />
      <Kpi label="Desvío promedio" value={desvTxt(G.desvProm)} detail="entrega final vs. comprometida" />
      <Kpi label="Cambios de fecha por compromiso" value={G.revProm == null ? '—' : G.revProm.toFixed(1)} detail={`${G.revs} en total`} />
    </KpiGrid>
  </>;
}
