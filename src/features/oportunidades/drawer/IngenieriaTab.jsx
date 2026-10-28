/** Pestaña Ingeniería: casos técnicos de la oportunidad con las tres fechas por especialidad. */
import { useDrawer } from '../../../app/useDrawer.js';
import { fd } from '../../../domain/format.js';
import { espCorto, espCumpl, espFinal, solAlerts, solEtapa } from '../../../domain/ingenieria.js';
import { CumplChip, Empty, Flags } from '../../../components/ui/index.js';

export default function IngenieriaTab({ sols, ctx, onNuevo }) {
  const d = useDrawer();
  return <>
    <div className="banner">
      <span>Cada caso técnico controla, por especialidad, la fecha comprometida, la revisada y la entrega final. El detalle completo está en <b>Ingeniería → Casos técnicos</b>.</span>
      <button className="btn sm pri" type="button" onClick={onNuevo}>+ Nuevo caso técnico</button>
    </div>
    {sols.length ? sols.map(s => <div key={s.id} className="card click" style={{ cursor: 'pointer' }} onClick={() => d.open('caso', s.id)}
      role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') d.open('caso', s.id); }}>
      <h2>{s.id} · {solEtapa(s)} <small>{s.estado} · solicitada {fd(s.fSolicitud)}</small></h2>
      <div style={{ fontSize: 13, marginBottom: 8 }}>{s.alcance}</div>
      <div className="espgrid">{(s.esp || []).map((e, i) => <div key={e.id || i} className="espmini">
        <b>{espCorto(e.esp)}</b>
        <span>{e.especialista || 'Sin asignar'} · {e.etapa}</span>
        <span className="muted">Comprometida {fd(e.fComprometida)} · Revisada {fd(e.fRevisada)}{(e.revisiones || []).length ? ` (${e.revisiones.length}×)` : ''} · Final {fd(espFinal(e))}</span>
        <CumplChip c={espCumpl(e, s.estado === 'Abierta', ctx.params)} />
      </div>)}</div>
      <Flags items={solAlerts(s, ctx.params)} max={4} />
    </div>) : <Empty>Esta oportunidad aún no tiene casos técnicos.</Empty>}
  </>;
}
