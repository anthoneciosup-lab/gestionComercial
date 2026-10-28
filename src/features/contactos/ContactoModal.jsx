/** Ficha de contacto (crear o editar): los 9 campos acordados más la postura opcional. */
import { useState } from 'react';
import { Modal, Field, Options, ClienteSelect, useForm, useToast } from '../../components/ui/index.js';
import { useStore, useCtx } from '../../store/StoreProvider.jsx';
import { AREAS, ROLES_CONTACTO, POSTURAS } from '../../domain/constants.js';
import { fd, hoyISO } from '../../domain/format.js';
import ClienteFormModal from '../clientes/ClienteFormModal.jsx';
import { nextContactId, validarContacto, historialDe, decisorEn } from './contactosData.js';

function Historial({ k, opps }) {
  const hist = historialDe(k.id, opps), dec = decisorEn(k, opps);
  return <>
    {hist.length > 0 && <div className="card"><h2>Interacciones registradas en bitácoras <small>{hist.length}</small></h2>
      {hist.slice(0, 8).map(e => <div key={e.o.id + e.ts + e.t} style={{ fontSize: 13, padding: '4px 0', borderBottom: '1px solid var(--line)' }}>
        <span className="date">{fd(e.f)}</span> · <b>{e.tipo}</b> · {e.o.numero || e.o.id} — {e.t}</div>)}</div>}
    {dec.length > 0 && <div className="muted" style={{ fontSize: 12.5 }}>Figura como decisor en: {dec.map(o => o.numero || o.id).join(', ')}</div>}
  </>;
}

export default function ContactoModal({ contacto, empresaId, onClose }) {
  const { state, actions } = useStore(); const ctx = useCtx(); const toast = useToast();
  const k = contacto || {}; const isNew = !k.id;
  const [f, set] = useForm({
    nombre: k.nombre || '', empresaId: k.empresaId || empresaId || '', cargo: k.cargo || '', area: k.area || '', email: k.email || '', telefono: k.telefono || '',
    roles: k.roles || [], ultimaInteraccion: k.ultimaInteraccion || '', postura: k.postura || '', notas: k.notas || '',
  });
  const [nuevaEmpresa, setNuevaEmpresa] = useState(false);
  const toggleRol = r => set('roles', f.roles.includes(r) ? f.roles.filter(x => x !== r) : ROLES_CONTACTO.filter(x => x === r || f.roles.includes(x)));
  const save = () => {
    const d = { ...f, nombre: f.nombre.trim(), cargo: f.cargo.trim(), email: f.email.trim(), telefono: f.telefono.trim(), notas: f.notas.trim(), ultimaInteraccion: f.ultimaInteraccion || null };
    const err = validarContacto(d, k.id, state.contacts); if (err) throw new Error(err);
    d.empresa = ctx.cliById(d.empresaId)?.nombre || '';
    if (isNew) actions.upsert('contacts', { ...d, id: nextContactId(state.contacts), creado: hoyISO() });
    else actions.upsert('contacts', { ...contacto, ...d });
    toast('Guardado');
  };
  const txt = (key, props = {}) => <input type="text" value={f[key]} onChange={e => set(key, e.target.value)} {...props} />;
  return <>
    <Modal title={isNew ? 'Nuevo contacto' : 'Ficha de contacto'} subtitle={isNew ? 'La empresa se elige de la lista de clientes para mantener la calidad de los datos.' : k.nombre}
      onClose={onClose} onOk={save} okLabel={isNew ? 'Guardar contacto' : 'Guardar cambios'}>
      <div className="grid g2">
        <Field label="1. Nombre completo">{txt('nombre', { autoFocus: isNew })}</Field>
        <Field label="2. Empresa (lista de clientes)"><ClienteSelect value={f.empresaId} onChange={v => set('empresaId', v)} onNew={() => setNuevaEmpresa(true)} /></Field>
        <Field label="3. Cargo">{txt('cargo', { placeholder: 'Ej.: Jefe de mantenimiento eléctrico' })}</Field>
        <Field label="4. Área"><select value={f.area} onChange={e => set('area', e.target.value)}><Options list={AREAS} blank="Elegir…" /></select></Field>
        <Field label="5. Email"><input type="email" value={f.email} onChange={e => set('email', e.target.value)} placeholder="nombre@empresa.com" /></Field>
        <Field label="6. Teléfono / WhatsApp"><input type="tel" value={f.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+51 9xx xxx xxx" /></Field>
        <div className="f full"><span>7. Rol / influencia (puedes marcar varios)</span><div className="checks">{ROLES_CONTACTO.map(r =>
          <label key={r}><input type="checkbox" checked={f.roles.includes(r)} onChange={() => toggleRol(r)} />{r}</label>)}</div></div>
        <Field label="8. Última interacción"><input type="date" value={f.ultimaInteraccion} onChange={e => set('ultimaInteraccion', e.target.value)} /></Field>
        <Field label="Postura hacia VOYANT (opcional)"><select value={f.postura} onChange={e => set('postura', e.target.value)}><Options list={POSTURAS} blank="Sin evaluar" /></select></Field>
        <Field label={<>9. Notas clave (contexto realmente útil sobre la persona) <span className="muted" style={{ fontWeight: 400 }}>{f.notas.length}/280</span></>} full>
          <textarea rows={2} maxLength={280} value={f.notas} onChange={e => set('notas', e.target.value)} placeholder="Ej.: Define la parada de planta; prefiere WhatsApp antes de las 9 a. m." /></Field>
      </div>
      {!isNew && <Historial k={k} opps={state.opps} />}
      <div className="muted" style={{ fontSize: 12 }}>La última interacción se actualiza sola cuando se registra una llamada, reunión o visita con este contacto en la bitácora de una oportunidad.</div>
    </Modal>
    {nuevaEmpresa && <ClienteFormModal onClose={() => setNuevaEmpresa(false)} onSaved={id => set('empresaId', id)} />}
  </>;
}
