import { useStore, useCtx } from '../../store/StoreProvider.jsx';
import { hoyISO, addDays, fd } from '../../domain/format.js';
import { cliName } from '../../domain/rules.js';
import { ACCIONES, TIPOS_BIT } from '../../domain/constants.js';
import { Modal, Field, Options, RespSelect, useForm, useToast } from '../../components/ui/index.js';
import ContactPicker from './ContactPicker.jsx';

/**
 * Registrar el resultado de la próxima acción y definir la siguiente (o definirla si no había).
 * Todo queda en la bitácora.
 */
export default function ActionModal({ opp: o, onClose }) {
  const { actions } = useStore(), ctx = useCtx(), toast = useToast();
  const [f, set] = useForm({ tipo: TIPOS_BIT[0], fecha: hoyISO(), contacto: '', res: '', na: '',
    nf: addDays(hoyISO(), ctx.params.diasProxAccion), resp: ctx.respActivo(o.resp) ? o.resp : '' });
  const ok = () => {
    const na = f.na.trim(), res = f.res.trim();
    if (o.proxAccion && !res) throw new Error('Escribe el resultado de la acción.');
    if (!na || !f.nf) throw new Error('La siguiente acción y su fecha son obligatorias.');
    if (!f.resp) throw new Error('Elige el responsable de la siguiente acción.');
    const log = [];
    if (res) log.push({ f: f.fecha, t: `${o.proxAccion}: ${res}`, tipo: f.tipo, a: f.resp, contacto: f.contacto });
    log.push({ t: `Próxima acción: ${na} (${fd(f.nf)})`, tipo: 'Nota', a: f.resp });
    actions.updateOpp(o.id, { proxAccion: na, fProxAccion: f.nf, resp: f.resp }, log);
    toast('Guardado');
  };
  return <Modal title={`${o.proxAccion ? 'Registrar resultado' : 'Definir próxima acción'} · ${o.numero || o.id}`}
    subtitle={`${cliName(o, ctx)} · ${o.ref || ''}`} onClose={onClose} onOk={ok} okLabel="Guardar">
    {o.proxAccion && <>
      <div className="banner">Acción actual: <b>{o.proxAccion}</b> ({fd(o.fProxAccion)})</div>
      <div className="grid g3">
        <Field label="Tipo de contacto"><select value={f.tipo} onChange={e => set('tipo', e.target.value)}><Options list={TIPOS_BIT} /></select></Field>
        <Field label="Fecha"><input type="date" value={f.fecha} onChange={e => set('fecha', e.target.value)} /></Field>
        <Field label="Con quién (contacto)"><ContactPicker o={o} value={f.contacto} onChange={v => set('contacto', v)} /></Field>
      </div>
      <Field label="¿Qué pasó? ¿Qué respondió el cliente?"><textarea value={f.res} onChange={e => set('res', e.target.value)} /></Field>
    </>}
    <fieldset className="nextbox"><legend>Siguiente acción</legend>
      <Field full label="Acción (redáctala: qué, con quién y para qué)">
        <input type="text" list="acc-agenda" value={f.na} onChange={e => set('na', e.target.value)} placeholder="Ej.: Llamar a Kevin Rojas para confirmar fecha de parada" />
        <datalist id="acc-agenda">{ACCIONES.map(a => <option key={a} value={a} />)}</datalist></Field>
      <Field label="Fecha límite"><input type="date" value={f.nf} onChange={e => set('nf', e.target.value)} /></Field>
      <Field label="Responsable"><RespSelect value={f.resp} onChange={v => set('resp', v)} blank="Elegir…" /></Field>
    </fieldset>
  </Modal>;
}
