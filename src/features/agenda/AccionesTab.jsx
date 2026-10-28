import { useMemo, useState } from 'react';
import { useCtx, useScopedOpps } from '../../store/StoreProvider.jsx';
import { useDrawer } from '../../app/useDrawer.js';
import { usd } from '../../domain/format.js';
import { cliName } from '../../domain/rules.js';
import { Card, DateCell, EtapaPill, Empty } from '../../components/ui/index.js';
import StandbyModal from '../oportunidades/StandbyModal.jsx';
import ActionModal from './ActionModal.jsx';
import ReactivateModal from '../oportunidades/ReactivarModal.jsx';
import { agendaGroups } from './agendaGroups.js';

const stop = fn => e => { e.stopPropagation(); fn(); };
const OppCell = ({ o }) => { const ctx = useCtx(); return <td className="ref"><div className="t">{cliName(o, ctx)}</div><div className="c">{o.numero || o.id} · {o.ref}</div></td>; };

function Grupo({ title, list, empty, note, onAction }) {
  const d = useDrawer();
  return <Card title={title} sub={`${list.length}${note ? ' · ' + note : ''}`}>{list.length
    ? <div className="tw" style={{ border: 'none' }}><table>
      <thead><tr><th>Fecha</th><th>Acción</th><th>Oportunidad</th><th>Resp.</th><th>Etapa</th><th className="r">Monto</th><th></th></tr></thead>
      <tbody>{list.map(o => <tr key={o.id} className="click" onClick={() => d.open('opp', o.id)}>
        <td><DateCell iso={o.fProxAccion} /></td><td style={{ minWidth: 180 }}><b>{o.proxAccion || '—'}</b></td>
        <OppCell o={o} /><td>{o.resp}</td><td><EtapaPill o={o} /></td><td className="r num">{usd(o.monto)}</td>
        <td><button className="btn sm pri" type="button" onClick={stop(() => onAction(o))}>{o.proxAccion ? 'Registrar resultado' : 'Definir acción'}</button></td>
      </tr>)}</tbody></table></div>
    : <Empty>{empty}</Empty>}</Card>;
}

function StandbyGrupo({ list, onReact, onPosponer }) {
  const d = useDrawer();
  return <Card title="Standby por revisar" sub={`${list.length} · revisión vencida, sin fecha o en los próximos 7 días`}>{list.length
    ? <div className="tw" style={{ border: 'none' }}><table>
      <thead><tr><th>Revisar</th><th>Motivo</th><th>Oportunidad</th><th>Resp.</th><th className="r">Monto</th><th></th></tr></thead>
      <tbody>{list.map(o => <tr key={o.id} className="click" onClick={() => d.open('opp', o.id)}>
        <td>{o.standby.fRevision ? <DateCell iso={o.standby.fRevision} /> : <span className="flag warn">Sin fecha</span>}</td>
        <td>{o.standby.motivo}</td><OppCell o={o} /><td>{o.resp}</td><td className="r num">{usd(o.monto)}</td>
        <td style={{ whiteSpace: 'nowrap' }}><button className="btn sm pri" type="button" onClick={stop(() => onReact(o))}>Reactivar</button>{' '}
          <button className="btn sm" type="button" onClick={stop(() => onPosponer(o))}>Posponer</button></td>
      </tr>)}</tbody></table></div>
    : <Empty>Nada en standby por revisar.</Empty>}</Card>;
}

/** Próximas acciones agrupadas por urgencia, con acciones rápidas. */
export default function AccionesTab() {
  const O = useScopedOpps();
  const g = useMemo(() => agendaGroups(O), [O]);
  const [m, setM] = useState(null); // {k:'accion'|'react'|'standby', o}
  const close = () => setM(null);
  const onAction = o => setM({ k: 'accion', o });
  return <>
    <div className="banner">Regla: toda oportunidad activa tiene <b>una</b> próxima acción redactada (qué, con quién, para qué), con fecha y responsable. Al completarla se registra el resultado en la bitácora y se define la siguiente.</div>
    <Grupo title="Vencidas" list={g.v} empty="Nada vencido." onAction={onAction} />
    <Grupo title="Hoy" list={g.hoy} empty="Nada programado para hoy." onAction={onAction} />
    <Grupo title="Próximos 7 días" list={g.s} empty="Nada programado esta semana." onAction={onAction} />
    <Grupo title="Sin próxima acción" list={g.n} empty="Todas las oportunidades activas tienen acción." note="definir hoy" onAction={onAction} />
    <Grupo title="Acción sin fecha" list={g.sf} empty="Todas las acciones tienen fecha." onAction={onAction} />
    <Grupo title="Más adelante" list={g.p} empty="Nada programado." onAction={onAction} />
    <StandbyGrupo list={g.stb} onReact={o => setM({ k: 'react', o })} onPosponer={o => setM({ k: 'standby', o })} />
    {m?.k === 'accion' && <ActionModal opp={m.o} onClose={close} />}
    {m?.k === 'react' && <ReactivateModal opp={m.o} onClose={close} />}
    {m?.k === 'standby' && <StandbyModal opp={m.o} onClose={close} />}
  </>;
}
