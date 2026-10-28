import { Suspense, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import { PAGE } from '../../app/routes.js';
import { useDrawer } from '../../app/useDrawer.js';
import OppDrawer from '../../features/oportunidades/OppDrawer.jsx';
import NewOppModal from '../../features/oportunidades/NewOppModal.jsx';
import CaseDrawer from '../../features/ingenieria/CaseDrawer.jsx';
import NewCaseModal from '../../features/ingenieria/NewCaseModal.jsx';
import ClienteDrawer from '../../features/clientes/ClienteDrawer.jsx';
import ClienteFormModal from '../../features/clientes/ClienteFormModal.jsx';
import ContactoModal from '../../features/contactos/ContactoModal.jsx';

/** Estructura común: menú, barra superior, módulo activo, fichas laterales y ventanas de alta. */
export default function Layout() {
  const loc = useLocation(); const d = useDrawer();
  const key = loc.pathname.split('/')[1] || 'tablero';
  const page = { key, ...(PAGE[key] || PAGE.tablero) };
  const [nuevo, setNuevo] = useState(null);
  return <div className="app">
    <Sidebar />
    <main className="main" id="main">
      <Topbar page={page} onNew={setNuevo} />
      <section id="view"><Suspense fallback={<div className="empty">Cargando…</div>}><Outlet /></Suspense></section>
    </main>
    {d.opp && <OppDrawer id={d.opp} tab={d.tab || 'resumen'} onTab={d.setTab} onClose={d.close} />}
    {d.caso && <CaseDrawer id={d.caso} onClose={d.close} />}
    {d.cliente && <ClienteDrawer id={d.cliente} onClose={d.close} />}
    {nuevo === 'opp' && <NewOppModal onClose={() => setNuevo(null)} onCreated={id => d.open('opp', id)} />}
    {nuevo === 'caso' && <NewCaseModal onClose={() => setNuevo(null)} onCreated={id => d.open('caso', id)} />}
    {nuevo === 'cliente' && <ClienteFormModal onClose={() => setNuevo(null)} onSaved={id => d.open('cliente', id)} />}
    {nuevo === 'contacto' && <ContactoModal onClose={() => setNuevo(null)} />}
  </div>;
}
