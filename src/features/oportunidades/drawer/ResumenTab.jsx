/** Pestaña Resumen de la ficha: formulario editable de la oportunidad (se guarda desde el pie de la ficha). */
import { useStore } from '../../../store/StoreProvider.jsx';
import { ETAPAS, VERTICALES } from '../../../domain/constants.js';
import { etLabel, fd } from '../../../domain/format.js';
import { forecastOf, isActive, isStandby } from '../../../domain/rules.js';
import { ClienteSelect, Field, Options, RespSelect } from '../../../components/ui/index.js';
import { AccionInput, contactosDeOpp, ProbSelect } from '../shared.jsx';

const LINEAS = [['energia', 'Potencia'], ['clima', 'Mecánica'], ['security', 'Security, conectividad y telco']];

export default function ResumenTab({ o, f, set, ctx, sols, onModal }) {
  const { state } = useStore();
  const kOpts = contactosDeOpp({ clienteId: f.clienteId, clienteFinalId: f.clienteFinalId || f.clienteId }, state.contacts);
  const kl = `kl-${o.id}`;
  const fcAuto = forecastOf({ ...o, forecast: '' }, ctx.params) || '—';
  const inp = (k, type = 'text', extra = {}) => <input type={type} value={f[k]} onChange={e => set(k, e.target.value)} {...extra} />;

  return <>
    {isStandby(o) && <div className="banner warn">
      <span><b>En standby</b> desde {fd(o.standby.desde)}: {o.standby.motivo}. Revisar {o.standby.fRevision ? 'el ' + fd(o.standby.fRevision) : '(sin fecha)'}.{o.standby.nota ? ' ' + o.standby.nota : ''}</span>
      <button className="btn sm pri" type="button" onClick={() => onModal({ k: 'reactivar' })}>Reactivar</button>
      <button className="btn sm" type="button" onClick={() => onModal({ k: 'standby' })}>Cambiar motivo o fecha</button>
    </div>}
    {o.etapa === 'PROPUESTA' && isActive(o) && !sols.length && <div className="banner">
      <span>Está en Propuesta y aún no tiene <b>solicitud a ingeniería</b>.</span>
      <button className="btn sm" type="button" onClick={() => onModal({ k: 'caso' })}>Solicitar a ingeniería</button>
    </div>}

    {isActive(o)
      ? <fieldset className="nextbox"><legend>Próxima acción</legend>
        <Field label="Qué hay que hacer (redactado: qué, con quién, para qué)" full><AccionInput value={f.proxAccion} onChange={v => set('proxAccion', v)} /></Field>
        <Field label="Fecha límite">{inp('fProxAccion', 'date')}</Field>
        <Field label="Responsable"><RespSelect value={f.resp} onChange={v => set('resp', v)} /></Field>
      </fieldset>
      : <fieldset><legend>Responsable</legend>
        <Field label="Responsable"><RespSelect value={f.resp} onChange={v => set('resp', v)} /></Field>
      </fieldset>}

    <fieldset><legend>Comercial</legend>
      <Field label="Etapa"><select value={f.etapa} onChange={e => set('etapa', e.target.value)}>
        {!f.etapa && <option value="">{isStandby(o) ? '(en standby)' : '— Elegir etapa —'}</option>}
        {ETAPAS.map(e => <option key={e} value={e}>{etLabel(e)}</option>)}</select></Field>
      <Field label="Monto USD">{inp('monto', 'number', { step: '0.01' })}</Field>
      <Field label="Probabilidad"><ProbSelect value={f.prob} onChange={v => set('prob', v)} /></Field>
      <Field label="Pronóstico"><select value={f.forecast} onChange={e => set('forecast', e.target.value)}>
        <option value="">Automático ({fcAuto === 'Best' ? 'Best case' : fcAuto})</option>
        {['Commit', 'Best', 'Pipeline'].map(x => <option key={x} value={x}>{x === 'Best' ? 'Best case' : x}</option>)}</select></Field>
      <Field label="Fecha prevista de cierre">{inp('fCierre', 'date')}</Field>
      <Field label="Monto moneda local">{inp('montoLocal', 'number')}</Field>
    </fieldset>

    <fieldset><legend>Cliente y decisores</legend>
      <Field label="Referencia" full>{inp('ref')}</Field>
      <Field label="Cliente comprador"><ClienteSelect value={f.clienteId} onChange={v => set('clienteId', v)} onNew={() => onModal({ k: 'cliente', field: 'clienteId' })} /></Field>
      <Field label="Cliente final"><ClienteSelect value={f.clienteFinalId} onChange={v => set('clienteFinalId', v)} blank="Igual al comprador" onNew={() => onModal({ k: 'cliente', field: 'clienteFinalId' })} /></Field>
      <Field label="Decisor técnico">{inp('decisorTecnico', 'text', { list: kl })}</Field>
      <Field label="Decisor final">{inp('decisorFinal', 'text', { list: kl })}</Field>
      <datalist id={kl}>{kOpts.map(k => <option key={k.id} value={k.nombre} />)}</datalist>
      <Field label="Vertical"><select value={f.vertical} onChange={e => set('vertical', e.target.value)}><Options list={VERTICALES} blank="—" /></select></Field>
    </fieldset>

    <fieldset><legend>Ingeniería, documentos y fechas</legend>
      <div className="full checks"><span className="muted" style={{ fontSize: 12 }}>Especialidades involucradas:</span>
        {LINEAS.map(([k, l]) => <label key={k}><input type="checkbox" checked={!!f.lineas[k]} onChange={e => set('lineas', { ...f.lineas, [k]: e.target.checked })} />{l}</label>)}
      </div>
      <Field label="Carpeta de documentos en SharePoint (enlace)" full>{inp('sharepoint', 'url', { placeholder: 'https://voyantperu.sharepoint.com/…' })}</Field>
      <Field label="Estado de ingeniería"><select value={f.ingenieria} onChange={e => set('ingenieria', e.target.value)}>
        {!['Falta', 'Completado'].includes(f.ingenieria) && <option value={f.ingenieria}>{f.ingenieria || '—'}</option>}
        <option>Falta</option><option>Completado</option></select></Field>
      <Field label="Fecha de consultas">{inp('fConsulta', 'date')}</Field>
      <Field label="Fecha requerida de oferta">{inp('fOfertaRequerida', 'date')}</Field>
      <Field label="Fecha de última oferta">{inp('fUltimaOferta', 'date')}</Field>
    </fieldset>

    <div className="muted" style={{ fontSize: 12 }}>
      Creada {fd(o.fCreacion)} · {o.pais} · correlativo {o.correlativo} · {o.origen || 'Registrada en el sistema'}
      {o.actualizado ? ` · última edición ${new Date(o.actualizado).toLocaleString('es-PE')}` : ''}
    </div>
    {(o.obs || []).map((x, i) => <div key={i} className="banner warn">{x}</div>)}
  </>;
}
