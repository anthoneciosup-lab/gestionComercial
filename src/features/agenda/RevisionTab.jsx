import { useMemo, useState } from 'react';
import { useCtx, useUi, useScopedOpps } from '../../store/StoreProvider.jsx';
import { hoyISO, diffDays } from '../../domain/format.js';
import { isActive, forecastTexts } from '../../domain/rules.js';
import { DESLICES } from '../../domain/constants.js';
import { Empty } from '../../components/ui/index.js';
import StandbyModal from '../oportunidades/StandbyModal.jsx';
import RevisionCard from './RevisionCard.jsx';

/** Revisada esta semana = revisión registrada en los últimos 7 días. */
const revisada = o => o.revision?.f && diffDays(hoyISO(), o.revision.f) < 7;

/** Revisión semanal (Hoja3 del Excel): las cuatro preguntas por cada oportunidad activa. */
export default function RevisionTab() {
  const ctx = useCtx(), { ui } = useUi(), all = useScopedOpps();
  const [resp, setResp] = useState(ui.resp || '');
  const [sb, setSb] = useState(null);
  const activas = useMemo(() => all.filter(isActive), [all]);
  const resps = useMemo(() => [...new Set(activas.map(o => o.resp))].filter(Boolean).sort(), [activas]);
  const O = useMemo(() => activas.filter(o => !resp || o.resp === resp).sort((a, b) => (b.monto || 0) - (a.monto || 0)), [activas, resp]);
  const hechas = O.filter(revisada).length;
  const FC = forecastTexts(ctx.params);
  return <>
    <div className="banner"><span><b>Pronóstico</b>: qué tan seguro es que la oportunidad cierre <b>dentro del periodo</b> que se revisa (mes o trimestre). Es distinto de la etapa, que dice en qué paso del proceso está. Se decide por lo que hizo el comprador, no por intuición.</span></div>
    <div className="legend-fc">{Object.entries(FC).map(([k, v]) => <div key={k}><b>{k === 'Best' ? 'Best case' : k}</b>{v}</div>)}</div>
    <div className="toolbar">
      <select value={resp} onChange={e => setResp(e.target.value)} aria-label="Responsable"><option value="">Todo el equipo</option>
        {resps.map(x => <option key={x} value={x}>{x} · {ctx.respName(x)}</option>)}</select>
      <span className="muted" style={{ fontSize: 12.5 }}>Motivos de desfase a vigilar: {DESLICES.join(' · ')}</span>
      <span className="count">{O.length} activas · {hechas} revisadas esta semana</span>
    </div>
    {O.length ? O.map(o => <RevisionCard key={o.id} o={o} onStandby={setSb} />) : <Empty>No hay oportunidades activas para este filtro.</Empty>}
    {sb && <StandbyModal opp={sb} onClose={() => setSb(null)} />}
  </>;
}
