import { useMemo, useState } from 'react';
import { useStore, useCtx } from '../../store/StoreProvider.jsx';
import { Modal, Field, Options, RespSelect, EspecialistaSelect, ClienteSelect, RubroSelect, useForm, useToast } from '../../components/ui/index.js';
import { ESPECIALIDADES, ESP_CORTO, PRIORIDADES } from '../../domain/constants.js';
import { hoyISO, addDays, fd, nowTs } from '../../domain/format.js';
import { isOpen, cliName } from '../../domain/rules.js';
import { espRubro, nextSolId } from '../../domain/ingenieria.js';
import ClienteFormModal from '../clientes/ClienteFormModal.jsx';
import { blankEsp } from './casoUtils.js';

const fechaAntes = (iso, dias) => { if (!iso) return ''; const f = addDays(iso, -dias); return f >= hoyISO() ? f : ''; };
const preCheck = (e, o) => !!o && ((e === 'Potencia' && o.lineas?.energia) || (e === 'Mecánica' && o.lineas?.clima) || (e.startsWith('Security') && o.lineas?.security));

/** Nuevo caso técnico (al convocar el kickoff con ingeniería). */
export default function NewCaseModal({ opp, onClose, onCreated }) {
  const { state, actions } = useStore(); const ctx = useCtx(); const toast = useToast(); const P = ctx.params;
  const activas = useMemo(() => state.opps.filter(isOpen).sort((a, b) => (b.numero || '').localeCompare(a.numero || '')), [state.opps]);
  const newId = nextSolId(state.solicitudes);
  const [f, set] = useForm({
    origen: 'Oportunidad', oppId: opp?.id || activas[0]?.id || '', proyecto: '', clienteId: '', alcance: opp?.ref || '', prioridad: 'Media',
    solicitante: opp && ctx.respActivo(opp.resp) ? opp.resp : ctx.equipoActivo[0]?.ini || '', coordinador: ctx.especialistasActivos.some(x => x.nombre === ctx.coordDef) ? ctx.coordDef : '',
    fKickoff: hoyISO(), fLimiteConsultas: opp?.fConsulta && opp.fConsulta >= hoyISO() ? opp.fConsulta : '',
    fRequeridaSolucion: fechaAntes(opp?.fOfertaRequerida, P.diasSolucionAntesOferta), fRequeridaCosteo: fechaAntes(opp?.fOfertaRequerida, P.diasCosteoAntesOferta),
    sharepoint: opp?.sharepoint || '',
  });
  const [esp, setEsp] = useState(() => ESPECIALIDADES.map(e => ({ on: preCheck(e, opp), rubro: '', rubroOtro: '', especialista: '', fc: '' })));
  const [newCli, setNewCli] = useState(false);
  const setE = (i, k, v) => setEsp(L => L.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const proy = f.origen === 'Proyecto';
  const op = state.opps.find(x => x.id === f.oppId);
  const industria = proy ? (ctx.cliById(f.clienteId)?.vertical || '—') : op ? (op.vertical || ctx.cliById(op.clienteId)?.vertical || 'Sin industria registrada') : '—';

  const ok = () => {
    const o = proy ? null : op;
    const kick = f.fKickoff || hoyISO();
    const list = ESPECIALIDADES.map((e, i) => ({ e, i, x: esp[i] })).filter(r => r.x.on).map(({ e, i, x }) => {
      const fc = x.fc || null;
      return { ...blankEsp(e, 'e' + i, kick), rubro: x.rubro, rubroOtro: x.rubro === 'Otro' ? x.rubroOtro.trim() : '', especialista: x.especialista,
        fComprometida: fc, compPor: fc ? f.coordinador : '', compFecha: fc ? hoyISO() : null };
    });
    const d = { id: newId, origen: f.origen, oppId: proy ? '' : f.oppId, proyecto: proy ? f.proyecto.trim() : '', clienteId: o ? o.clienteId : f.clienteId,
      alcance: f.alcance.trim(), prioridad: f.prioridad, solicitante: f.solicitante, coordinador: f.coordinador, fSolicitud: hoyISO(), fKickoff: f.fKickoff || null,
      fLimiteConsultas: f.fLimiteConsultas || null, fRequeridaSolucion: f.fRequeridaSolucion || null, fRequeridaCosteo: f.fRequeridaCosteo || null,
      sharepoint: f.sharepoint.trim(), estado: 'Abierta', esp: list, creado: nowTs(),
      log: [{ f: hoyISO(), t: `Solicitud creada por ${f.solicitante}. Especialidades: ${list.map(e => `${e.esp}${espRubro(e) ? ' · ' + espRubro(e) : ''} (${e.especialista || 'sin asignar'}${e.fComprometida ? ', comprometida ' + fd(e.fComprometida) : ''})`).join(', ')}.`, ts: nowTs() }] };
    if (!proy && !o) throw new Error('Elige la oportunidad.');
    if (proy && !d.proyecto) throw new Error('Indica el proyecto.');
    if (!d.alcance) throw new Error('Describe el alcance de lo solicitado.');
    if (!list.length) throw new Error('Marca al menos una especialidad.');
    if (list.some(e => e.rubro === 'Otro' && !e.rubroOtro)) throw new Error('Especifica el rubro marcado como “Otro”.');
    if (list.some(e => e.fComprometida) && !d.coordinador) throw new Error('La fecha comprometida la fija el coordinador técnico: elige el coordinador.');
    if (list.some(e => e.fComprometida && d.fKickoff && e.fComprometida < d.fKickoff)) throw new Error('La fecha comprometida no puede ser anterior al kickoff.');
    if (d.fLimiteConsultas && d.fRequeridaSolucion && d.fRequeridaSolucion < d.fLimiteConsultas) throw new Error('La solución no puede requerirse antes del límite de consultas.');
    if (d.sharepoint && !/^https?:\/\//.test(d.sharepoint)) throw new Error('El enlace debe empezar con https://');
    actions.upsert('solicitudes', d);
    if (o) actions.updateOpp(o.id, {}, { t: `Solicitud ${d.id} enviada a ingeniería (kickoff ${fd(d.fKickoff)}): ${list.map(e => ESP_CORTO[e.esp]).join(', ')}.`, tipo: 'Reunión', a: d.solicitante });
    toast(`Caso técnico ${d.id} creado`);
    onCreated?.(d.id);
  };

  return <Modal wide title={`Nuevo caso técnico · ${newId}`} subtitle="Se usa al convocar el kickoff: entrega la información a los especialistas y deja el control del caso técnico en el sistema."
    onClose={onClose} onOk={ok} okLabel="Crear caso técnico">
    <div className="grid g2">
      <Field label="Origen"><select value={f.origen} onChange={e => set('origen', e.target.value)}><option value="Oportunidad">Oportunidad comercial</option><option value="Proyecto">Proyecto en ejecución</option></select></Field>
      {!proy && <Field label="Oportunidad"><select value={f.oppId} onChange={e => set('oppId', e.target.value)}>
        {!activas.length && <option value="">No hay oportunidades abiertas</option>}
        {activas.map(x => <option key={x.id} value={x.id}>{x.numero} · {cliName(x, ctx)} · {(x.ref || '').slice(0, 50)}</option>)}</select></Field>}
      {proy && <Field label="Proyecto"><input type="text" value={f.proyecto} onChange={e => set('proyecto', e.target.value)} placeholder="Nombre o código del proyecto" /></Field>}
      {proy && <Field label="Cliente"><ClienteSelect value={f.clienteId} onChange={v => set('clienteId', v)} onNew={() => setNewCli(true)} /></Field>}
    </div>
    <Field label="Alcance de lo solicitado"><textarea value={f.alcance} onChange={e => set('alcance', e.target.value)} placeholder="Ej.: Diseñar solución de respaldo UPS + baterías para sala eléctrica de concentradora; revisar EETT y planos del cliente" /></Field>
    <div className="grid g3">
      <Field label="Prioridad"><select value={f.prioridad} onChange={e => set('prioridad', e.target.value)}><Options list={PRIORIDADES} /></select></Field>
      <Field label="Solicitante"><RespSelect value={f.solicitante} onChange={v => set('solicitante', v)} /></Field>
      <Field label="Coordinador técnico principal"><EspecialistaSelect blank="Elegir…" value={f.coordinador} onChange={v => set('coordinador', v)} /></Field>
      <Field label="Fecha de kickoff"><input type="date" value={f.fKickoff} onChange={e => set('fKickoff', e.target.value)} /></Field>
      <Field label="Límite de consultas del cliente"><input type="date" value={f.fLimiteConsultas} onChange={e => set('fLimiteConsultas', e.target.value)} /></Field>
      <Field label="Solución técnica requerida para"><input type="date" value={f.fRequeridaSolucion} onChange={e => set('fRequeridaSolucion', e.target.value)} /></Field>
      <Field label="Costeo requerido para"><input type="date" value={f.fRequeridaCosteo} onChange={e => set('fRequeridaCosteo', e.target.value)} /></Field>
    </div>
    <div className="f"><span>Especialidades, rubro, especialista y fecha comprometida <small className="muted">· industria del cliente: <b>{industria}</b></small></span>
      <div className="esphead"><span>Especialidad</span><span>Rubro (a qué corresponde)</span><span>Especialista</span><span>Fecha comprometida</span></div>
      {ESPECIALIDADES.map((e, i) => { const x = esp[i]; return <div key={e} className="esprow4">
        <div className="checks"><label><input type="checkbox" checked={x.on} onChange={ev => setE(i, 'on', ev.target.checked)} /><b>{e}</b></label></div>
        <RubroSelect especialidad={e} value={x.rubro} onChange={v => setE(i, 'rubro', v)} aria-label={`Rubro de ${e}`} />
        <EspecialistaSelect blank="Especialista…" value={x.especialista} onChange={v => setE(i, 'especialista', v)} aria-label={`Especialista de ${e}`} />
        <input type="date" value={x.fc} onChange={ev => setE(i, 'fc', ev.target.value)} aria-label={`Fecha comprometida de ${e}`} title="Fecha comprometida (la fija el coordinador técnico)" />
        {x.rubro === 'Otro' && <input type="text" className="espo" autoFocus value={x.rubroOtro} onChange={ev => setE(i, 'rubroOtro', ev.target.value)} placeholder="Especifica el rubro" aria-label={`Otro rubro de ${e}`} />}
      </div>; })}
      <small className="muted">La fecha comprometida la fija el coordinador técnico; si aún no la tiene, puede registrarla después en cada especialidad (plazo: {P.diasParaComprometer} días). Los cinco especialistas atienden todas las especialidades.</small>
    </div>
    <Field label="Carpeta del caso en SharePoint (opcional)"><input type="url" value={f.sharepoint} onChange={e => set('sharepoint', e.target.value)} placeholder="https://…" /></Field>
    {newCli && <ClienteFormModal onClose={() => setNewCli(false)} onSaved={id => { set('clienteId', id); setNewCli(false); }} />}
  </Modal>;
}
