import { useState } from 'react';
import { useStore, useCtx } from '../../store/StoreProvider.jsx';
import { CumplChip, useToast } from '../../components/ui/index.js';
import { fd } from '../../domain/format.js';
import { espCumpl, espFinal, espRubro } from '../../domain/ingenieria.js';
import { espLabel, fijarComp } from './casoUtils.js';

const stop = ev => ev.stopPropagation();

/** Fecha comprometida rápida: fecha + “Fijar” (la compromete el coordinador del caso). */
function QuickFix({ s, i }) {
  const { actions } = useStore(); const ctx = useCtx(); const toast = useToast();
  const [v, setV] = useState('');
  const fijar = () => { try { fijarComp(actions, s, i, v, s.coordinador || ctx.coordDef); toast('Guardado'); } catch (e) { toast(e.message); } };
  return <span className="qfix" onClick={stop}>
    <input type="date" aria-label="Fecha comprometida" value={v} onChange={e => setV(e.target.value)} />
    <button className="btn sm" type="button" onClick={fijar}>Fijar</button></span>;
}

function DateRow({ r, tit, onOpen, onRev, onEnt }) {
  const ctx = useCtx();
  const { s, e, i } = r, open = s.estado === 'Abierta', fin = espFinal(e), c = espCumpl(e, open, ctx.params), nrev = (e.revisiones || []).length;
  return <tr className="click" onClick={() => onOpen(s.id)}>
    <td><span className="mono">{s.id}</span><div className="muted" style={{ fontSize: 11.5, maxWidth: 190 }}>{tit(s)}</div></td>
    <td><b>{espLabel(e.esp)}</b>{espRubro(e) && <div className="muted" style={{ fontSize: 11.5 }}>{espRubro(e)}</div>}
      <div style={{ fontSize: 12 }}>{e.especialista || <span className="flag crit">Sin especialista</span>}</div></td>
    <td className="num muted">{fd(s.fRequeridaSolucion)}</td>
    <td className="num nb">{e.fComprometida ? <><b>{fd(e.fComprometida)}</b><div className="muted" style={{ fontSize: 11 }}>{e.compPor || ''}</div></>
      : open ? <QuickFix s={s} i={i} /> : <span className="muted">—</span>}</td>
    <td className="num nb">{e.fRevisada ? <b>{fd(e.fRevisada)}</b> : <span className="muted">—</span>}{' '}
      {nrev > 0 && <span className="cnt" title="Veces que cambió la fecha comprometida">{nrev}×</span>}
      {open && e.fComprometida && !fin && <div><button className="btn xs" type="button" onClick={ev => { stop(ev); onRev(s.id, i); }}>Revisar</button></div>}</td>
    <td className="num nb">{fin ? <b>{fd(fin)}</b> : open ? <button className="btn xs pri" type="button" onClick={ev => { stop(ev); onEnt(s.id, i); }}>Registrar entrega</button> : <span className="muted">—</span>}</td>
    <td><CumplChip c={c} /></td>
  </tr>;
}

/** Tabla de las tres fechas por especialidad, con acciones rápidas. */
export default function DatesTable({ rows, tit, onOpen, onRev, onEnt }) {
  if (!rows.length) return <div className="empty">No hay especialidades con estos filtros.</div>;
  return <>
    <div className="tw"><table className="tdates"><thead><tr><th>Caso</th><th>Especialidad · especialista</th><th title="Fecha que necesita comercial para la oferta">Requerida</th>
      <th>1 · Comprometida</th><th>2 · Revisada</th><th>3 · Entrega final</th><th>Cumplimiento</th></tr></thead>
      <tbody>{rows.map(r => <DateRow key={`${r.s.id}|${r.i}`} r={r} tit={tit} onOpen={onOpen} onRev={onRev} onEnt={onEnt} />)}</tbody></table></div>
    <p className="muted" style={{ fontSize: 12 }}>Fija la fecha comprometida, revisa o registra la entrega directamente en la tabla. Pulsa una fila para abrir el caso completo (etapas, entregables e historial).</p>
  </>;
}
