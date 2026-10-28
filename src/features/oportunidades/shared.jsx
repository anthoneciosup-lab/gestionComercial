/** Piezas pequeñas compartidas por las vistas, fichas y ventanas de oportunidades. */
import { useId } from 'react';
import { ACCIONES } from '../../domain/constants.js';
import { cliName, cliFinalName } from '../../domain/rules.js';

/** Celda “referencia / cliente → cliente final · vertical”. */
export function CliCell({ o, ctx }) {
  const fin = cliFinalName(o, ctx);
  return <>
    <div className="t">{o.ref}</div>
    <div className="c">{cliName(o, ctx)}{fin && o.clienteFinalId !== o.clienteId ? ' → ' + fin : ''}{o.vertical ? ' · ' + o.vertical : ''}</div>
  </>;
}

/** Contactos del cliente comprador y (si es distinto) del cliente final. */
export function contactosDeOpp(o, contacts) {
  const de = cid => (cid ? contacts.filter(k => k.empresaId === cid) : []);
  return de(o.clienteId).concat(o.clienteFinalId && o.clienteFinalId !== o.clienteId ? de(o.clienteFinalId) : []);
}

/** Selector de contacto del cliente (valor = id del contacto). */
export function ContactPicker({ list, value, onChange, ...rest }) {
  return <select value={value || ''} onChange={e => onChange(e.target.value)} {...rest}>
    <option value="">— Ninguno / no registrado —</option>
    {list.map(k => <option key={k.id} value={k.id}>{k.nombre}{k.cargo ? ' · ' + k.cargo : ''}</option>)}
  </select>;
}

/** Campo de texto con sugerencias de acciones frecuentes. */
export function AccionInput({ value, onChange, ...rest }) {
  const id = useId();
  return <>
    <input type="text" list={id} value={value || ''} onChange={e => onChange(e.target.value)} {...rest} />
    <datalist id={id}>{ACCIONES.map(a => <option key={a} value={a} />)}</datalist>
  </>;
}

const PROBS = [0, 0.1, 0.2, 0.25, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
/** Probabilidad (valor numérico o null). Si el valor actual no está en la lista, se agrega. */
export function ProbSelect({ value, onChange, ...rest }) {
  const list = value != null && !PROBS.includes(value) ? [...PROBS, value].sort((a, b) => a - b) : PROBS;
  return <select value={value == null ? '' : String(value)} onChange={e => onChange(e.target.value === '' ? null : parseFloat(e.target.value))} {...rest}>
    <option value="">—</option>
    {list.map(p => <option key={p} value={String(p)}>{Math.round(p * 100)}%</option>)}
  </select>;
}

/** Número desde un input (vacío → null). */
export const numOrNull = v => (v === '' || v == null ? null : parseFloat(v));
export const isUrlOk = v => !v || /^https?:\/\//.test(v);
