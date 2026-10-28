import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, useCtx, useScopedOpps } from '../../store/StoreProvider.jsx';
import { usd } from '../../domain/format.js';
import { porReasignar } from '../../domain/rules.js';
import ReasignarModal from '../oportunidades/ReasignarModal.jsx';
import { tableroStats } from './tableroStats.js';
import TableroKpis, { Completitud } from './TableroKpis.jsx';
import { EmbudoPronostico, Fila3 } from './TableroCharts.jsx';
import ResponsableTable from './ResponsableTable.jsx';
import TopOpps from './TopOpps.jsx';

/** Aviso de cartera abierta a nombre de ex colaboradores (usa todas las oportunidades, no solo las filtradas). */
function CarteraPorReasignar({ list, onReasignar }) {
  const ctx = useCtx();
  if (!list.length) return null;
  const by = {}; list.forEach(o => { by[o.resp] = (by[o.resp] || 0) + 1; });
  return <div className="actcard warn"><div>
    <b>Cartera por reasignar: {list.length} oportunidades abiertas · {usd(list.reduce((t, o) => t + (o.monto || 0), 0))}</b>
    <span>{Object.entries(by).map(([r, n]) => `${r} · ${ctx.respName(r)} (ex colaborador): ${n}`).join(' · ')}. Siguen a su nombre hasta que se asignen a alguien del equipo.</span>
  </div><button className="btn pri" type="button" onClick={onReasignar}>Reasignar ahora</button></div>;
}

export default function TableroPage() {
  const { state } = useStore(), ctx = useCtx(), O = useScopedOpps(), nav = useNavigate();
  const [rea, setRea] = useState(false);
  const s = useMemo(() => tableroStats(O, ctx, state.solicitudes), [O, ctx, state.solicitudes]);
  const PR = useMemo(() => porReasignar(state.opps, ctx), [state.opps, ctx]);
  const onIssue = alerta => nav('/oportunidades', { state: { etapa: 'ACTIVAS', alerta } });
  return <>
    <CarteraPorReasignar list={PR} onReasignar={() => setRea(true)} />
    <TableroKpis s={s} onIssue={onIssue} />
    <Completitud rows={s.compl} total={s.act.length} onIssue={onIssue} />
    <EmbudoPronostico s={s} />
    <ResponsableTable rows={s.resp} />
    <Fila3 s={s} />
    <TopOpps list={s.top} />
    {rea && <ReasignarModal list={PR} onClose={() => setRea(false)} />}
  </>;
}
