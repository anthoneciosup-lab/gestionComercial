/** Reasignación masiva (De → A) y tabla de oportunidades por reasignar (personas inactivas o eliminadas). */
import { useState } from 'react';
import { useStore, useCtx } from '../../store/StoreProvider.jsx';
import { useDrawer } from '../../app/useDrawer.js';
import { RespSelect, EtapaPill, useToast } from '../../components/ui/index.js';
import { porReasignar } from '../../domain/rules.js';
import { usd } from '../../domain/format.js';
import { CliCell } from '../oportunidades/shared.jsx';
import { abiertasDe } from './equipoOps.js';

export function ReasignarTodasCard() {
  const { state, actions } = useStore(); const ctx = useCtx(); const toast = useToast();
  const eq = state.config.equipo || [];
  const [from, setFrom] = useState(eq[0]?.ini || ''); const [to, setTo] = useState(''); const [msg, setMsg] = useState('');
  const go = () => {
    setMsg('');
    if (!to || from === to) return toast('Elige una persona activa distinta.');
    const L = abiertasDe(from, state.opps); if (!L.length) return toast('No hay oportunidades abiertas para reasignar.');
    L.forEach(o => actions.updateOpp(o.id, { resp: to }, { t: `Reasignada de ${from} (${ctx.respName(from)}) a ${to} (${ctx.respName(to)}).`, a: to }));
    setMsg(`Listo: ${L.length} oportunidades reasignadas a ${ctx.respName(to)}.`);
  };
  return <div className="card"><h2>Reasignar oportunidades abiertas</h2>
    <div className="toolbar">
      <label className="f">De<select value={from} onChange={e => setFrom(e.target.value)}>{eq.map(p =>
        <option key={p.ini} value={p.ini}>{p.ini} · {p.nombre}{p.activo ? '' : ' (ex colaborador)'} · {abiertasDe(p.ini, state.opps).length} abiertas</option>)}</select></label>
      <label className="f">A<RespSelect value={to} onChange={setTo} blank="Elegir…" /></label>
      <button className="btn" type="button" style={{ alignSelf: 'flex-end' }} onClick={go}>Reasignar todas</button>
    </div>
    <p className="muted" style={{ fontSize: 12.5 }}>Mueve todas las oportunidades activas y en standby de una persona a otra. Cada cambio queda en la bitácora de la oportunidad.</p>
    {msg && <div className="banner good">{msg}</div>}
  </div>;
}

export function PorReasignarCard() {
  const { state, actions } = useStore(); const ctx = useCtx(); const d = useDrawer(); const toast = useToast();
  const [sel, setSel] = useState({});
  const L = porReasignar(state.opps, ctx);
  const go = o => {
    const to = sel[o.id]; if (!to) return toast('Elige a quién se reasigna.');
    actions.updateOpp(o.id, { resp: to }, { t: `Reasignada de ${o.resp} (${ctx.respName(o.resp)}) a ${to} (${ctx.respName(to)}).`, a: to });
    toast(`${o.numero || o.id} reasignada a ${ctx.respName(to)}`);
  };
  const stop = e => e.stopPropagation();
  return <div className="card"><h2>Oportunidades por reasignar <small>{L.length} abiertas a nombre de personas inactivas o eliminadas</small></h2>
    {L.length ? <>
      <p className="muted" style={{ fontSize: 12.5, margin: '0 0 8px' }}>Quedan con su responsable actual hasta que se decida a quién corresponden. Elige la persona en cada fila y pulsa Reasignar.</p>
      <div className="tw" style={{ border: 'none' }}><table><thead><tr><th>N°</th><th>Oportunidad</th><th>Estado</th><th className="r">Monto</th><th>Actual</th><th>Reasignar a</th><th></th></tr></thead>
        <tbody>{L.map(o => <tr key={o.id} className="click" onClick={() => d.open('opp', o.id)}>
          <td className="mono">{o.numero || o.id}</td><td className="ref"><CliCell o={o} ctx={ctx} /></td><td><EtapaPill o={o} /></td>
          <td className="r num">{usd(o.monto)}</td><td>{o.resp} · {ctx.respName(o.resp)}</td>
          <td onClick={stop}><RespSelect value={sel[o.id] || ''} onChange={v => setSel(s => ({ ...s, [o.id]: v }))} blank="Elegir…" aria-label={`Nuevo responsable de ${o.numero || o.id}`} /></td>
          <td onClick={stop}><button className="btn sm pri" type="button" onClick={() => go(o)}>Reasignar</button></td>
        </tr>)}</tbody></table></div>
    </> : <div className="empty">No hay oportunidades abiertas a nombre de personas inactivas.</div>}
  </div>;
}
