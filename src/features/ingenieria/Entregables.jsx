import { ENTREGABLES } from '../../domain/constants.js';
import { fd, hoyISO } from '../../domain/format.js';

const ORDEN = [['pend', 'Pendiente'], ['ok', 'Listo'], ['na', 'N/A']];

/** Nuevo valor de un entregable al pulsar un estado. */
export const entValue = st => (st === 'pend' ? { st: 'pend' } : { st, f: hoyISO() });

/** Lista de entregables con botones Pendiente / Listo / N/A. */
export default function Entregables({ ent = {}, onSet, disabled, order = ORDEN, showDate = true }) {
  return <div className="ents">{ENTREGABLES.map(([k, l]) => {
    const v = ent[k] || {}, st = v.st || 'pend';
    return <div key={k} className={`ent ${st}`}><span>{l}</span>
      <span className="seg3" role="group" aria-label={l}>{order.map(([x, t]) =>
        <button key={x} type="button" aria-pressed={st === x} disabled={disabled} onClick={() => onSet(k, x)}>{t}</button>)}</span>
      {showDate && st === 'ok' && v.f && <span className="muted" style={{ fontSize: 11 }}>{fd(v.f)}</span>}
    </div>;
  })}</div>;
}
