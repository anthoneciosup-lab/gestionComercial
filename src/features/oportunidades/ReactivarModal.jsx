/** Reactivar una oportunidad en standby: etapa de entrada al pipeline y próxima acción. */
import { useCtx, useStore } from '../../store/StoreProvider.jsx';
import { ETAPAS_ABIERTAS } from '../../domain/constants.js';
import { addDays, etLabel, fd, hoyISO } from '../../domain/format.js';
import { cliName } from '../../domain/rules.js';
import { Field, Modal, RespSelect, useForm, useToast } from '../../components/ui/index.js';
import { AccionInput } from './shared.jsx';

export default function ReactivarModal({ opp: o, etapa, onClose }) {
  const { actions } = useStore(); const ctx = useCtx(); const toast = useToast();
  const ini = etapa || o.etapa || o.standby?.etapaPrevia || 'CALIFICACIÓN';
  const [f, set] = useForm({
    etapa: ETAPAS_ABIERTAS.includes(ini) ? ini : 'CALIFICACIÓN', accion: o.proxAccion || '',
    fecha: addDays(hoyISO(), ctx.params.diasPrimeraAccion), resp: ctx.respActivo(o.resp) ? o.resp : '',
  });
  const guardar = () => {
    const a = f.accion.trim();
    if (!a || !f.fecha) throw new Error('Define la próxima acción y su fecha.');
    if (!f.resp) throw new Error('Elige el responsable.');
    actions.updateOpp(o.id, { etapa: f.etapa, standby: null, proxAccion: a, fProxAccion: f.fecha, resp: f.resp },
      [{ t: `Reactivada desde standby a ${etLabel(f.etapa)}.`, tipo: 'Cambio de etapa' }, { t: `Próxima acción: ${a} (${fd(f.fecha)})` }]);
    toast('Guardado');
  };
  return <Modal title="Reactivar oportunidad" subtitle={`${o.numero || o.id} · ${cliName(o, ctx)} · en standby desde ${fd(o.standby?.desde)}`}
    onClose={onClose} onOk={guardar} okLabel="Reactivar">
    <div className="banner">Motivo del standby: <b>{o.standby?.motivo || '—'}</b></div>
    <Field label="Etapa en la que entra al pipeline">
      <select value={f.etapa} onChange={e => set('etapa', e.target.value)} autoFocus>{ETAPAS_ABIERTAS.map(e => <option key={e} value={e}>{etLabel(e)}</option>)}</select></Field>
    <fieldset className="nextbox"><legend>Próxima acción</legend>
      <Field label="Acción" full><AccionInput value={f.accion} onChange={v => set('accion', v)} /></Field>
      <Field label="Fecha"><input type="date" value={f.fecha} onChange={e => set('fecha', e.target.value)} /></Field>
      <Field label="Responsable"><RespSelect value={f.resp} onChange={v => set('resp', v)} blank="Elegir…" /></Field>
    </fieldset>
  </Modal>;
}
