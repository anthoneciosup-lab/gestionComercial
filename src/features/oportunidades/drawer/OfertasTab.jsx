/** Pestaña Ofertas: versiones enviadas (fecha, monto, responsable del envío, contacto y cambios). */
import { useCtx, useStore } from '../../../store/StoreProvider.jsx';
import { fd, hoyISO, usd } from '../../../domain/format.js';
import { Field, RespSelect, useForm, useToast } from '../../../components/ui/index.js';
import { ContactPicker, contactosDeOpp, numOrNull } from '../shared.jsx';

const initVersion = (o, ctx) => ({
  v: String((o.version || 0) + ((o.versiones || []).length ? 1 : 0)), f: hoyISO(), monto: o.monto ?? '',
  resp: ctx.respActivo(o.resp) ? o.resp : '', k: '', nota: '',
});

export default function OfertasTab({ o }) {
  const { state, actions } = useStore(); const ctx = useCtx(); const toast = useToast();
  const [f, set, setF] = useForm(() => initVersion(o, ctx));
  const ks = contactosDeOpp(o, state.contacts);
  const V = [...(o.versiones || [])].sort((a, b) => (b.f || '').localeCompare(a.f || ''));
  const nombreK = id => state.contacts.find(k => k.id === id)?.nombre || '';

  const registrar = () => {
    if (!f.f) { toast('Indica la fecha de envío.'); return; }
    if (!f.resp) { toast('Elige el responsable del envío.'); return; }
    const to = nombreK(f.k);
    const v = { v: parseInt(f.v, 10) || 0, f: f.f, monto: numOrNull(f.monto), resp: f.resp, contacto: f.k, to, nota: f.nota.trim() };
    try {
      actions.updateOpp(o.id, { versiones: [...(o.versiones || []), v], version: v.v, fUltimaOferta: v.f, monto: v.monto ?? o.monto },
        { f: v.f, t: `Oferta v${v.v} enviada por ${v.resp}${to ? ' a ' + to : ''} por ${usd(v.monto, false)}${v.nota ? '. ' + v.nota : ''}`, tipo: 'Oferta enviada', a: v.resp, contacto: f.k });
      toast('Guardado');
      setF({ ...initVersion({ ...o, version: v.v, versiones: [...(o.versiones || []), v] }, ctx), monto: v.monto ?? o.monto ?? '' });
    } catch (e) { toast(e.message); }
  };

  return <>
    <div className="banner">Cada versión enviada queda registrada con fecha, monto, quién la envió y qué cambió. La última actualiza el monto y la fecha de última oferta.</div>
    <fieldset><legend>Registrar oferta enviada</legend>
      <Field label="Versión"><input type="number" value={f.v} onChange={e => set('v', e.target.value)} /></Field>
      <Field label="Fecha de envío"><input type="date" value={f.f} onChange={e => set('f', e.target.value)} /></Field>
      <Field label="Monto USD"><input type="number" step="0.01" value={f.monto} onChange={e => set('monto', e.target.value)} /></Field>
      <Field label="Responsable del envío"><RespSelect value={f.resp} onChange={v => set('resp', v)} blank="Elegir…" /></Field>
      <Field label="Enviada a (contacto del cliente)" full><ContactPicker list={ks} value={f.k} onChange={v => set('k', v)} /></Field>
      <Field label="Cambios respecto a la versión anterior" full><textarea value={f.nota} onChange={e => set('nota', e.target.value)} placeholder="Ej.: Baterías VRLA plomo puro para reducir precio; descuento 6 %" /></Field>
      <div className="full"><button className="btn pri" type="button" onClick={registrar}>Registrar oferta</button></div>
    </fieldset>
    <div className="tw"><table>
      <thead><tr><th>Versión</th><th>Fecha</th><th className="r">Monto</th><th>Responsable del envío</th><th>Enviada a</th><th>Cambios</th></tr></thead>
      <tbody>
        {V.map((v, i) => <tr key={i}><td className="mono">v{v.v}</td><td>{fd(v.f)}</td><td className="r num">{usd(v.monto, false)}</td>
          <td>{v.resp || ''}</td><td>{v.to || nombreK(v.contacto)}</td><td>{v.nota || v.cambios || ''}</td></tr>)}
        {!V.length && <tr><td colSpan={6}><div className="empty">No hay ofertas registradas.</div></td></tr>}
      </tbody>
    </table></div>
  </>;
}
