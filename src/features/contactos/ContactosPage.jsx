/** Contactos: lista filtrable por empresa, área y rol; clic para abrir la ficha. */
import { useMemo, useState } from 'react';
import { useStore, useCtx } from '../../store/StoreProvider.jsx';
import { AREAS, ROLES_CONTACTO } from '../../domain/constants.js';
import { fd, hoyISO } from '../../domain/format.js';
import { downloadText } from '../../domain/csv.js';
import { Options } from '../../components/ui/index.js';
import ContactoModal from './ContactoModal.jsx';
import { contactosCsv } from './contactosData.js';

const Muted = () => <span className="muted">—</span>;

export default function ContactosPage() {
  const { state } = useStore(); const ctx = useCtx();
  const [f, setF] = useState({ q: '', emp: '', area: '', rol: '' });
  const [edit, setEdit] = useState(null);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const emp = id => ctx.cliById(id)?.nombre || '';
  const L = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return state.contacts.filter(k => (!q || [k.nombre, emp(k.empresaId), k.cargo, k.email, k.notas].join(' ').toLowerCase().includes(q))
      && (!f.area || k.area === f.area) && (!f.rol || (k.roles || []).includes(f.rol)) && (!f.emp || k.empresaId === f.emp))
      .sort((a, b) => emp(a.empresaId).localeCompare(emp(b.empresaId)) || a.nombre.localeCompare(b.nombre));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.contacts, f, ctx]);
  const emps = useMemo(() => [...new Set(state.contacts.map(k => k.empresaId))].map(ctx.cliById).filter(Boolean).sort((a, b) => a.nombre.localeCompare(b.nombre)), [state.contacts, ctx]);
  return <>
    <div className="toolbar">
      <input type="search" placeholder="Buscar persona, empresa, cargo o nota" value={f.q} onChange={e => set('q', e.target.value)} aria-label="Buscar contactos" />
      <select aria-label="Empresa" value={f.emp} onChange={e => set('emp', e.target.value)}><option value="">Todas las empresas</option>{emps.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
      <select aria-label="Área" value={f.area} onChange={e => set('area', e.target.value)}><Options list={AREAS} blank="Todas las áreas" /></select>
      <select aria-label="Rol" value={f.rol} onChange={e => set('rol', e.target.value)}><Options list={ROLES_CONTACTO} blank="Todo rol / influencia" /></select>
      <button className="btn sm" type="button" onClick={() => downloadText(`VOYANT_contactos_${hoyISO()}.csv`, contactosCsv(L, ctx.cliById), 'text/csv;charset=utf-8')}>Exportar CSV</button>
      <span className="count">{L.length} contactos</span>
    </div>
    <div className="tw"><table><thead><tr><th>Nombre completo</th><th>Empresa</th><th>Cargo</th><th>Área</th><th>Rol / influencia</th><th>Teléfono / WhatsApp</th><th>Email</th><th>Últ. interacción</th></tr></thead>
      <tbody>{L.map(k => <tr key={k.id} className="click" onClick={() => setEdit(k)}>
        <td><b>{k.nombre}</b>{k.notas && <div className="muted" style={{ fontSize: 11.5, maxWidth: 240 }}>{k.notas}</div>}</td>
        <td>{emp(k.empresaId) || k.empresa}</td><td>{k.cargo}</td><td>{k.area || <Muted />}</td>
        <td>{(k.roles || []).map(r => <span key={r} className="pill">{r}</span>)}{!(k.roles || []).length && !k.postura && <Muted />}{k.postura && <span className={`pill pos-${k.postura}`}>{k.postura}</span>}</td>
        <td className="mono" style={{ userSelect: 'all', fontSize: 12 }} onClick={e => e.stopPropagation()}>{k.telefono}</td>
        <td className="mono" style={{ userSelect: 'all', fontSize: 12 }} onClick={e => e.stopPropagation()}>{k.email}</td>
        <td>{fd(k.ultimaInteraccion)}</td>
      </tr>)}
      {!L.length && <tr><td colSpan={8}><div className="empty">Ningún contacto coincide.</div></td></tr>}</tbody></table></div>
    {edit && <ContactoModal contacto={edit} onClose={() => setEdit(null)} />}
  </>;
}
