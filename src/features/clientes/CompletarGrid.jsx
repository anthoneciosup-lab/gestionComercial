/** Edición rápida de los datos de empresa (nombre comercial, país, RUC/RUT, dirección, web) con Guardar por fila. */
import { useMemo, useState } from 'react';
import { useStore } from '../../store/StoreProvider.jsx';
import { useDrawer } from '../../app/useDrawer.js';
import { PAISES } from '../../domain/constants.js';
import { rucCheck, webNorm } from '../../domain/validators.js';
import { Progress, Options, useToast } from '../../components/ui/index.js';
import { abiertasDe, incompleta, rucDuplicado, webOk } from './clientesData.js';

const CAMPOS = ['nombreComercial', 'pais', 'ruc', 'direccion', 'web'];
const leer = f => ({ nombreComercial: f.nombreComercial.trim(), pais: f.pais, ruc: f.ruc.trim().toUpperCase(), direccion: f.direccion.trim(), web: webNorm(f.web) });

function FilaCliente({ c, abiertas }) {
  const { state, actions } = useStore(); const toast = useToast(); const d = useDrawer();
  const [f, setF] = useState(() => Object.fromEntries(CAMPOS.map(k => [k, c[k] || (k === 'pais' ? 'PERÚ' : '')])));
  const [err, setErr] = useState(''); const [saved, setSaved] = useState(false);
  const datos = leer(f);
  const cambio = CAMPOS.some(k => (datos[k] || '') !== (c[k] || ''));
  const set = (k, v) => { setF(x => ({ ...x, [k]: v })); setErr(''); setSaved(false); };
  const guardar = () => {
    const e1 = rucCheck(datos.ruc, datos.pais); if (e1) return setErr(e1);
    const dup = rucDuplicado(datos.ruc, c.id, state.clientes); if (dup) return setErr('RUC ya registrado en ' + dup.nombre);
    if (!webOk(datos.web)) return setErr('Web no válida');
    try { actions.patch('clientes', c.id, datos); setF(Object.fromEntries(CAMPOS.map(k => [k, datos[k] || (k === 'pais' ? 'PERÚ' : '')]))); setSaved(true); toast(`Ficha de ${c.nombre} actualizada`); }
    catch (e) { setErr(e.message); }
  };
  const inp = (k, props) => <input type="text" value={f[k]} onChange={e => set(k, e.target.value)} aria-label={`${props.label} de ${c.nombre}`} {...props.extra} />;
  return <tr className={saved ? 'saved' : ''}>
    <td><button className="glink" type="button" onClick={() => d.open('cliente', c.id)}>{c.nombre}</button><div className="muted" style={{ fontSize: 11 }}>{abiertas} abiertas</div></td>
    <td>{inp('nombreComercial', { label: 'Nombre comercial' })}</td>
    <td><select value={f.pais} onChange={e => set('pais', e.target.value)} aria-label={`País de ${c.nombre}`}><Options list={Object.values(PAISES)} /></select></td>
    <td>{inp('ruc', { label: 'RUC', extra: { inputMode: 'numeric', className: 'mono' } })}</td>
    <td>{inp('direccion', { label: 'Dirección' })}</td>
    <td>{inp('web', { label: 'Web', extra: { placeholder: 'www.empresa.com' } })}</td>
    <td><button className="btn sm pri" type="button" disabled={!cambio} onClick={guardar}>Guardar</button>{err && <div className="err">{err}</div>}</td>
  </tr>;
}

export default function CompletarGrid({ q, setQ, onBack }) {
  const { state } = useStore();
  const [soloInc, setSoloInc] = useState(true);
  // La lista se congela al entrar o al cambiar filtros: una fila guardada no desaparece mientras se trabaja.
  const [snap, setSnap] = useState(0);
  const L = useMemo(() => {
    const s = q.trim().toLowerCase();
    return state.clientes.filter(c => (!soloInc || incompleta(c)) && (!s || [c.nombre, c.nombreComercial, c.ruc].join(' ').toLowerCase().includes(s)))
      .map(c => ({ c, n: abiertasDe(c.id, state.opps) }))
      .sort((a, b) => b.n - a.n || a.c.nombre.localeCompare(b.c.nombre)).map(x => x.c.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, soloInc, snap]);
  const tot = state.clientes.length, comp = state.clientes.filter(c => !incompleta(c)).length;
  return <>
    <div className="toolbar">
      <button className="btn" type="button" onClick={onBack}>← Volver a la lista de clientes</button>
      <input type="search" placeholder="Buscar empresa" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar empresa" />
      <label className="checks"><label><input type="checkbox" checked={soloInc} onChange={e => { setSoloInc(e.target.checked); setSnap(x => x + 1); }} />Solo fichas incompletas</label></label>
      <span className="count">{comp} de {tot} completas · <Progress value={tot ? comp / tot : 0} /></span>
    </div>
    <div className="banner"><span>Completa los datos de cada empresa y pulsa <b>Guardar</b> en su fila. Se valida el formato del RUC (Perú: 11 dígitos) o RUT (Chile: 12345678-9) y que no se repita en otra empresa. Primero aparecen las empresas con más oportunidades abiertas.</span></div>
    <div className="tw"><table className="edgrid"><thead><tr><th>Razón social</th><th>Nombre comercial</th><th>País</th><th>RUC / RUT</th><th>Dirección</th><th>Página web</th><th></th></tr></thead>
      <tbody>{L.map(id => { const c = state.clientes.find(x => x.id === id); return c && <FilaCliente key={id} c={c} abiertas={abiertasDe(id, state.opps)} />; })}
        {!L.length && <tr><td colSpan={7}><div className="empty">Todas las fichas están completas.</div></td></tr>}</tbody></table></div>
  </>;
}
