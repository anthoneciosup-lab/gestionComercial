import { useCtx } from '../../store/StoreProvider.jsx';
import { CumplChip, DateCell, Flags, Progress } from '../../components/ui/index.js';
import { fd, pct } from '../../domain/format.js';
import { espCumpl, solEtapa, solAvance, solAlerts } from '../../domain/ingenieria.js';
import { espLabel } from './casoUtils.js';

/** Lista de casos técnicos (pestaña “Casos”). */
export default function CasosList({ list, tit, onOpen }) {
  const ctx = useCtx();
  if (!list.length) return <div className="empty">No hay casos con estos filtros.</div>;
  return <div className="tw"><table><thead><tr><th>N°</th><th>Origen</th><th>Alcance</th><th>Especialidades</th><th>Etapa</th><th>Avance</th><th>Consultas</th><th>Alertas</th></tr></thead>
    <tbody>{list.map(s => { const av = solAvance(s); return <tr key={s.id} className="click" onClick={() => onOpen(s.id)}>
      <td className="mono">{s.id}<div className="muted" style={{ fontSize: 11 }}>{s.estado} · {s.prioridad || ''}</div></td>
      <td className="ref"><div className="t">{tit(s)}</div><div className="c">Solicitó {s.solicitante} · {fd(s.fSolicitud)} · coord. {s.coordinador || '—'}</div></td>
      <td style={{ minWidth: 200 }}>{s.alcance}</td>
      <td>{(s.esp || []).map((e, i) => <div key={e.id || i} className="espline"><b>{espLabel(e.esp)}</b> {e.especialista || 'sin asignar'} · <span className="muted">{e.etapa}</span>{' '}
        <CumplChip c={espCumpl(e, s.estado === 'Abierta', ctx.params)} /></div>)}</td>
      <td>{solEtapa(s)}</td>
      <td><Progress value={av} /> <span className="num" style={{ fontSize: 12 }}>{pct(av)}</span></td>
      <td><DateCell iso={s.fLimiteConsultas} /></td>
      <td><Flags items={solAlerts(s, ctx.params)} max={2} /></td>
    </tr>; })}</tbody></table></div>;
}
