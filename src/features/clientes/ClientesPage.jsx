/** Clientes: lista única de empresas con sus agregados, y modo “Completar datos de empresas”. */
import { useMemo, useState } from 'react';
import { useStore, useScopedOpps } from '../../store/StoreProvider.jsx';
import { useDrawer } from '../../app/useDrawer.js';
import { TIPOS_EMPRESA } from '../../domain/constants.js';
import { fd, usd, pct } from '../../domain/format.js';
import { Options } from '../../components/ui/index.js';
import { aggClientes, incompleta } from './clientesData.js';
import CompletarGrid from './CompletarGrid.jsx';

const Muted = ({ children = '—' }) => <span className="muted">{children}</span>;

export default function ClientesPage() {
  const { state } = useStore(); const opps = useScopedOpps(); const d = useDrawer();
  const [q, setQ] = useState(''); const [tipo, setTipo] = useState(''); const [modo, setModo] = useState('');
  const all = useMemo(() => aggClientes(state.clientes, opps, state.contacts, state.solicitudes), [state.clientes, opps, state.contacts, state.solicitudes]);
  const L = useMemo(() => {
    const s = q.trim().toLowerCase();
    return all.filter(c => (!s || [c.nombre, c.nombreComercial, c.ruc, ...(c.alias || [])].join(' ').toLowerCase().includes(s)) && (!tipo || c.tipo === tipo))
      .sort((a, b) => b.pip - a.pip || b.n - a.n || a.nombre.localeCompare(b.nombre));
  }, [all, q, tipo]);
  const inc = state.clientes.filter(incompleta).length;

  if (modo === 'completar') return <CompletarGrid q={q} setQ={setQ} onBack={() => setModo('')} />;

  return <>
    <div className="toolbar">
      <input type="search" placeholder="Buscar por nombre, nombre comercial o RUC" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar clientes" />
      <select aria-label="Tipo" value={tipo} onChange={e => setTipo(e.target.value)}><Options list={TIPOS_EMPRESA} blank="Todos los tipos" /></select>
      <button className="btn" type="button" onClick={() => setModo('completar')}>Completar datos de empresas{inc > 0 && <span className="badge-in">{inc}</span>}</button>
      <span className="count">{L.length} empresas · {L.filter(c => c.faltan).length} con ficha incompleta</span>
    </div>
    <div className="tw"><table><thead><tr>
      <th>Empresa</th><th>RUC / RUT</th><th>País</th><th className="r">Oport.</th><th className="r">Activas</th><th className="r">Pipeline</th><th className="r">Ganadas</th>
      <th className="r">Ganado</th><th className="r">Perdidas</th><th className="r">Tasa cierre</th><th className="r">Contactos</th><th>Últ. mov.</th><th>Ficha</th></tr></thead>
    <tbody>{L.map(c => <tr key={c.id} className="click" onClick={() => d.open('cliente', c.id)}>
      <td><b>{c.nombre}</b>{c.tipo !== 'Cliente' && <> <span className="pill">{c.tipo}</span></>}
        {c.nombreComercial && <div className="muted" style={{ fontSize: 11.5 }}>{c.nombreComercial}</div>}</td>
      <td className="mono">{c.ruc || <Muted />}</td><td>{c.pais}</td>
      <td className="r num">{c.n}{c.nf > 0 && <span className="muted" title="Como cliente final"> +{c.nf}</span>}</td>
      <td className="r num">{c.open}</td><td className="r num">{usd(c.pip)}</td><td className="r num">{c.w}</td><td className="r num">{usd(c.wv)}</td>
      <td className="r num">{c.l}</td><td className="r num">{pct(c.wr)}</td><td className="r num">{c.con || <Muted>0</Muted>}</td><td>{fd(c.last)}</td>
      <td>{c.faltan ? <span className="flag warn">Falta {c.faltan}</span> : <span className="flag ok">Completa</span>}</td>
    </tr>)}
    {!L.length && <tr><td colSpan={13}><div className="empty">Ninguna empresa coincide.</div></td></tr>}</tbody></table></div>
    <p className="muted" style={{ fontSize: 12 }}>“+n” en Oport. = oportunidades donde la empresa es cliente final y otra compra. “Ficha” cuenta los datos que faltan (RUC, dirección, web). Haz clic en una empresa para ver y editar su ficha completa.</p>
  </>;
}
