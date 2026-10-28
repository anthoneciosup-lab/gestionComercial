import { useCtx } from '../../store/StoreProvider.jsx';
import { useDrawer } from '../../app/useDrawer.js';
import { usd, pct } from '../../domain/format.js';
import { alerts } from '../../domain/rules.js';
import { Card, EtapaPill, DateCell, Flags } from '../../components/ui/index.js';
import OppRefCell from './OppRefCell.jsx';

/** Oportunidades activas de mayor monto (abren la ficha). */
export default function TopOpps({ list }) {
  const ctx = useCtx(), d = useDrawer();
  return <Card title="Oportunidades activas de mayor monto"><div className="tw" style={{ border: 'none' }}><table>
    <thead><tr><th>N°</th><th>Oportunidad</th><th>Etapa</th><th className="r">Monto</th><th className="r">Prob.</th><th>Próxima acción</th><th>Alertas</th></tr></thead>
    <tbody>{list.map(o => <tr key={o.id} className="click" onClick={() => d.open('opp', o.id)}>
      <td className="mono">{o.numero || o.id}</td><OppRefCell o={o} /><td><EtapaPill o={o} /></td>
      <td className="r num">{usd(o.monto)}</td><td className="r num">{pct(o.prob)}</td>
      <td>{o.proxAccion ? <>{o.proxAccion}<br /><DateCell iso={o.fProxAccion} /></> : <span className="flag crit">Sin definir</span>}</td>
      <td><Flags items={alerts(o, ctx)} max={2} /></td></tr>)}</tbody>
  </table></div></Card>;
}
