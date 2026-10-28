import { usd, pct } from '../../domain/format.js';
import { KpiGrid, Kpi, Tag } from '../../components/ui/index.js';
import { sum } from './tableroStats.js';

const GLink = ({ onClick, children }) => <button className="glink" type="button" onClick={onClick}>{children}</button>;

/** Secciones “Montos registrados” (dato real) y “Estimaciones del sistema” (cálculo). */
export default function TableroKpis({ s, onIssue }) {
  return <>
    <section className="dsec"><header><h2>Montos registrados</h2><Tag kind="real">Dato real · monto en USD registrado en el Excel o en el sistema</Tag></header>
      <KpiGrid cols={5}>
        <Kpi label="Pipeline activo" value={usd(s.pip)} detail={<>suma de {s.conM.length} de {s.act.length} activas con monto{s.sinM > 0 && <> · <GLink onClick={() => onIssue('sinMonto')}>{s.sinM} sin monto</GLink></>}</>} />
        <Kpi label="Ganado" value={usd(sum(s.won))} detail={`${s.won.length} oportunidades ganadas (monto de la oferta adjudicada)`} />
        <Kpi label="Perdido" value={usd(sum(s.lost))} detail={`${s.lost.length} oportunidades perdidas`} />
        <Kpi label="Tasa de cierre" value={pct(s.wrN)} detail={`${s.won.length} de ${s.won.length + s.lost.length} cerradas · ${pct(s.wr$)} en monto`} />
        <Kpi label="En standby" value={s.stb.length} detail={`${usd(sum(s.stb))} fuera del pipeline`} />
      </KpiGrid></section>
    <section className="dsec"><header><h2>Estimaciones del sistema</h2><Tag kind="est">Cálculo · no es un monto registrado</Tag></header>
      <KpiGrid cols={4}>
        <Kpi label="Pipeline ponderado" value={usd(s.pond)} detail={<>monto × probabilidad de {s.conP.length} activas{s.sinP > 0 && <> · <GLink onClick={() => onIssue('sinProb')}>{s.sinP} sin probabilidad</GLink> no suman</>}</>} />
        <Kpi label="Commit" value={usd(s.fcs.Commit)} detail="cierre esperado en el periodo" />
        <Kpi label="Best case" value={usd(s.fcs.Best)} detail="podría cerrar si todo sale bien" />
        <Kpi label="Sin pronóstico" value={s.nSinFc} detail="activas sin probabilidad registrada" />
      </KpiGrid></section>
  </>;
}

/** Completitud de los datos que alimentan el tablero. */
export function Completitud({ rows, total, onIssue }) {
  return <div className="card"><h2>Completitud de los datos del tablero <small>mientras más completo, más confiable</small></h2>
    <div className="compl">{rows.map(c => <button key={c.k} type="button" className="cbar" onClick={() => onIssue(c.k)}>
      <span className="l">{c.l}</span>
      <span className="track"><span style={{ width: Math.round(c.n / Math.max(total, 1) * 100) + '%' }} /></span>
      <span className="num">{c.n} de {total}</span>
      {total - c.n ? <span className="fix">Completar {total - c.n}</span> : <span className="okk">Completo</span>}
    </button>)}</div></div>;
}
