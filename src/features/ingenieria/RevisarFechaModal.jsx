import { useStore, useCtx } from '../../store/StoreProvider.jsx';
import { Modal, Field, Options, EspecialistaSelect, useForm, useToast } from '../../components/ui/index.js';
import { MOTIVOS_REVISION } from '../../domain/constants.js';
import { hoyISO, fd, nowTs } from '../../domain/format.js';
import { espVigente } from '../../domain/ingenieria.js';
import { espLabel, writeEsp } from './casoUtils.js';

/** Revisa (replanifica) la fecha comprometida: agrega una revisión y fija fRevisada; nunca cambia fComprometida. */
export default function RevisarFechaModal({ casoId, i, onClose }) {
  const { state, actions } = useStore(); const ctx = useCtx(); const toast = useToast();
  const s = state.solicitudes.find(x => x.id === casoId);
  const cur = s?.esp?.[i];
  const [f, set] = useForm({ fecha: '', por: s?.coordinador || ctx.coordDef, motivo: MOTIVOS_REVISION[0], detalle: '' });
  if (!cur) return null;
  const vig = espVigente(cur);
  const ok = () => {
    const d = f.detalle.trim();
    if (!f.fecha) throw new Error('Indica la nueva fecha.');
    if (f.fecha === vig) throw new Error('La nueva fecha es igual a la vigente.');
    if (f.fecha < hoyISO()) throw new Error('La fecha revisada no puede estar en el pasado.');
    if (!f.por) throw new Error('Indica qué coordinador revisa la fecha.');
    if (f.motivo === 'Otro' && !d) throw new Error('Describe el motivo.');
    writeEsp(actions, s, i, { ...cur, fRevisada: f.fecha, revisiones: [...(cur.revisiones || []), { f: f.fecha, ant: vig, motivo: f.motivo, detalle: d, por: f.por, fReg: hoyISO(), ts: nowTs() }] },
      `${cur.esp}: fecha comprometida revisada ${fd(vig)} → ${fd(f.fecha)} (${f.motivo}${d ? ': ' + d : ''}; ${f.por}).`);
    toast('Guardado');
  };
  return <Modal title={`Revisar fecha · ${espLabel(cur.esp)}`} subtitle={`${s.id} · vigente ${fd(vig)} · comprometida original ${fd(cur.fComprometida)} · cambios: ${(cur.revisiones || []).length}`}
    onClose={onClose} onOk={ok} okLabel="Guardar revisión">
    <div className="grid g2">
      <Field label="Nueva fecha comprometida revisada"><input type="date" min={hoyISO()} value={f.fecha} onChange={e => set('fecha', e.target.value)} /></Field>
      <Field label="Revisada por (coordinador)"><EspecialistaSelect blank="Elegir…" value={f.por} onChange={v => set('por', v)} /></Field>
      <Field label="Motivo"><select value={f.motivo} onChange={e => set('motivo', e.target.value)}><Options list={MOTIVOS_REVISION} /></select></Field>
      <Field label={f.motivo === 'Otro' ? 'Detalle' : 'Detalle (opcional)'}><input type="text" value={f.detalle} onChange={e => set('detalle', e.target.value)} placeholder="Ej.: El cliente envió planos nuevos el 22/10" /></Field>
    </div>
    <p className="muted" style={{ fontSize: 12.5 }}>La fecha comprometida original no cambia: es la base para medir el cumplimiento. Esta revisión suma 1 al contador y queda en el historial.</p>
  </Modal>;
}
