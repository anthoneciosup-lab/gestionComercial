/** Ventanas de confirmación para eliminar a una persona del equipo o a un especialista. */
import { useState } from 'react';
import { Modal, Field } from '../../components/ui/index.js';
import { useStore, useCtx } from '../../store/StoreProvider.jsx';
import { abiertasDe, totalDe, casosDe } from './equipoOps.js';

export function EliminarPersonaModal({ p, onClose, onConfirm }) {
  const { state } = useStore(); const ctx = useCtx();
  const [to, setTo] = useState('');
  const ab = abiertasDe(p._orig, state.opps).length, tot = totalDe(p._orig, state.opps);
  const destinos = ctx.equipoActivo.filter(x => x.ini !== p._orig);
  const ok = () => {
    if (ab && (!to || to === p._orig)) throw new Error('Elige una persona activa.');
    onConfirm(ab ? to : '');
  };
  return <Modal title={`Eliminar a ${p.nombre} (${p._orig})`} subtitle="Se quita del equipo y de todos los menús. Su nombre se conserva en el historial y puede restaurarse."
    onClose={onClose} onOk={ok} okLabel="Eliminar">
    {ab > 0 && <>
      <div className="banner warn">Tiene <b>{ab}</b> oportunidades abiertas. Elige a quién reasignarlas; se reasignan antes de eliminar y cada cambio queda en la bitácora.</div>
      <Field label="Reasignar a"><select value={to} onChange={e => setTo(e.target.value)}><option value="">Elegir…</option>
        {destinos.map(x => <option key={x.ini} value={x.ini}>{x.ini} · {x.nombre}</option>)}</select></Field>
    </>}
    <p style={{ fontSize: 13.5, margin: 0 }}>{tot - ab} oportunidades cerradas seguirán mostrando su nombre.</p>
  </Modal>;
}

export function EliminarEspecialistaModal({ p, onClose, onConfirm }) {
  const { state } = useStore(); const ctx = useCtx();
  const [to, setTo] = useState('');
  const L = casosDe(p._orig, state.solicitudes);
  const otros = ctx.especialistasActivos.filter(x => x.nombre !== p._orig);
  return <Modal title={`Eliminar a ${p.nombre}`} subtitle="Se quita de la lista de especialistas. El historial de los casos técnicos conserva su nombre."
    onClose={onClose} onOk={() => onConfirm(L.length ? to : '')} okLabel="Eliminar">
    {L.length > 0 ? <>
      <div className="banner warn">Está a cargo en <b>{L.length}</b> casos técnicos abiertos ({L.map(s => s.id).join(', ')}). Elige quién lo reemplaza.</div>
      <Field label="Reemplazar por"><select value={to} onChange={e => setTo(e.target.value)}><option value="">Dejar sin asignar</option>
        {otros.map(x => <option key={x.nombre}>{x.nombre}</option>)}</select></Field>
    </> : <p style={{ fontSize: 13.5, margin: 0 }}>No tiene casos técnicos abiertos.</p>}
  </Modal>;
}
