/** Cerrar una oportunidad como ganada o perdida (con causa y lección obligatorias en las pérdidas). */
import { useCtx, useStore } from '../../store/StoreProvider.jsx';
import { CAUSAS } from '../../domain/constants.js';
import { addDays, hoyISO, usd } from '../../domain/format.js';
import { cliName, forecastOf } from '../../domain/rules.js';
import { Field, Modal, Options, useForm, useToast } from '../../components/ui/index.js';
import { numOrNull } from './shared.jsx';

export default function CierreModal({ opp: o, to, onClose }) {
  const { actions } = useStore(); const ctx = useCtx(); const toast = useToast();
  const lost = to === 'CERRADA PERDIDA';
  const [f, set] = useForm({
    causa: o.causaPerdida || '', otra: o.causaOtra || '', comp: o.competidor || '', lec: o.lecciones || '',
    monto: o.monto ?? '', fecha: hoyISO(), posventa: 'Enviar encuesta de satisfacción',
  });

  const base = { etapa: to, standby: null, forecastAlCierre: forecastOf(o, ctx.params) || '', probAlCierre: o.prob ?? null };
  const guardar = () => {
    const l = f.lec.trim();
    if (lost) {
      const ot = f.otra.trim();
      if (!f.causa || !l) throw new Error('La causa y la lección son obligatorias para cerrar una pérdida.');
      if (f.causa === 'Otra' && !ot) throw new Error('Escribe la causa en “Otra”.');
      actions.updateOpp(o.id, { ...base, causaPerdida: f.causa, causaOtra: f.causa === 'Otra' ? ot : '', lecciones: l, competidor: f.comp.trim(), prob: 0, proxAccion: '', fProxAccion: null },
        { t: `Cerrada perdida. Causa: ${f.causa === 'Otra' ? ot : f.causa}. Lección: ${l}`, tipo: 'Cambio de etapa' });
    } else {
      const m = f.monto === '' ? o.monto : numOrNull(f.monto), na = f.posventa.trim();
      actions.updateOpp(o.id, { ...base, monto: m, prob: 1, fCierre: f.fecha || null, lecciones: l, proxAccion: na, fProxAccion: na ? addDays(hoyISO(), ctx.params.diasPosventa) : null },
        { t: `Cerrada ganada por ${usd(m, false)}.${l ? ' Por qué ganamos: ' + l : ''}`, tipo: 'Cambio de etapa' });
    }
    toast('Guardado');
  };

  return <Modal title={lost ? 'Cerrar como perdida' : 'Cerrar como ganada'} subtitle={`${o.numero || o.id} · ${cliName(o, ctx)} · ${usd(o.monto, false)}`}
    onClose={onClose} onOk={guardar} okLabel={lost ? 'Cerrar como perdida' : 'Cerrar como ganada'}>
    {lost ? <>
      <Field label="Causa principal"><select value={f.causa} onChange={e => set('causa', e.target.value)} autoFocus><Options list={CAUSAS} blank="Elegir…" /></select></Field>
      {f.causa === 'Otra' && <Field label="Escribe la causa"><input type="text" value={f.otra} onChange={e => set('otra', e.target.value)} placeholder="Ej.: El cliente decidió hacerlo con personal propio" /></Field>}
      <Field label="Competidor ganador (si se sabe)"><input type="text" value={f.comp} onChange={e => set('comp', e.target.value)} /></Field>
      <Field label="Lección aprendida"><textarea value={f.lec} onChange={e => set('lec', e.target.value)} placeholder="Qué haríamos distinto la próxima vez" /></Field>
    </> : <>
      <Field label="Monto adjudicado USD"><input type="number" value={f.monto} onChange={e => set('monto', e.target.value)} autoFocus /></Field>
      <Field label="Fecha de OC / adjudicación"><input type="date" value={f.fecha} onChange={e => set('fecha', e.target.value)} /></Field>
      <Field label="Siguiente paso de posventa"><input type="text" value={f.posventa} onChange={e => set('posventa', e.target.value)} /></Field>
      <Field label="Por qué ganamos"><textarea value={f.lec} onChange={e => set('lec', e.target.value)} placeholder="Factor diferencial para repetir" /></Field>
    </>}
  </Modal>;
}
