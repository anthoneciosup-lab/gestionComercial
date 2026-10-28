import { useState } from 'react';
import { useStore, useCtx } from '../../store/StoreProvider.jsx';
import { useDrawer } from '../../app/useDrawer.js';
import { Drawer, Modal, Field, Flags, Progress, useToast } from '../../components/ui/index.js';
import { ESPECIALIDADES } from '../../domain/constants.js';
import { hoyISO, fd, pct } from '../../domain/format.js';
import { espKey, solEtapa, solAvance, solAlerts, solListo } from '../../domain/ingenieria.js';
import { solTitulo, blankEsp } from './casoUtils.js';
import CaseDatosForm from './CaseDatosForm.jsx';
import EspCard from './EspCard.jsx';
import RevisarFechaModal from './RevisarFechaModal.jsx';

/** Ventanas de cerrar / cancelar / quitar especialidad. */
function CaseModal({ kind, s, i, persist, onClose }) {
  const [txt, setTxt] = useState('');
  if (kind === 'close') return <Modal title="Cerrar solicitud" subtitle={s.id} okLabel="Cerrar solicitud" onClose={onClose}
    onOk={() => persist({ estado: 'Cerrada', fCierre: hoyISO() }, `Solicitud cerrada. ${txt.trim()}`)}>
    {solListo(s) ? <p>Todas las especialidades tienen el costeo listo.</p> : <div className="banner warn">Aún hay especialidades sin costeo listo. Ciérrala solo si el caso técnico ya no se necesita completar.</div>}
    <Field label="Comentario de cierre"><input type="text" value={txt} onChange={e => setTxt(e.target.value)} placeholder="Ej.: Costeo consolidado entregado a comercial" /></Field>
  </Modal>;
  if (kind === 'cancel') return <Modal title="Cancelar solicitud" subtitle={s.id} okLabel="Cancelar solicitud" cancelLabel="Volver" onClose={onClose}
    onOk={() => { const m = txt.trim(); if (!m) throw new Error('Indica el motivo.'); persist({ estado: 'Cancelada', fCierre: hoyISO() }, 'Solicitud cancelada: ' + m); }}>
    <Field label="Motivo"><input type="text" value={txt} onChange={e => setTxt(e.target.value)} placeholder="Ej.: El cliente suspendió la licitación" /></Field>
  </Modal>;
  const e = s.esp[i]; if (!e) return null;
  return <Modal title="Quitar especialidad" subtitle={`${e.esp} de ${s.id}`} okLabel="Quitar" onClose={onClose}
    onOk={() => persist({ esp: s.esp.filter((_, j) => j !== i) }, `Se quitó la especialidad ${e.esp}.`)}>
    <p>La especialidad sale de la solicitud. El historial conserva el registro.</p>
  </Modal>;
}

/** Ficha lateral de un caso técnico. */
export default function CaseDrawer({ id, onClose }) {
  const { state, actions } = useStore(); const ctx = useCtx(); const d = useDrawer(); const toast = useToast();
  const [modal, setModal] = useState(null); // {kind, i}
  const [addE, setAddE] = useState('');
  const s = state.solicitudes.find(x => x.id === id);
  if (!s) return <Drawer label="Caso técnico" header={<h2>Caso no encontrado</h2>} onClose={onClose}><div className="empty">El caso {id} no existe.</div></Drawer>;
  const o = state.opps.find(x => x.id === s.oppId), open = s.estado === 'Abierta', esp = s.esp || [];
  const tit = solTitulo(s, state.opps, ctx), av = solAvance(s);
  const persist = (patch, logT) => { actions.updateCaso(s.id, patch, logT); toast('Guardado'); };
  const faltan = ESPECIALIDADES.filter(e => !esp.some(x => espKey(x.esp) === e));
  const addEsp = () => { const e = addE || faltan[0]; persist({ esp: [...esp, blankEsp(e, 'e' + Date.now().toString(36))] }, `Se agregó la especialidad ${e}.`); setAddE(''); };

  const header = <>
    <div className="mono muted" style={{ fontSize: 12 }}>{s.id} · {s.origen} · prioridad {s.prioridad}</div>
    <h2>{o ? <a href="#" style={{ color: 'inherit', textDecoration: 'none' }} onClick={ev => { ev.preventDefault(); d.open('opp', o.id, 'ingenieria'); }}>{tit}</a> : tit}</h2>
    <div style={{ fontSize: 13.5 }}>{s.alcance}</div>
    <div className="meta"><span className="pill">{s.estado}</span><span>Etapa: <b>{solEtapa(s)}</b></span><Progress value={av} /><span className="num">{pct(av)}</span><span>Coordinador: {s.coordinador || '—'}</span></div>
    <Flags items={solAlerts(s, ctx.params)} max={5} />
  </>;
  const acts = s.sharepoint ? <a className="btn sm" href={s.sharepoint} target="_blank" rel="noopener noreferrer">Carpeta SharePoint</a> : null;

  return <Drawer label={`Solicitud ${s.id}`} header={header} actions={acts} onClose={onClose}>
    <CaseDatosForm key={s.actualizado || s.id} s={s} />
    <h3 style={{ fontSize: 15, margin: '4px 0 0' }}>Especialidades</h3>
    {esp.map((e, i) => <EspCard key={e.id || i} s={s} i={i} opp={o} onRev={() => setModal({ kind: 'rev', i })} onRemove={() => setModal({ kind: 'remove', i })} />)}
    {faltan.length > 0 && open && <div className="toolbar">
      <select value={addE || faltan[0]} onChange={e => setAddE(e.target.value)} aria-label="Especialidad a agregar">{faltan.map(e => <option key={e}>{e}</option>)}</select>
      <button className="btn sm" type="button" onClick={addEsp}>+ Agregar especialidad</button></div>}
    <div className="card"><h2>Historial de la solicitud <small>{(s.log || []).length}</small></h2>
      <div className="tl">{[...(s.log || [])].reverse().map((l, k) => <div key={l.ts || k} className="e"><div className="h"><span className="date">{fd(l.f)}</span></div><p>{l.t}</p></div>)}</div></div>
    <div className="toolbar">{open ? <>
      <button className={`btn ${solListo(s) ? 'pri' : ''}`} type="button" onClick={() => setModal({ kind: 'close' })}>Cerrar solicitud{solListo(s) ? ' (lista para propuesta)' : ''}</button>
      <button className="btn danger" type="button" onClick={() => setModal({ kind: 'cancel' })}>Cancelar solicitud</button></>
      : <button className="btn" type="button" onClick={() => persist({ estado: 'Abierta', fCierre: null }, 'Solicitud reabierta.')}>Reabrir solicitud</button>}</div>
    {modal?.kind === 'rev' && <RevisarFechaModal casoId={s.id} i={modal.i} onClose={() => setModal(null)} />}
    {modal && modal.kind !== 'rev' && <CaseModal kind={modal.kind} s={s} i={modal.i} persist={persist} onClose={() => setModal(null)} />}
  </Drawer>;
}
