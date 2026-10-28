/** Campos de formulario conectados a los catálogos del sistema. */
import { useState } from 'react';
import { useCtx, useStore } from '../../store/StoreProvider.jsx';
import { groupRubros } from '../../domain/ingenieria.js';

/** Etiqueta + control. */
export function Field({ label, children, full, hint }) {
  return <label className={`f ${full ? 'full' : ''}`}>{label}{children}{hint && <small className="muted">{hint}</small>}</label>;
}
/** Opciones simples a partir de una lista de textos. */
export const Options = ({ list, blank }) => <>{blank != null && <option value="">{blank}</option>}{list.map(x => <option key={x} value={x}>{x}</option>)}</>;

/** Responsable del equipo comercial (solo activos; si el valor actual es un ex colaborador, se muestra igual). */
export function RespSelect({ value, onChange, blank, id, disabled, ...rest }) {
  const ctx = useCtx();
  const act = ctx.equipoActivo;
  return <select id={id} value={value || ''} onChange={e => onChange(e.target.value)} disabled={disabled} {...rest}>
    {blank != null && <option value="">{blank}</option>}
    {act.map(p => <option key={p.ini} value={p.ini}>{p.ini} · {p.nombre}</option>)}
    {value && !act.some(p => p.ini === value) && <option value={value}>{value} · {ctx.respName(value)} (ex colaborador)</option>}
  </select>;
}
/** Especialista de ingeniería (todos atienden todas las especialidades). */
export function EspecialistaSelect({ value, onChange, blank = 'Sin asignar', ...rest }) {
  const ctx = useCtx(); const act = ctx.especialistasActivos;
  return <select value={value || ''} onChange={e => onChange(e.target.value)} {...rest}>
    <option value="">{blank}</option>{act.map(p => <option key={p.nombre}>{p.nombre}</option>)}
    {value && !act.some(p => p.nombre === value) && <option>{value}</option>}
  </select>;
}
/** Empresa de la lista de clientes, con opción “Registrar empresa nueva…” (onNew). */
export function ClienteSelect({ value, onChange, onNew, blank = 'Elegir empresa…', tipo, ...rest }) {
  const { state } = useStore();
  const L = [...state.clientes].filter(c => !tipo || c.tipo === tipo || c.id === value).sort((a, b) => a.nombre.localeCompare(b.nombre));
  return <select value={value || ''} onChange={e => (e.target.value === '__nuevo' ? onNew?.() : onChange(e.target.value))} {...rest}>
    <option value="">{blank}</option>
    {L.map(c => <option key={c.id} value={c.id}>{c.nombre}{c.tipo !== 'Cliente' ? ' · ' + c.tipo : ''}</option>)}
    {onNew && <option value="__nuevo">＋ Registrar empresa nueva…</option>}
  </select>;
}
/** Rubro de una especialidad (agrupado), con “Otro (especificar)”. */
export function RubroSelect({ especialidad, value, onChange, blank = 'Rubro (opcional)…', ...rest }) {
  const ctx = useCtx();
  const list = [...new Set([...(ctx.catalog[especialidad]?.r || []), ...(value && value !== 'Otro' ? [value] : [])])];
  return <select value={value || ''} onChange={e => onChange(e.target.value)} {...rest}>
    <option value="">{blank}</option>
    {groupRubros(list).map(g => g.group
      ? <optgroup key={g.group} label={g.group}>{g.items.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}</optgroup>
      : g.items.map(i => <option key={i.value} value={i.value}>{i.label}</option>))}
    <option value="Otro">Otro (especificar)</option>
  </select>;
}
/** Estado local de un formulario: const [f, set] = useForm({a:1}); set('a', 2) */
export function useForm(init) {
  const [f, setF] = useState(init);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  return [f, set, setF];
}
