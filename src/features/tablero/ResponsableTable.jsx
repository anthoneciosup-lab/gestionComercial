import { useNavigate } from 'react-router-dom';
import { useCtx, useUi } from '../../store/StoreProvider.jsx';
import { usd, pct } from '../../domain/format.js';
import { Card, Tag } from '../../components/ui/index.js';

/** Resumen por responsable; al pulsar una fila se filtra todo el sistema por esa persona. */
export default function ResponsableTable({ rows }) {
  const ctx = useCtx(), { set } = useUi(), nav = useNavigate();
  const go = r => { set('resp', r); nav('/oportunidades'); };
  return <Card title="Por responsable" sub="montos registrados; ponderado estimado"><div className="tw" style={{ border: 'none' }}><table>
    <thead><tr><th>Responsable</th><th className="r">Activas</th><th className="r">Sin monto</th><th className="r">Standby</th>
      <th className="r">Pipeline <Tag kind="real">real</Tag></th><th className="r">Ponderado <Tag kind="est">est.</Tag></th>
      <th className="r">Ganadas</th><th className="r">Perdidas</th><th className="r">Tasa cierre</th><th className="r">Ganado USD</th><th className="r">Alertas críticas</th></tr></thead>
    <tbody>{rows.map(r => <tr key={r.r} className="click" onClick={() => go(r.r)}>
      <td><b>{r.r}</b> <span className="muted">{ctx.respName(r.r)}</span>{!r.act && <> <span className="flag warn">ex colaborador</span></>}</td>
      <td className="r num">{r.n}</td>
      <td className="r num" style={r.sm ? { color: 'var(--warn)', fontWeight: 600 } : undefined}>{r.sm}</td>
      <td className="r num">{r.sb}</td><td className="r num">{usd(r.pip)}</td><td className="r num">{usd(r.pond)}</td>
      <td className="r num">{r.w}</td><td className="r num">{r.l}</td><td className="r num">{pct(r.wr)}</td><td className="r num">{usd(r.wv)}</td>
      <td className="r num" style={r.al ? { color: 'var(--crit)', fontWeight: 600 } : undefined}>{r.al}</td></tr>)}</tbody>
  </table></div></Card>;
}
