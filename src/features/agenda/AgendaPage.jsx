import { useNavigate, useParams } from 'react-router-dom';
import { Tabs } from '../../components/ui/index.js';
import AccionesTab from './AccionesTab.jsx';
import RevisionTab from './RevisionTab.jsx';

const TABS = [{ key: 'acciones', label: 'Próximas acciones' }, { key: 'revision', label: 'Revisión semanal' }];

/** Agenda y revisión: /agenda (próximas acciones) y /agenda/revision. */
export default function AgendaPage() {
  const { tab } = useParams(), nav = useNavigate();
  const t = tab === 'revision' ? 'revision' : 'acciones';
  return <>
    <Tabs className="main-tabs" tabs={TABS} value={t} onChange={k => nav(k === 'revision' ? '/agenda/revision' : '/agenda')} />
    {t === 'revision' ? <RevisionTab /> : <AccionesTab />}
  </>;
}
