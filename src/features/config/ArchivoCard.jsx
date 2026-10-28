/** Personas eliminadas (se conservan para el historial y se pueden restaurar). */
import { useStore } from '../../store/StoreProvider.jsx';
import { fd } from '../../domain/format.js';
import { totalDe } from './equipoOps.js';

export default function ArchivoCard({ archivo, onRestaurar }) {
  const { state } = useStore();
  const eq = archivo.equipo || [], es = archivo.especialistas || [];
  if (!eq.length && !es.length) return null;
  return <div className="card"><h2>Personas eliminadas <small>se conservan para el historial</small></h2>
    <div className="tw" style={{ border: 'none' }}><table><tbody>
      {eq.map((p, i) => <tr key={'e' + p.ini}>
        <td><b>{p.ini}</b> · {p.nombre}</td>
        <td className="muted">Equipo comercial · eliminada el {fd(p.eliminado)} · {totalDe(p.ini, state.opps)} oportunidades en el historial</td>
        <td><button className="btn sm" type="button" onClick={() => onRestaurar('equipo', i)}>Restaurar</button></td></tr>)}
      {es.map((p, i) => <tr key={'s' + p.nombre}>
        <td><b>{p.nombre}</b></td><td className="muted">Especialista · eliminado el {fd(p.eliminado)}</td>
        <td><button className="btn sm" type="button" onClick={() => onRestaurar('esp', i)}>Restaurar</button></td></tr>)}
    </tbody></table></div>
    <p className="muted" style={{ fontSize: 12.5 }}>Al restaurar, una persona del equipo vuelve como ex colaborador (desmárcala o márcala en “En la empresa”); un especialista vuelve activo.</p>
  </div>;
}
