/** Registro maestro de oportunidades: búsqueda, filtros, orden, exportación y reasignación de cartera. */
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useCtx, useScopedOpps } from '../../store/StoreProvider.jsx';
import { useDrawer } from '../../app/useDrawer.js';
import { ETAPAS_ABIERTAS, VERTICALES } from '../../domain/constants.js';
import { etLabel, fd, pct, usd } from '../../domain/format.js';
import { alerts, cliFinalName, cliName, forecastOf, isActive, isOpen, isStandby, ISSUES, lastActivity, stageKey } from '../../domain/rules.js';
import { DateCell, EtapaPill, Flags, ForecastChip } from '../../components/ui/index.js';
import { CliCell } from './shared.jsx';
import { exportOppsCSV } from './exportCsv.js';
import ReasignarModal from './ReasignarModal.jsx';

const SORT_KEYS = {
  monto: o => o.monto ?? -1, id: o => o.numero || o.id, cierre: o => o.fCierre || '9',
  accion: o => o.fProxAccion || '9', prob: o => o.prob ?? -1, mov: o => lastActivity(o),
};
const DESC_FIRST = ['monto', 'prob', 'mov'];

function initFilters(st) {
  return { q: '', etapa: st?.etapa || '', vert: '', fc: '', alerta: st?.alerta || '' };
}

export default function OportunidadesPage() {
  const loc = useLocation();
  const ctx = useCtx(); const d = useDrawer();
  const scoped = useScopedOpps();
  const [f, setF] = useState(() => initFilters(loc.state));
  const [sort, setSort] = useState({ k: 'monto', dir: -1 });
  const [rea, setRea] = useState(null);

  // Filtros enviados desde otro módulo (navigate('/oportunidades', {state:{etapa, alerta}}))
  useEffect(() => { if (loc.state && (loc.state.etapa || loc.state.alerta)) setF(initFilters(loc.state)); }, [loc.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const O = useMemo(() => {
    const q = f.q.toLowerCase();
    const list = scoped.filter(o => (!q || [o.numero, o.id, o.ref, cliName(o, ctx), cliFinalName(o, ctx), o.decisorFinal, o.decisorTecnico].join(' ').toLowerCase().includes(q))
      && (!f.etapa || (f.etapa === 'ACTIVAS' ? isActive(o) : stageKey(o) === f.etapa))
      && (!f.vert || o.vertical === f.vert)
      && (!f.fc || forecastOf(o, ctx.params) === f.fc)
      && (!f.alerta || alerts(o, ctx).some(a => a[2] === f.alerta)));
    const key = SORT_KEYS[sort.k];
    return list.sort((a, b) => { const x = key(a), y = key(b); return (x > y ? 1 : x < y ? -1 : 0) * sort.dir; });
  }, [scoped, ctx, f, sort]);

  const exCol = O.filter(o => isOpen(o) && o.resp && !ctx.respActivo(o.resp));
  const total = O.reduce((s, o) => s + (o.monto || 0), 0);
  const onSort = k => setSort(s => (s.k === k ? { k, dir: -s.dir } : { k, dir: DESC_FIRST.includes(k) ? -1 : 1 }));
  const Th = ({ k, children, className = '' }) =>
    <th className={`${className} click`} onClick={() => onSort(k)} aria-sort={sort.k === k ? (sort.dir > 0 ? 'ascending' : 'descending') : undefined}>
      {children}{sort.k === k ? (sort.dir > 0 ? ' ↑' : ' ↓') : ''}</th>;

  return <>
    <div className="toolbar">
      <input type="search" placeholder="Buscar por N°, cliente, referencia o decisor" value={f.q} onChange={e => set('q', e.target.value)} aria-label="Buscar oportunidades" />
      <select aria-label="Etapa" value={f.etapa} onChange={e => set('etapa', e.target.value)}>
        <option value="">Todas las etapas</option><option value="ACTIVAS">Solo activas</option>
        {ETAPAS_ABIERTAS.map(e => <option key={e} value={e}>{etLabel(e)}</option>)}
        <option value="STANDBY">Standby</option><option value="GANADA">Ganadas</option><option value="PERDIDA">Perdidas</option>
      </select>
      <select aria-label="Vertical" value={f.vert} onChange={e => set('vert', e.target.value)}>
        <option value="">Todas las verticales</option>{VERTICALES.map(v => <option key={v}>{v}</option>)}
      </select>
      <select aria-label="Pronóstico" value={f.fc} onChange={e => set('fc', e.target.value)}>
        <option value="">Todo pronóstico</option><option value="Commit">Commit</option><option value="Best">Best case</option><option value="Pipeline">Pipeline</option>
      </select>
      <select aria-label="Datos faltantes" value={f.alerta} onChange={e => set('alerta', e.target.value)}>
        <option value="">Cualquier estado de datos</option>{Object.entries(ISSUES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <button className="btn sm" type="button" onClick={() => exportOppsCSV(O, ctx)}>Exportar CSV</button>
      {exCol.length > 0 && <button className="btn sm warnbtn" type="button" onClick={() => setRea(exCol)}>Reasignar cartera de ex colaboradores ({exCol.length})</button>}
      <span className="count">{O.length} oportunidades · {usd(total)}</span>
    </div>
    <div className="tw"><table>
      <thead><tr>
        <Th k="id">N°</Th><th>Oportunidad</th><th>Estado</th><Th k="monto" className="r">Monto</Th><Th k="prob" className="r">Prob.</Th>
        <th>Pron.</th><Th k="cierre">Cierre</Th><Th k="accion">Próxima acción</Th><Th k="mov">Últ. mov.</Th><th>Alertas</th>
      </tr></thead>
      <tbody>
        {O.map(o => <OppRow key={o.id} o={o} ctx={ctx} onOpen={() => d.open('opp', o.id)} />)}
        {!O.length && <tr><td colSpan={10}><div className="empty">Ninguna oportunidad coincide con los filtros.</div></td></tr>}
      </tbody>
    </table></div>
    {rea && <ReasignarModal list={rea} onClose={() => setRea(null)} />}
  </>;
}

function OppRow({ o, ctx, onOpen }) {
  const exColab = isOpen(o) && o.resp && !ctx.respActivo(o.resp);
  return <tr className="click" onClick={onOpen}>
    <td className="mono">{o.numero || o.id}
      <div className="muted" style={{ fontSize: 11 }}>{o.pais} · {o.resp}{exColab && <> <span className="flag warn">ex colab.</span></>}</div></td>
    <td className="ref"><CliCell o={o} ctx={ctx} /></td>
    <td><EtapaPill o={o} /></td>
    <td className="r num">{usd(o.monto)}</td>
    <td className="r num">{pct(o.prob)}</td>
    <td><ForecastChip o={o} params={ctx.params} /></td>
    <td><DateCell iso={o.fCierre} /></td>
    <td style={{ minWidth: 170 }}>
      {isStandby(o)
        ? <span className="muted">Revisar: {o.standby.fRevision ? <DateCell iso={o.standby.fRevision} /> : 'sin fecha'}</span>
        : o.proxAccion ? <>{o.proxAccion}<br /><DateCell iso={o.fProxAccion} /></>
          : isActive(o) ? <span className="flag crit">Sin definir</span> : <span className="muted">—</span>}
    </td>
    <td><span className="date">{fd(lastActivity(o))}</span></td>
    <td><Flags items={alerts(o, ctx)} max={2} /></td>
  </tr>;
}
