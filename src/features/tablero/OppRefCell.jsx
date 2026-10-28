import { useCtx } from '../../store/StoreProvider.jsx';
import { cliName, cliFinalName } from '../../domain/rules.js';

/** Celda “referencia + cliente → cliente final · vertical” (igual que cliCell de la v2.3). */
export default function OppRefCell({ o }) {
  const ctx = useCtx(), fin = cliFinalName(o, ctx);
  return <td className="ref"><div className="t">{o.ref}</div>
    <div className="c">{cliName(o, ctx)}{fin && o.clienteFinalId !== o.clienteId ? ' → ' + fin : ''}{o.vertical ? ' · ' + o.vertical : ''}</div></td>;
}
