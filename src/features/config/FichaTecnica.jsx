/** Ficha técnica: modelo de datos, reglas de negocio implementadas e historial de versiones. */
import { SCHEMA_DOC, CHANGELOG } from './respaldoData.js';

export function ModeloDatos() {
  return <div className="card"><h2>Modelo de datos</h2>{Object.entries(SCHEMA_DOC).map(([k, v]) => <div key={k}>
    <h3 style={{ fontSize: 14, margin: '14px 0 6px' }}>{v.n} <span className="mono muted" style={{ fontSize: 12 }}>· {k} · {v.key}</span></h3>
    <div className="gtw"><table className="gt"><thead><tr><th>Campo</th><th>Tipo</th><th>Descripción</th></tr></thead>
      <tbody>{v.f.map(x => <tr key={x[0]}><td className="mono" style={{ fontSize: 12 }}>{x[0]}</td><td>{x[1]}</td><td>{x[2]}</td></tr>)}</tbody></table></div>
  </div>)}</div>;
}

const REGLAS = [
  'Una oportunidad activa siempre tiene etapa, próxima acción y fecha; si no se puede ubicar, va a standby con motivo y fecha de revisión.',
  'El standby no suma al pipeline, al ponderado ni al pronóstico.',
  'No se cierra una pérdida sin causa (lista u “Otra” con texto) y lección.',
  'Oportunidades y contactos solo se vinculan a empresas de la lista de clientes; nombre y RUC/RUT no se repiten.',
  'Las personas inactivas no aparecen en los menús; sus oportunidades quedan marcadas “Por reasignar”.',
  'Ingeniería: no se entrega la solución con entregables pendientes ni sin especialista; la fecha comprometida solo se corrige el mismo día; consultas alertadas con la anticipación definida en Parámetros.',
  'No se borran oportunidades: se cierran con causa, para no perder información.',
];
export function Reglas() {
  return <div className="card"><h2>Reglas de negocio implementadas</h2>
    <ul style={{ fontSize: 13, margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>{REGLAS.map(r => <li key={r}>{r}</li>)}</ul></div>;
}

export function Historial() {
  return <div className="card"><h2>Historial de versiones</h2><div className="gtw"><table className="gt"><thead><tr><th>Versión</th><th>Fecha</th><th>Cambios</th></tr></thead>
    <tbody>{CHANGELOG.map(c => <tr key={c[0]}><td className="mono" style={{ whiteSpace: 'nowrap' }}>{c[0]}</td><td>{c[1]}</td><td>{c[2]}</td></tr>)}</tbody></table></div></div>;
}
