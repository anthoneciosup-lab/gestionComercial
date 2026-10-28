import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StoreProvider, UiProvider } from './store/StoreProvider.jsx';
import { ToastProvider } from './components/ui/index.js';
import Layout from './components/layout/Layout.jsx';
const TableroPage = lazy(() => import('./features/tablero/TableroPage.jsx'));
const PipelinePage = lazy(() => import('./features/pipeline/PipelinePage.jsx'));
const OportunidadesPage = lazy(() => import('./features/oportunidades/OportunidadesPage.jsx'));
const AgendaPage = lazy(() => import('./features/agenda/AgendaPage.jsx'));
const CasosPage = lazy(() => import('./features/ingenieria/CasosPage.jsx'));
const ClientesPage = lazy(() => import('./features/clientes/ClientesPage.jsx'));
const ContactosPage = lazy(() => import('./features/contactos/ContactosPage.jsx'));
const AnalisisPage = lazy(() => import('./features/analisis/AnalisisPage.jsx'));
const ConfigPage = lazy(() => import('./features/config/ConfigPage.jsx'));
const GuiaPage = lazy(() => import('./features/guia/GuiaPage.jsx'));

/** Cada módulo se carga bajo demanda (React.lazy). Rutas con HashRouter: funciona abriendo el build desde cualquier servidor estático, sin configurar el servidor. */
export default function App() {
  return <StoreProvider><UiProvider><ToastProvider><HashRouter>
    <Routes>
      <Route element={<Suspense fallback={<div className="empty">Cargando…</div>}><Layout /></Suspense>}>
        <Route index element={<Navigate to="/tablero" replace />} />
        <Route path="tablero" element={<TableroPage />} />
        <Route path="pipeline" element={<PipelinePage />} />
        <Route path="oportunidades" element={<OportunidadesPage />} />
        <Route path="agenda/:tab?" element={<AgendaPage />} />
        <Route path="ingenieria" element={<CasosPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="contactos" element={<ContactosPage />} />
        <Route path="analisis/:tab?" element={<AnalisisPage />} />
        <Route path="config/:tab?" element={<ConfigPage />} />
        <Route path="guia" element={<GuiaPage />} />
        <Route path="*" element={<Navigate to="/tablero" replace />} />
      </Route>
    </Routes>
  </HashRouter></ToastProvider></UiProvider></StoreProvider>;
}
