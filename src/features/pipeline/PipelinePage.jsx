import { useMemo, useState } from 'react';
import { useStore, useCtx, useScopedOpps } from '../../store/StoreProvider.jsx';
import { usd, etLabel } from '../../domain/format.js';
import { isActive, isStandby, stageLabel } from '../../domain/rules.js';
import { ETAPAS_ABIERTAS } from '../../domain/constants.js';
import { stageColor, useToast } from '../../components/ui/index.js';
import CierreModal from '../oportunidades/CierreModal.jsx';
import StandbyModal from '../oportunidades/StandbyModal.jsx';
import ReactivateModal from '../oportunidades/ReactivarModal.jsx';
import KanbanCard from './KanbanCard.jsx';
import { useDnd } from './useDnd.js';

const sum = a => a.reduce((s, o) => s + (o.monto || 0), 0);
const byMonto = a => [...a].sort((x, y) => (y.monto || 0) - (x.monto || 0));
const STB_KEY = 'voyant.ui.pipelineStandbyAbierto';
const lsGet = () => { try { return localStorage.getItem(STB_KEY) === '1'; } catch { return false; } };
const lsSet = v => { try { localStorage.setItem(STB_KEY, v ? '1' : ''); } catch { /* sin almacenamiento */ } };

export default function PipelinePage() {
  const { state, actions } = useStore(), ctx = useCtx(), O = useScopedOpps(), toast = useToast();
  const [m, setM] = useState(null); // {k:'cierre'|'standby'|'react', o, to}
  const [stbOpen, setStbOpen] = useState(lsGet);

  const changeStage = (id, to) => {
    const o = state.opps.find(x => x.id === id); if (!o) return;
    if (to === 'STANDBY') { if (!isStandby(o)) setM({ k: 'standby', o }); return; }
    if (to === 'CERRADA GANADA' || to === 'CERRADA PERDIDA') { setM({ k: 'cierre', o, to }); return; }
    if (isStandby(o)) { setM({ k: 'react', o, to }); return; }
    if (to === o.etapa) return;
    try {
      actions.updateOpp(o.id, { etapa: to, prob: o.prob ?? ctx.params.probEtapa[to] ?? null },
        { t: `Cambio de etapa: ${stageLabel(o)} → ${etLabel(to)}`, tipo: 'Cambio de etapa' });
      toast('Guardado');
    } catch (e) { toast(e.message); }
  };
  const dnd = useDnd(changeStage);
  const cls = (base, key) => `${base} ${dnd.over === key ? 'over' : ''}`;

  const g = useMemo(() => ({
    won: O.filter(o => o.etapa === 'CERRADA GANADA'), lost: O.filter(o => o.etapa === 'CERRADA PERDIDA'),
    stb: byMonto(O.filter(isStandby)),
    cols: ETAPAS_ABIERTAS.map(k => ({ k, list: byMonto(O.filter(o => isActive(o) && o.etapa === k)) })),
  }), [O]);
  const card = o => <KanbanCard key={o.id} o={o} onDragStart={dnd.start} onDragEnd={dnd.end} />;

  return <>
    <div className="closedrow">
      <div className={cls('drop g', 'CERRADA GANADA')} {...dnd.zone('CERRADA GANADA')}>Soltar aquí: <b>Ganada</b> <span className="muted num">· {g.won.length} · {usd(sum(g.won))}</span></div>
      <div className={cls('drop s', 'STANDBY')} {...dnd.zone('STANDBY')}>Soltar aquí: <b>Standby</b> <span className="muted num">· {g.stb.length} · {usd(sum(g.stb))}</span></div>
      <div className={cls('drop p', 'CERRADA PERDIDA')} {...dnd.zone('CERRADA PERDIDA')}>Soltar aquí: <b>Perdida</b> (pide causa y lección) <span className="muted num">· {g.lost.length}</span></div>
    </div>
    <div className="kanban">{g.cols.map(({ k, list }) =>
      <section key={k} data-col={k} className={cls('col', k)} {...dnd.zone(k)}>
        <header style={{ borderColor: stageColor[k] }}><b>{k}</b><span>{list.length} · {usd(sum(list))}</span></header>
        {list.length ? list.map(card) : <div className="muted" style={{ fontSize: 12, padding: 8 }}>Vacío</div>}
      </section>)}</div>
    <details className="card" open={stbOpen} onToggle={e => { setStbOpen(e.currentTarget.open); lsSet(e.currentTarget.open); }}>
      <summary><b>Standby</b> <span className="muted">· {g.stb.length} oportunidades fuera del pipeline (arrastra una tarjeta a una etapa para reactivarla)</span></summary>
      <div className="kanban" style={{ marginTop: 10 }}><section className={cls('col', 'STANDBY')} style={{ gridColumn: '1/-1' }} {...dnd.zone('STANDBY')}>
        <div className="stbgrid">{g.stb.length ? g.stb.map(card) : <div className="muted">Sin oportunidades en standby.</div>}</div></section></div>
    </details>
    {m?.k === 'cierre' && <CierreModal opp={m.o} to={m.to} onClose={() => setM(null)} />}
    {m?.k === 'standby' && <StandbyModal opp={m.o} onClose={() => setM(null)} />}
    {m?.k === 'react' && <ReactivateModal opp={m.o} etapa={m.to} onClose={() => setM(null)} />}
  </>;
}
