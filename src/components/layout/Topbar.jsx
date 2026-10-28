import { useStore, useUi } from '../../store/StoreProvider.jsx';
import { PAISES } from '../../domain/constants.js';
/** Título del módulo, filtros globales (solo en módulos comerciales) y botón principal contextual. */
export default function Topbar({ page, onNew }) {
  const { state } = useStore(); const { ui, set } = useUi();
  const resp = state.config.equipo.filter(p => p.activo || state.opps.some(o => o.resp === p.ini && o.etapa !== 'CERRADA GANADA' && o.etapa !== 'CERRADA PERDIDA'));
  const label = { caso: '+ Nuevo caso técnico', cliente: '+ Nueva empresa', contacto: '+ Nuevo contacto' }[page.nuevo] || '+ Nueva oportunidad';
  return <div className="topbar">
    <div><h1>{page.title}</h1><div className="sub">{page.sub}</div></div>
    <div className="gfilters">
      {page.filtros && <>
        <select aria-label="Responsable" value={ui.resp} onChange={e => set('resp', e.target.value)}>
          <option value="">Todo el equipo</option>{resp.map(p => <option key={p.ini} value={p.ini}>{p.ini} · {p.nombre}{p.activo ? '' : ' (ex colaborador)'}</option>)}</select>
        <select aria-label="País" value={ui.pais} onChange={e => set('pais', e.target.value)}>
          <option value="">Todos los países</option>{Object.values(PAISES).map(p => <option key={p}>{p}</option>)}</select></>}
      {page.key !== 'guia' && page.key !== 'config' && page.key !== 'analisis' && <button className="btn pri" type="button" id="btnNew" onClick={() => onNew(page.nuevo || 'opp')}>{label}</button>}
    </div>
  </div>;
}
