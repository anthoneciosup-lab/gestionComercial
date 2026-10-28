/** Piezas visuales pequeñas reutilizables en todos los módulos. */
import { fd, diffDays, hoyISO, pct } from '../../domain/format.js';
import { stageKey, stageLabel, isStandby, forecastOf, forecastTexts } from '../../domain/rules.js';
import { etLabel } from '../../domain/format.js';

export const stageColor = { PROSPECTO: 'var(--s1)', 'CALIFICACIÓN': 'var(--s2)', PROPUESTA: 'var(--s3)', CIERRE: 'var(--s4)', GANADA: 'var(--good)', PERDIDA: 'var(--crit)', STANDBY: 'var(--s0)', SIN: 'var(--s0)' };

export function KpiGrid({ cols, children }) { return <div className={`kpis ${cols ? 'k' + cols : ''}`}>{children}</div>; }
export function Kpi({ label, value, detail, tone }) {
  return <div className={`kpi ${tone === 'crit' ? 'alert' : ''}`}><span className="l">{label}</span><span className="v">{value}</span>{detail != null && <span className="d">{detail}</span>}</div>;
}
/** Tarjeta de indicador que filtra al pulsarla. */
export function Stat({ label, value, detail, tone, active, onClick }) {
  return <button type="button" className={`stat ${tone || ''} ${active ? 'on' : ''}`} onClick={onClick}><span className="l">{label}</span><span className="v">{value}</span><span className="d">{detail}</span></button>;
}
export function Card({ title, sub, children, className = '', onClick }) {
  return <div className={`card ${onClick ? 'click' : ''} ${className}`} onClick={onClick}>{title && <h2>{title}{sub && <small> {sub}</small>}</h2>}{children}</div>;
}
export const Tag = ({ kind = 'real', children }) => <span className={`tag ${kind}`}>{children}</span>;
export function EtapaPill({ o }) {
  return <span className={`pill st-${stageKey(o)}`}><span className="dot" />{stageLabel(o)}{isStandby(o) && o.etapa && <span style={{ fontWeight: 400 }}> · era {etLabel(o.etapa)}</span>}</span>;
}
export function ForecastChip({ o, params }) {
  const f = forecastOf(o, params); if (!f) return null;
  return <span className={`fc ${f}`} title={forecastTexts(params)[f]}>{f === 'Best' ? 'Best case' : f}</span>;
}
export function DateCell({ iso }) {
  if (!iso) return <span className="muted">—</span>;
  const d = diffDays(iso, hoyISO());
  return <span className={`date ${d < 0 ? 'over' : d <= 7 ? 'soon' : ''}`}>{fd(iso)}</span>;
}
/** Alertas [nivel, texto, clave] */
export function Flags({ items, max = 3 }) {
  return <div className="flags">{items.slice(0, max).map(x => <span key={x[2] + x[1]} className={`flag ${x[0]}`}>{x[1]}</span>)}{items.length > max && <span className="flag warn">+{items.length - max}</span>}</div>;
}
export const Progress = ({ value }) => <span className="prog" title={pct(value)}><span style={{ width: Math.round((value || 0) * 100) + '%' }} /></span>;
export const CumplChip = ({ c }) => <span className={`cchip ${c.c}`}>{c.t}</span>;
export function Empty({ children }) { return <div className="empty">{children}</div>; }
/** Barras horizontales. rows: [{label, v, txt (texto o JSX), color?, title?, onClick?}] */
export function BarRows({ rows, max, color }) {
  const m = max || Math.max(1, ...rows.map(r => r.v || 0));
  return <div className="bars">{rows.map(r =>
    <div key={r.label} className="bar" data-go={r.onClick ? '1' : undefined} title={r.title} onClick={r.onClick} role={r.onClick ? 'button' : undefined}>
      <span className="lbl">{r.label}</span>
      <span className="track"><span className="fill" style={{ display: 'block', width: `${m ? Math.max(0.5, (r.v || 0) / m * 100) : 0}%`, background: r.color || (color ? color(r) : 'var(--accent)') }} /></span>
      <span className="val">{r.txt}</span></div>)}</div>;
}
