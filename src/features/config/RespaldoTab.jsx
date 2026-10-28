/** Configuración → Respaldo e integración: integridad, respaldo JSON, importación, CSV, almacenamiento y ficha técnica. */
import { useMemo } from 'react';
import { useStore, useCtx } from '../../store/StoreProvider.jsx';
import { KpiGrid, Kpi, useToast } from '../../components/ui/index.js';
import { APP } from '../../domain/constants.js';
import { hoyISO } from '../../domain/format.js';
import { downloadText } from '../../domain/csv.js';
import { STORAGE_KEY, sizeKb } from '../../store/storage.js';
import { integrityReport, oppsCsv, clientesCsv } from './respaldoData.js';
import { ImportarRespaldo, RestablecerBase } from './ImportarRespaldo.jsx';
import { ModeloDatos, Reglas, Historial } from './FichaTecnica.jsx';

const CSV = 'text/csv;charset=utf-8';
const fh = iso => (iso ? new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '—');

function Integridad({ state }) {
  const ir = useMemo(() => integrityReport(state), [state]);
  return <div className="card"><h2>Integridad de los datos <small>se calcula en vivo</small></h2>
    {ir.map(x => <div key={x.t} className="issue" style={{ cursor: 'default', marginBottom: 6 }}><span>{x.t}</span>
      <b style={{ color: x.ok ? 'var(--good)' : 'var(--crit)', fontSize: 14 }}>{x.ok ? 'Correcto' : x.n + ' por revisar'}</b></div>)}</div>;
}

function Respaldo() {
  const { state, actions } = useStore(); const ctx = useCtx(); const toast = useToast();
  const json = () => { downloadText(`VOYANT_respaldo_${hoyISO()}.json`, JSON.stringify({ ...actions.exportData(), version: APP.version }, null, 2), 'application/json'); toast('Respaldo descargado'); };
  return <div className="card"><h2>Respaldo e integración</h2>
    <p style={{ margin: '0 0 10px', fontSize: 13.5 }}>El respaldo completo descarga en un solo archivo JSON todas las colecciones (configuración, clientes, contactos, oportunidades con bitácora y ofertas, y casos técnicos), con la versión y el esquema. Sirve para guardar una copia, pasar los datos a otro computador (con <b>Importar respaldo</b>) o integrarlos con el ERP de la empresa.</p>
    <div className="toolbar">
      <button className="btn pri" type="button" onClick={json}>Descargar respaldo (JSON)</button>
      <ImportarRespaldo />
      <button className="btn" type="button" onClick={() => downloadText(`VOYANT_oportunidades_${hoyISO()}.csv`, oppsCsv(state.opps, ctx), CSV)}>Oportunidades (CSV)</button>
      <button className="btn" type="button" onClick={() => downloadText(`VOYANT_clientes_${hoyISO()}.csv`, clientesCsv(state.clientes), CSV)}>Clientes (CSV)</button>
    </div>
    <ul style={{ fontSize: 13, margin: '10px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <li>Identificadores estables: N° de oportunidad, “cl-…” para empresas, “c001…” para contactos, “SI-AA-NNN” para casos técnicos. No cambian al editar nombres.</li>
      <li>Fechas en formato ISO (AAAA-MM-DD); montos en USD como número; probabilidad entre 0 y 1.</li>
      <li>Las relaciones usan identificadores (clienteId, empresaId, oppId), no nombres.</li>
      <li>Bitácoras e historiales solo agregan entradas, con autor y marca de tiempo.</li>
    </ul></div>;
}

function Almacenamiento() {
  const { info } = useStore();
  return <div className="card"><h2>Dónde se guardan los datos</h2>
    <dl className="kv">
      <dt>Almacenamiento</dt><dd>localStorage de <b>este navegador</b>, en este computador. Otra persona u otro navegador no ven estos datos.</dd>
      <dt>Clave</dt><dd className="mono">{STORAGE_KEY}</dd>
      <dt>Tamaño</dt><dd>{sizeKb()} KB <span className="muted">(el navegador suele permitir unos 5 MB)</span></dd>
      <dt>Origen al abrir</dt><dd>{info.origen}</dd>
      <dt>Último guardado</dt><dd>{fh(info.guardado)}</dd>
      {info.error && <><dt>Estado</dt><dd><span className="flag crit">{info.error}</span></dd></>}
    </dl>
    <p className="muted" style={{ fontSize: 12.5, margin: '10px 0 0' }}>Si se borran los datos de navegación, se pierde lo registrado: descarga un respaldo con frecuencia. Los cambios se guardan solos y se sincronizan entre pestañas del mismo navegador.</p>
    <div className="toolbar" style={{ marginTop: 10 }}><RestablecerBase /></div>
  </div>;
}

export default function RespaldoTab() {
  const { state } = useStore();
  return <>
    <KpiGrid cols={5}>
      <Kpi label="Versión" value={APP.version} detail={`${APP.fecha.split('-').reverse().join('/')} · React`} />
      <Kpi label="Oportunidades" value={state.opps.length} detail="colección opps" />
      <Kpi label="Clientes" value={state.clientes.length} detail="colección clientes" />
      <Kpi label="Contactos" value={state.contacts.length} detail="colección contacts" />
      <Kpi label="Casos técnicos" value={state.solicitudes.length} detail="colección solicitudes" />
    </KpiGrid>
    <div className="grid g2"><Integridad state={state} /><Respaldo /></div>
    <div className="grid g2"><Almacenamiento />
      <div className="card"><h2>Arquitectura</h2><dl className="kv">
        <dt>Interfaz</dt><dd>Aplicación web React 18 + Vite, sin instalación. Funciona en computador y celular, en tema claro y oscuro.</dd>
        <dt>Datos</dt><dd>Colecciones opps, clientes, contacts, solicitudes y config en el localStorage del navegador; la primera vez se carga la base migrada del Excel.</dd>
        <dt>Reglas</dt><dd>Lógica pura en <span className="mono">src/domain</span> (pronóstico, alertas, cumplimiento de ingeniería), separada de las pantallas.</dd>
        <dt>Integración</dt><dd>El módulo de almacenamiento se puede reemplazar por una API (Node.js + MongoDB) sin tocar las pantallas; el respaldo JSON tiene el mismo formato.</dd>
      </dl></div></div>
    <ModeloDatos />
    <Reglas />
    <Historial />
  </>;
}
