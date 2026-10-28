/** Ficha lateral de una oportunidad: Resumen, Bitácora, Ofertas, Ingeniería y Cierre. */
import { useEffect, useState } from 'react';
import { useCtx, useStore } from '../../store/StoreProvider.jsx';
import { useDrawer } from '../../app/useDrawer.js';
import { fd, pct, usd } from '../../domain/format.js';
import { alerts, cliName, isActive } from '../../domain/rules.js';
import { Drawer, Empty, EtapaPill, Flags, ForecastChip, Tabs, useToast } from '../../components/ui/index.js';
import NewCaseModal from '../ingenieria/NewCaseModal.jsx';
import ClienteFormModal from '../clientes/ClienteFormModal.jsx';
import CierreModal from './CierreModal.jsx';
import StandbyModal from './StandbyModal.jsx';
import ReactivarModal from './ReactivarModal.jsx';
import ResumenTab from './drawer/ResumenTab.jsx';
import BitacoraTab from './drawer/BitacoraTab.jsx';
import OfertasTab from './drawer/OfertasTab.jsx';
import IngenieriaTab from './drawer/IngenieriaTab.jsx';
import CierreTab from './drawer/CierreTab.jsx';
import { buildResumenSave, initResumen } from './resumenForm.js';

const TAB_KEYS = ['resumen', 'bitacora', 'propuestas', 'ingenieria', 'cierre'];

export default function OppDrawer({ id, tab, onTab, onClose }) {
  const { state } = useStore();
  const o = state.opps.find(x => x.id === id);
  if (!o) return <Drawer label="Oportunidad" header={<h2>Oportunidad {id}</h2>} onClose={onClose}><Empty>No existe la oportunidad {id}.</Empty></Drawer>;
  return <OppDrawerBody key={o.id} o={o} tab={TAB_KEYS.includes(tab) ? tab : 'resumen'} onTab={onTab} onClose={onClose} />;
}

function OppDrawerBody({ o, tab, onTab, onClose }) {
  const { actions } = useStore(); const ctx = useCtx(); const toast = useToast(); const d = useDrawer();
  const sols = ctx.solsDe(o.id);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(() => initResumen(o));
  const [err, setErr] = useState('');
  const setF = (k, v) => { setErr(''); setForm(x => ({ ...x, [k]: v })); };
  // Cuando la oportunidad cambia (guardado aquí o en otra parte), el formulario vuelve a los datos guardados.
  useEffect(() => { setForm(initResumen(o)); setErr(''); }, [o.actualizado]); // eslint-disable-line react-hooks/exhaustive-deps

  const guardar = () => {
    const r = buildResumenSave(o, form, ctx);
    if (r.error) { setErr(r.error); return; }
    if (!Object.keys(r.ch).length && !r.closeTo) { toast(r.aviso || 'No hay cambios que guardar.'); return; }
    try {
      if (Object.keys(r.ch).length) actions.updateOpp(o.id, r.ch, r.log.length ? r.log : undefined);
      if (r.closeTo) { setModal({ k: 'cierre', to: r.closeTo, opp: { ...o, ...r.ch } }); return; }
      toast(r.aviso || 'Guardado');
    } catch (e) { setErr(e.message); }
  };

  const tabs = [
    { key: 'resumen', label: 'Resumen' },
    { key: 'bitacora', label: 'Bitácora', badge: (o.bitacora || []).length },
    { key: 'propuestas', label: 'Ofertas', badge: (o.versiones || []).length },
    { key: 'ingenieria', label: 'Ingeniería', badge: sols.length },
    { key: 'cierre', label: 'Cierre y lecciones' },
  ];

  const header = <>
    <div className="mono muted" style={{ fontSize: 12 }}>{o.numero || o.id}{o.version ? ' · v' + o.version : ''} · {o.pais}</div>
    <h2><a href="#" style={{ color: 'inherit', textDecoration: 'none' }} onClick={e => { e.preventDefault(); if (o.clienteId) d.open('cliente', o.clienteId); }}>{cliName(o, ctx)}</a></h2>
    <div style={{ fontSize: 13.5 }}>{o.ref}</div>
    <div className="meta" style={{ marginTop: 6 }}>
      <EtapaPill o={o} /><ForecastChip o={o} params={ctx.params} />
      <span className="num"><b>{usd(o.monto, false)}</b></span><span>prob. {pct(o.prob)}</span><span>cierre {fd(o.fCierre)}</span>
      <span>resp. {o.resp} · {ctx.respName(o.resp)}</span>
    </div>
    <div style={{ marginTop: 6 }}><Flags items={alerts(o, ctx)} max={6} /></div>
    <Tabs tabs={tabs} value={tab} onChange={onTab} />
  </>;
  const acciones = <>
    {o.sharepoint && <a className="btn sm" href={o.sharepoint} target="_blank" rel="noopener noreferrer">Documentos (SharePoint)</a>}
    {isActive(o) && <button className="btn sm" type="button" onClick={() => setModal({ k: 'standby' })}>Pasar a standby</button>}
  </>;
  const footer = tab === 'resumen' && <>
    <span className="err" style={{ marginRight: 'auto', alignSelf: 'center' }} role="alert">{err}</span>
    <button className="btn" type="button" onClick={() => { setForm(initResumen(o)); setErr(''); }}>Descartar</button>
    <button className="btn pri" type="button" onClick={guardar}>Guardar cambios</button>
  </>;

  return <>
    <Drawer label={`Oportunidad ${o.numero || o.id}`} header={header} actions={acciones} footer={footer} onClose={onClose}>
      {tab === 'resumen' && <ResumenTab o={o} f={form} set={setF} ctx={ctx} sols={sols} onModal={setModal} />}
      {tab === 'bitacora' && <BitacoraTab o={o} />}
      {tab === 'propuestas' && <OfertasTab key={(o.versiones || []).length} o={o} />}
      {tab === 'ingenieria' && <IngenieriaTab sols={sols} ctx={ctx} onNuevo={() => setModal({ k: 'caso' })} />}
      {tab === 'cierre' && <CierreTab key={o.etapa} o={o} onModal={setModal} />}
    </Drawer>
    <DrawerModal modal={modal} o={o} onClose={() => setModal(null)} setF={setF} />
  </>;
}

function DrawerModal({ modal, o, onClose, setF }) {
  if (!modal) return null;
  switch (modal.k) {
    case 'cierre': return <CierreModal opp={modal.opp || o} to={modal.to} onClose={onClose} />;
    case 'standby': return <StandbyModal opp={o} onClose={onClose} />;
    case 'reactivar': return <ReactivarModal opp={o} onClose={onClose} />;
    case 'caso': return <NewCaseModal opp={o} onClose={onClose} onCreated={() => {}} />;
    case 'cliente': return <ClienteFormModal onClose={onClose} onSaved={cid => { setF(modal.field, cid); onClose(); }} />;
    default: return null;
  }
}
