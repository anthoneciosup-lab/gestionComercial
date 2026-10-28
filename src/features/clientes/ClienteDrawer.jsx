/** Ficha lateral de una empresa: datos, contactos, oportunidades, casos técnicos y decisores. */
import { useMemo, useState } from 'react';
import { useStore, useCtx, useScopedOpps } from '../../store/StoreProvider.jsx';
import { useDrawer } from '../../app/useDrawer.js';
import { Drawer, EtapaPill, Progress, Empty } from '../../components/ui/index.js';
import { fd, usd, pct } from '../../domain/format.js';
import { cliName } from '../../domain/rules.js';
import { solEtapa, solAvance } from '../../domain/ingenieria.js';
import { aggCliente } from './clientesData.js';
import ClienteFormModal from './ClienteFormModal.jsx';
import ContactoModal from '../contactos/ContactoModal.jsx';

const Falta = () => <span className="flag warn">Falta</span>;
const webHref = w => (/^https?:/.test(w) ? w : 'https://' + w);

function DatosEmpresa({ c, onEdit }) {
  return <div className="card"><h2>Datos de la empresa <button className="btn sm" type="button" onClick={onEdit}>Editar</button></h2>
    <dl className="kv">
      <dt>Razón social</dt><dd>{c.nombre}</dd>
      <dt>Nombre comercial</dt><dd>{c.nombreComercial || <span className="muted">—</span>}</dd>
      <dt>RUC / RUT</dt><dd className="mono">{c.ruc || <Falta />}</dd>
      <dt>País</dt><dd>{c.pais || '—'}</dd>
      <dt>Tipo</dt><dd>{c.tipo || '—'}</dd>
      <dt>Dirección</dt><dd>{c.direccion || <Falta />}</dd>
      <dt>Página web</dt><dd>{c.web ? <a href={webHref(c.web)} target="_blank" rel="noopener noreferrer">{c.web}</a> : <Falta />}</dd>
      <dt>Vertical</dt><dd>{c.vertical || '—'}</dd>
      <dt>Notas</dt><dd>{c.notas || <span className="muted">—</span>}</dd>
      {c.alias?.length > 0 && <><dt>En el Excel figuraba como</dt><dd>{c.alias.join(', ')}</dd></>}
    </dl></div>;
}

function Contactos({ list, onNew, onEdit }) {
  return <div className="card"><h2>Contactos <small>{list.length}</small> <button className="btn sm" type="button" onClick={onNew}>+ Contacto</button></h2>
    {list.length ? <div className="tw" style={{ border: 'none' }}><table><tbody>{list.map(k =>
      <tr key={k.id} className="click" onClick={() => onEdit(k)}>
        <td><b>{k.nombre}</b><div className="muted" style={{ fontSize: 12 }}>{k.cargo}{k.area ? ' · ' + k.area : ''}</div></td>
        <td>{(k.roles || []).map(r => <span key={r} className="pill">{r}</span>)}{k.postura && <span className={`pill pos-${k.postura}`}>{k.postura}</span>}</td>
        <td className="mono" style={{ fontSize: 12 }}>{k.telefono}</td><td>{fd(k.ultimaInteraccion)}</td>
      </tr>)}</tbody></table></div> : <Empty>Sin contactos registrados.</Empty>}</div>;
}

export default function ClienteDrawer({ id, onClose }) {
  const { state } = useStore(); const ctx = useCtx(); const opps = useScopedOpps(); const d = useDrawer();
  const [modal, setModal] = useState(null); // {tipo:'editar'} | {tipo:'contacto', k?}
  const base = state.clientes.find(x => x.id === id);
  const c = useMemo(() => base && aggCliente(base, opps, state.contacts, state.solicitudes), [base, opps, state.contacts, state.solicitudes]);
  if (!c) return <Drawer label="Ficha del cliente" header={<h2>Empresa no encontrada</h2>} onClose={onClose}><Empty>La empresa {id} no existe.</Empty></Drawer>;
  const con = state.contacts.filter(k => k.empresaId === id).sort((a, b) => a.nombre.localeCompare(b.nombre));
  const sols = state.solicitudes.filter(s => s.clienteId === id);
  const os = [...c.o].sort((a, b) => (b.fCreacion || '').localeCompare(a.fCreacion || ''));
  const decs = [...new Set(c.o.flatMap(o => [o.decisorTecnico && o.decisorTecnico + ' (técnico)', o.decisorFinal && o.decisorFinal + ' (final)']).filter(Boolean))];

  const header = <>
    <div className="mono muted" style={{ fontSize: 12 }}>Ficha de cliente · {c.tipo}</div>
    <h2>{c.nombre}</h2>{c.nombreComercial && <div style={{ fontSize: 13.5 }}>{c.nombreComercial}</div>}
    <div className="meta">{c.n} oportunidades · {c.open} activas · pipeline {usd(c.pip)} · ganado {usd(c.wv)} · tasa de cierre {pct(c.wr)}</div>
  </>;
  return <Drawer label={`Ficha del cliente ${c.nombre}`} header={header} onClose={onClose}>
    <DatosEmpresa c={c} onEdit={() => setModal({ tipo: 'editar' })} />
    <Contactos list={con} onNew={() => setModal({ tipo: 'contacto' })} onEdit={k => setModal({ tipo: 'contacto', k })} />
    <div className="card"><h2>Oportunidades <small>{os.length}</small></h2>
      <div className="tw" style={{ border: 'none' }}><table><tbody>{os.map(o =>
        <tr key={o.id} className="click" onClick={() => d.open('opp', o.id)}>
          <td className="mono">{o.numero || o.id}</td>
          <td className="ref"><div className="t">{o.ref}</div><div className="c">{o.resp} · {fd(o.fCreacion)}{o.clienteId !== id ? ' · como cliente final de ' + cliName(o, ctx) : ''}</div></td>
          <td><EtapaPill o={o} /></td><td className="r num">{usd(o.monto)}</td>
        </tr>)}
        {!os.length && <tr><td><Empty>Sin oportunidades.</Empty></td></tr>}</tbody></table></div></div>
    {sols.length > 0 && <div className="card"><h2>Casos técnicos <small>{sols.length}</small></h2>
      <div className="tw" style={{ border: 'none' }}><table><tbody>{sols.map(s =>
        <tr key={s.id} className="click" onClick={() => d.open('caso', s.id)}>
          <td className="mono">{s.id}</td><td>{s.alcance}</td><td>{s.estado === 'Abierta' ? solEtapa(s) : s.estado}</td><td><Progress value={solAvance(s)} /></td>
        </tr>)}</tbody></table></div></div>}
    <div className="card"><h2>Decisores registrados en oportunidades</h2>{decs.length ? decs.join(' · ') : <span className="muted">Ninguno.</span>}</div>
    {modal?.tipo === 'editar' && <ClienteFormModal cliente={base} onClose={() => setModal(null)} />}
    {modal?.tipo === 'contacto' && <ContactoModal contacto={modal.k} empresaId={id} onClose={() => setModal(null)} />}
  </Drawer>;
}
