/** Reasignar oportunidades abiertas de ex colaboradores a personas activas del equipo. */
import { useEffect, useState } from 'react';
import { useCtx, useStore } from '../../store/StoreProvider.jsx';
import { usd } from '../../domain/format.js';
import { EtapaPill, Modal, RespSelect, useToast } from '../../components/ui/index.js';
import { CliCell } from './shared.jsx';

export default function ReasignarModal({ list, title, onClose }) {
  const { actions } = useStore(); const ctx = useCtx(); const toast = useToast();
  const [all, setAll] = useState('');
  const [sel, setSel] = useState({});

  // Sin oportunidades: avisar y cerrar (como en la v2.3)
  useEffect(() => { if (!list.length) { toast('No hay oportunidades por reasignar.'); onClose(); } }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!list.length) return null;

  const quien = [...new Set(list.map(o => o.resp))].map(r => `${r} · ${ctx.respName(r)}`).join(', ');
  const total = list.reduce((t, o) => t + (o.monto || 0), 0);
  const aplicar = () => {
    if (!all) { toast('Elige a quién asignar.'); return; }
    setSel(Object.fromEntries(list.map(o => [o.id, all])));
  };
  const guardar = () => {
    const elegidas = list.filter(o => sel[o.id]);
    if (!elegidas.length) throw new Error('Elige el nuevo responsable de al menos una oportunidad.');
    let n = 0;
    for (const o of elegidas) {
      const to = sel[o.id];
      actions.updateOpp(o.id, { resp: to }, { t: `Reasignada de ${o.resp} (${ctx.respName(o.resp)}, ex colaborador) a ${to} (${ctx.respName(to)}).`, a: to });
      n++;
    }
    toast(`${n} oportunidades reasignadas`);
  };

  return <Modal wide title={title || 'Reasignar cartera de ex colaboradores'} onClose={onClose} onOk={guardar} okLabel="Guardar reasignación"
    subtitle={`${list.length} oportunidades abiertas de ${quien} · ${usd(total)}. Las cerradas conservan su responsable original.`}>
    <div className="toolbar">
      <label className="f">Asignar todas a<RespSelect value={all} onChange={setAll} blank="Elegir…" /></label>
      <button className="btn sm" type="button" onClick={aplicar} style={{ alignSelf: 'flex-end' }}>Aplicar a todas</button>
    </div>
    <div className="tw" style={{ maxHeight: '52vh' }}><table>
      <thead><tr><th>N°</th><th>Oportunidad</th><th>Estado</th><th className="r">Monto</th><th>Nuevo responsable</th></tr></thead>
      <tbody>{list.map(o => <tr key={o.id}>
        <td className="mono">{o.numero || o.id}</td>
        <td className="ref"><CliCell o={o} ctx={ctx} /></td>
        <td><EtapaPill o={o} /></td>
        <td className="r num">{usd(o.monto)}</td>
        <td><RespSelect value={sel[o.id] || ''} onChange={v => setSel(s => ({ ...s, [o.id]: v }))} blank="Dejar pendiente" aria-label={`Nuevo responsable de ${o.numero || o.id}`} /></td>
      </tr>)}</tbody>
    </table></div>
  </Modal>;
}
