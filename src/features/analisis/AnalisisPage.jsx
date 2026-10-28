import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCtx, useScopedOpps } from '../../store/StoreProvider.jsx';
import { alerts } from '../../domain/rules.js';
import { Tabs } from '../../components/ui/index.js';
import LeccionesTab from './LeccionesTab.jsx';
import CalidadTab from './CalidadTab.jsx';
import RealesTab from './RealesTab.jsx';

const PATH = { ganadas: '/analisis', calidad: '/analisis/calidad', reales: '/analisis/reales' };

/** Resultados y calidad: /analisis (ganadas y perdidas), /analisis/calidad, /analisis/reales. */
export default function AnalisisPage() {
  const { tab } = useParams(), nav = useNavigate(), ctx = useCtx(), O = useScopedOpps();
  const t = ['calidad', 'reales'].includes(tab) ? tab : 'ganadas';
  const iss = useMemo(() => O.filter(o => alerts(o, ctx).length).length, [O, ctx]);
  const tabs = [{ key: 'ganadas', label: 'Ganadas y perdidas' }, { key: 'calidad', label: 'Calidad de datos', badge: iss }, { key: 'reales', label: 'Valores reales' }];
  return <>
    <Tabs className="main-tabs" tabs={tabs} value={t} onChange={k => nav(PATH[k])} />
    {t === 'calidad' ? <CalidadTab /> : t === 'reales' ? <RealesTab /> : <LeccionesTab />}
  </>;
}
