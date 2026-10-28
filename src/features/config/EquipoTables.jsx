/** Tablas editables del equipo comercial y de los especialistas de ingeniería. */
import { useStore } from '../../store/StoreProvider.jsx';
import { ESPECIALIDADES } from '../../domain/constants.js';
import { abiertasDe, totalDe, casosDe } from './equipoOps.js';

export function EquipoCard({ dr, edit, onDelete, onReasignar }) {
  const { state } = useStore();
  const set = (i, k, v) => edit(d => { d.equipo[i][k] = v; });
  return <div className="card"><h2>Equipo comercial <small>responsables de oportunidades</small></h2>
    <div className="tw" style={{ border: 'none' }}><table><thead><tr><th>Iniciales</th><th>Nombre completo</th><th title="Desmarcar cuando la persona ya no trabaja en la empresa">En la empresa</th><th className="r">Abiertas</th><th className="r">Total</th><th></th></tr></thead>
      <tbody>{dr.equipo.map((p, i) => { const ab = p._orig ? abiertasDe(p._orig, state.opps).length : 0;
        return <tr key={i}>
          <td><input type="text" value={p.ini} maxLength={4} style={{ width: 64 }} aria-label="Iniciales" onChange={e => set(i, 'ini', e.target.value.trim().toUpperCase())} /></td>
          <td><input type="text" value={p.nombre} aria-label={`Nombre de ${p.ini}`} onChange={e => set(i, 'nombre', e.target.value)} />
            {!p.activo && <div className="muted" style={{ fontSize: 11.5 }}>ex colaborador</div>}</td>
          <td><input type="checkbox" checked={!!p.activo} aria-label="En la empresa" onChange={e => set(i, 'activo', e.target.checked)} /></td>
          <td className="r num">{ab}{!p.activo && ab > 0 && <> <button className="flag warn" type="button" onClick={() => onReasignar(p._orig)}>por reasignar</button></>}</td>
          <td className="r num">{p._orig ? totalDe(p._orig, state.opps) : 0}</td>
          <td><button className="btn sm danger" type="button" onClick={() => onDelete(i)}>Eliminar</button></td>
        </tr>; })}</tbody></table></div>
    <div className="toolbar" style={{ marginTop: 8 }}><button className="btn sm" type="button" onClick={() => edit(d => d.equipo.push({ ini: '', nombre: '', activo: true }))}>+ Persona</button></div>
    <p className="muted" style={{ fontSize: 12.5 }}>Todo es editable: iniciales, nombre y estado. Si cambias las iniciales de alguien con oportunidades, el sistema las actualiza en todas sus oportunidades (y en los casos técnicos que solicitó) al guardar. Desmarca <b>En la empresa</b> cuando alguien se va: pasa a ex colaborador, sale de los menús y sus oportunidades abiertas quedan <b>por reasignar</b>. <b>Eliminar</b> la quita del equipo; si tiene oportunidades abiertas, primero pide a quién reasignarlas. Su nombre se conserva en el historial.</p>
  </div>;
}

export function EspecialistasCard({ dr, edit, onDelete, onCoord }) {
  const { state } = useStore();
  const set = (i, k, v) => edit(d => { d.especialistas[i][k] = v; });
  const act = (state.config.especialistas || []).filter(x => x.activo);
  const coord = state.config.coordinadorDefault || 'Hernán Olguín';
  return <div className="card"><h2>Especialistas de ingeniería</h2>
    <div className="tw" style={{ border: 'none' }}><table><thead><tr><th>Nombre</th><th>Especialidades</th><th>Activo</th><th className="r" title="Casos técnicos abiertos donde es especialista o coordinador">Abiertas</th><th></th></tr></thead>
      <tbody>{dr.especialistas.map((p, i) => <tr key={i}>
        <td><input type="text" value={p.nombre} aria-label="Nombre del especialista" onChange={e => set(i, 'nombre', e.target.value)} /></td>
        <td className="muted" style={{ fontSize: 12.5 }} title={ESPECIALIDADES.join(', ')}>Todas ({ESPECIALIDADES.length})</td>
        <td><input type="checkbox" checked={!!p.activo} aria-label="Activo" onChange={e => set(i, 'activo', e.target.checked)} /></td>
        <td className="r num">{p._orig ? casosDe(p._orig, state.solicitudes).length : 0}</td>
        <td><button className="btn sm danger" type="button" onClick={() => onDelete(i)}>Eliminar</button></td>
      </tr>)}</tbody></table></div>
    <div className="toolbar" style={{ marginTop: 8 }}><button className="btn sm" type="button" onClick={() => edit(d => d.especialistas.push({ nombre: '', activo: true }))}>+ Especialista</button></div>
    <label className="f" style={{ maxWidth: 340 }}>Coordinador técnico por defecto <small className="muted">(se propone en cada caso técnico; se puede cambiar)</small>
      <select value={coord} onChange={e => onCoord(e.target.value)}>
        {act.map(x => <option key={x.nombre}>{x.nombre}</option>)}
        {!act.some(x => x.nombre === coord) && <option>{coord}</option>}
      </select></label>
    <p className="muted" style={{ fontSize: 12.5 }}>Acuerdo del 23/10: <b>todos los especialistas atienden todas las especialidades</b> ({ESPECIALIDADES.join(', ')}), así que aparecen en todos los menús. Un cambio de nombre se aplica también a los casos técnicos donde figura.</p>
  </div>;
}
