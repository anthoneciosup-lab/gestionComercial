/** Pasar una oportunidad a standby (o actualizar el motivo y la fecha de revisión si ya lo está). */
import { useCtx, useStore } from '../../store/StoreProvider.jsx';
import { MOTIVOS_STANDBY } from '../../domain/constants.js';
import { addDays, fd, hoyISO, usd } from '../../domain/format.js';
import { cliName, isStandby } from '../../domain/rules.js';
import { Field, Modal, Options, useForm, useToast } from '../../components/ui/index.js';

/** El motivo guardado puede ser “Motivo: detalle” o un texto libre (Otro). */
function splitMotivo(m) {
  if (!m) return { motivo: MOTIVOS_STANDBY[0], det: '' };
  const base = MOTIVOS_STANDBY.find(x => m === x || m.startsWith(x + ': '));
  if (base) return { motivo: base, det: m.slice(base.length + 2) };
  return { motivo: 'Otro', det: m };
}

export default function StandbyModal({ opp: o, onClose }) {
  const { actions } = useStore(); const ctx = useCtx(); const toast = useToast();
  const sb = o.standby || {}; const isEdit = isStandby(o);
  const ini = splitMotivo(sb.motivo);
  const [f, set] = useForm({ motivo: ini.motivo, det: ini.det, fRev: sb.fRevision || addDays(hoyISO(), ctx.params.diasStandbyRevision), nota: sb.nota || '' });

  const guardar = () => {
    const d = f.det.trim(); let m = f.motivo;
    if (m === 'Otro') { if (!d) throw new Error('Describe el motivo.'); m = d; } else if (d) m = m + ': ' + d;
    if (!f.fRev) throw new Error('Indica cuándo se revisa.');
    const nota = f.nota.trim();
    actions.updateOpp(o.id, { standby: { motivo: m, desde: sb.desde || hoyISO(), fRevision: f.fRev, etapaPrevia: o.etapa || sb.etapaPrevia || '', nota }, forecast: '' },
      { t: `${isEdit ? 'Standby actualizado' : 'Pasó a standby'}: ${m}. Revisar el ${fd(f.fRev)}.${nota ? ' ' + nota : ''}`, tipo: 'Cambio de etapa' });
    toast('Guardado');
  };

  return <Modal title={isEdit ? 'Actualizar standby' : 'Pasar a standby'} subtitle={`${o.numero || o.id} · ${cliName(o, ctx)} · ${usd(o.monto, false)}`}
    onClose={onClose} onOk={guardar} okLabel={isEdit ? 'Guardar' : 'Pasar a standby'}>
    <div className="banner">Standby saca la oportunidad del pipeline activo sin perderla: no cuenta en el embudo ni en el pronóstico. Se usa cuando no se puede ubicar en una etapa porque el cliente pospuso, pausó o no ha definido.</div>
    <Field label="Motivo"><select value={f.motivo} onChange={e => set('motivo', e.target.value)} autoFocus><Options list={MOTIVOS_STANDBY} /></select></Field>
    <Field label={f.motivo === 'Otro' ? 'Describe el motivo' : 'Detalle del motivo (opcional)'}>
      <input type="text" value={f.det} onChange={e => set('det', e.target.value)} placeholder="Ej.: El presupuesto pasó a 2027" /></Field>
    <Field label="Fecha en que se vuelve a revisar"><input type="date" value={f.fRev} onChange={e => set('fRev', e.target.value)} /></Field>
    <Field label="Nota (opcional)"><textarea value={f.nota} onChange={e => set('nota', e.target.value)} placeholder="Qué hay que confirmar con el cliente al revisar" /></Field>
  </Modal>;
}
