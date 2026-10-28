import { useCtx } from '../../store/StoreProvider.jsx';
import { useDrawer } from '../../app/useDrawer.js';
import { usd, pct } from '../../domain/format.js';
import { cliName } from '../../domain/rules.js';
import { solEtapa, solAvance } from '../../domain/ingenieria.js';
import { ForecastChip, DateCell, Progress } from '../../components/ui/index.js';

/** Tarjeta arrastrable del kanban. */
export default function KanbanCard({ o, onDragStart, onDragEnd }) {
  const ctx = useCtx(), d = useDrawer();
  const caso = ctx.solsDe(o.id).find(s => s.estado === 'Abierta');
  return <article className="kc" data-opp={o.id} draggable onClick={() => d.open('opp', o.id)}
    onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', o.id); } catch { /* navegadores antiguos */ } onDragStart(o.id); }}
    onDragEnd={onDragEnd}>
    <div className="top"><span className="id">{o.numero || o.id} · {o.resp}</span><ForecastChip o={o} params={ctx.params} /></div>
    <div className="cli">{cliName(o, ctx)}</div><div className="rf">{o.ref}</div>
    <div className="bot"><span className="num"><b>{usd(o.monto)}</b> <span className="muted">{o.prob != null ? pct(o.prob) : ''}</span></span>
      {o.fCierre && <span className="muted">cierre <DateCell iso={o.fCierre} /></span>}</div>
    {caso && <div className="ingchip">Ingeniería: {solEtapa(caso)} <Progress value={solAvance(caso)} /></div>}
    <div className={`na ${o.proxAccion ? '' : 'none'}`}>{o.proxAccion ? <>→ {o.proxAccion} · <DateCell iso={o.fProxAccion} /></> : 'Sin próxima acción'}</div>
  </article>;
}
