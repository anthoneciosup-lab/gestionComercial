/** Pestaña Bitácora: línea de tiempo y alta de entradas (solo se agregan, nunca se borran). */
import { useStore } from '../../../store/StoreProvider.jsx';
import { TIPOS_BIT } from '../../../domain/constants.js';
import { fd, hoyISO } from '../../../domain/format.js';
import { Field, Options, useForm, useToast } from '../../../components/ui/index.js';
import { ContactPicker, contactosDeOpp } from '../shared.jsx';

export function sortBitacora(list) {
  return [...(list || [])].sort((a, b) => (b.f || '').localeCompare(a.f || '') || (b.ts || '').localeCompare(a.ts || ''));
}

export default function BitacoraTab({ o }) {
  const { state, actions } = useStore(); const toast = useToast();
  const [f, set, setF] = useForm({ tipo: TIPOS_BIT[0], f: hoyISO(), k: '', t: '' });
  const ks = contactosDeOpp(o, state.contacts);
  const B = sortBitacora(o.bitacora);

  const agregar = () => {
    const t = f.t.trim();
    if (!t) { toast('Escribe qué pasó.'); return; }
    try {
      actions.updateOpp(o.id, {}, { f: f.f || hoyISO(), t, tipo: f.tipo, contacto: f.k });
      toast('Guardado'); setF({ tipo: TIPOS_BIT[0], f: hoyISO(), k: '', t: '' });
    } catch (e) { toast(e.message); }
  };

  return <>
    <fieldset><legend>Nueva entrada</legend>
      <Field label="Tipo"><select value={f.tipo} onChange={e => set('tipo', e.target.value)}><Options list={TIPOS_BIT} /></select></Field>
      <Field label="Fecha"><input type="date" value={f.f} onChange={e => set('f', e.target.value)} /></Field>
      <Field label="Con quién (contacto del cliente)" full><ContactPicker list={ks} value={f.k} onChange={v => set('k', v)} /></Field>
      <Field label="Qué pasó" full><textarea value={f.t} onChange={e => set('t', e.target.value)} placeholder="Ej.: El cliente confirma que el CAPEX se aprobó; la licitación sale a fines de junio" /></Field>
      <div className="full"><button className="btn pri" type="button" onClick={agregar}>Agregar a la bitácora</button></div>
    </fieldset>
    <div className="card">
      {B.length ? <div className="tl">{B.map((e, i) => {
        const k = e.contacto && state.contacts.find(x => x.id === e.contacto);
        return <div key={(e.ts || '') + i} className={`e ${e.tipo === 'Cambio de etapa' ? 'auto' : ''}`}>
          <div className="h"><span className="date">{e.f ? fd(e.f) : 'sin fecha'}</span><b>{e.tipo || 'Nota'}</b>
            {e.a && <span>{e.a}</span>}{k && <span>· con {k.nombre}</span>}{e.origen === 'Excel' && <span>· del Excel</span>}</div>
          <p>{e.t}</p>
        </div>;
      })}</div> : <div className="empty">Esta oportunidad no tiene bitácora. Registra el primer contacto.</div>}
    </div>
  </>;
}
