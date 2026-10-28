/** Configuración: Equipo y reasignación · Especialidades y rubros · Parámetros · Respaldo e integración. */
import { useNavigate, useParams } from 'react-router-dom';
import { Tabs } from '../../components/ui/index.js';
import { useStore, useCtx } from '../../store/StoreProvider.jsx';
import { porReasignar } from '../../domain/rules.js';
import { ESPECIALIDADES } from '../../domain/constants.js';
import EquipoTab from './EquipoTab.jsx';
import CatalogoTab from './CatalogoTab.jsx';
import ParametrosTab from './ParametrosTab.jsx';
import RespaldoTab from './RespaldoTab.jsx';

const VIEWS = { equipo: EquipoTab, especialidades: CatalogoTab, parametros: ParametrosTab, respaldo: RespaldoTab };

export default function ConfigPage() {
  const { tab } = useParams(); const nav = useNavigate();
  const { state } = useStore(); const ctx = useCtx();
  const key = VIEWS[tab] ? tab : 'equipo';
  const nRe = porReasignar(state.opps, ctx).length;
  const nv = ESPECIALIDADES.filter(e => !ctx.catalog[e].validado).length;
  const tabs = [
    { key: 'equipo', label: 'Equipo y reasignación', badge: nRe || '' },
    { key: 'especialidades', label: 'Especialidades y rubros', badge: nv || '' },
    { key: 'parametros', label: 'Parámetros' },
    { key: 'respaldo', label: 'Respaldo e integración' },
  ];
  const View = VIEWS[key];
  return <>
    <Tabs className="main-tabs" tabs={tabs} value={key} onChange={k => nav(k === 'equipo' ? '/config' : '/config/' + k)} />
    <View key={key} />
  </>;
}
