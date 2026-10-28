import { NavLink } from 'react-router-dom';
import { NAV } from '../../app/routes.js';
import { useStore, useCtx, useScopedOpps } from '../../store/StoreProvider.jsx';
import { alerts } from '../../domain/rules.js';
import { solAlerts } from '../../domain/ingenieria.js';
import { APP } from '../../domain/constants.js';
import { fd } from '../../domain/format.js';

export default function Sidebar() {
  const { state, info } = useStore(); const ctx = useCtx(); const ops = useScopedOpps();
  const venc = ops.filter(o => alerts(o, ctx).some(a => ['accionVencida', 'sinAccion', 'standbyVencido'].includes(a[2]))).length;
  const casosA = state.solicitudes.filter(s => s.estado === 'Abierta');
  const casosC = casosA.filter(s => solAlerts(s, ctx.params).some(a => a[0] === 'crit')).length;
  const badge = k => ({
    opps: <span className="badge">{ops.length}</span>,
    vencidas: venc ? <span className="badge crit">{venc}</span> : null,
    casos: casosA.length ? <span className={`badge ${casosC ? 'crit' : ''}`}>{casosA.length}</span> : null,
    clientes: <span className="badge">{state.clientes.length}</span>,
    contactos: <span className="badge">{state.contacts.length}</span>,
  })[k];
  return <aside className="side">
    <div className="brand"><b>VOYANT</b><span>Gestión comercial</span></div>
    <nav className="nav" aria-label="Módulos">{NAV.map(g => <div key={g.grupo} style={{ display: 'contents' }}>
      <div className="grp">{g.grupo}</div>
      {g.items.map(i => <NavLink key={i.to} to={i.to}><span>{i.label}</span>{i.badge && badge(i.badge)}</NavLink>)}</div>)}</nav>
    <div className="foot">
      <div>{info.error ? <span style={{ color: 'var(--crit)' }}>{info.error}</span> : <>Guardado en este navegador{info.guardado ? ' · ' + new Date(info.guardado).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : ''}</>}</div>
      <div>Versión {APP.version} · {fd(APP.fecha)} · React</div>
    </div>
  </aside>;
}
