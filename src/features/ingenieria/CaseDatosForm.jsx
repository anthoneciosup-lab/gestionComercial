import { useState } from 'react';
import { useStore } from '../../store/StoreProvider.jsx';
import { Field, Options, RespSelect, EspecialistaSelect, useForm, useToast } from '../../components/ui/index.js';
import { PRIORIDADES } from '../../domain/constants.js';

const CAMPOS = { solicitante: 'solicitante', coordinador: 'coordinador', prioridad: 'prioridad', fKickoff: 'kickoff', fLimiteConsultas: 'límite de consultas',
  fRequeridaSolucion: 'solución requerida', fRequeridaCosteo: 'costeo requerido', alcance: 'alcance', sharepoint: 'carpeta SharePoint' };
const pick = s => Object.fromEntries(Object.keys(CAMPOS).map(k => [k, s[k] || '']));

/** “Fechas y responsables” del caso. Se monta de nuevo (key) cuando el caso cambia. */
export default function CaseDatosForm({ s }) {
  const { actions } = useStore(); const toast = useToast();
  const [f, set] = useForm(pick(s));
  const [err, setErr] = useState('');
  const save = () => {
    setErr('');
    const p = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, (v || '').trim() || (k.startsWith('f') ? null : '')]));
    if (!p.alcance) return setErr('El alcance no puede quedar vacío.');
    if (p.sharepoint && !/^https?:\/\//.test(p.sharepoint)) return setErr('El enlace debe empezar con https://');
    const ch = Object.keys(p).filter(k => (p[k] || null) !== (s[k] || null));
    if (!ch.length) { toast('No hay cambios.'); return; }
    actions.updateCaso(s.id, p, 'Datos actualizados: ' + ch.map(k => CAMPOS[k]).join(', ') + '.');
    toast('Guardado');
  };
  const date = k => <input type="date" value={f[k]} onChange={e => set(k, e.target.value)} />;
  return <fieldset><legend>Fechas y responsables</legend>
    <Field label="Solicitante"><RespSelect value={f.solicitante} onChange={v => set('solicitante', v)} /></Field>
    <Field label="Coordinador técnico principal"><EspecialistaSelect blank="—" value={f.coordinador} onChange={v => set('coordinador', v)} /></Field>
    <Field label="Prioridad"><select value={f.prioridad} onChange={e => set('prioridad', e.target.value)}><Options list={PRIORIDADES} /></select></Field>
    <Field label="Kickoff">{date('fKickoff')}</Field>
    <Field label="Límite de consultas">{date('fLimiteConsultas')}</Field>
    <Field label="Solución técnica requerida">{date('fRequeridaSolucion')}</Field>
    <Field label="Costeo requerido">{date('fRequeridaCosteo')}</Field>
    <Field label="Alcance" full><textarea value={f.alcance} onChange={e => set('alcance', e.target.value)} /></Field>
    <Field label="Carpeta SharePoint" full><input type="url" value={f.sharepoint} onChange={e => set('sharepoint', e.target.value)} placeholder="https://…" /></Field>
    <div className="full"><button className="btn pri" type="button" onClick={save}>Guardar datos</button> <span className="err">{err}</span></div>
  </fieldset>;
}
