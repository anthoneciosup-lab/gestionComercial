/** Configuración → Especialidades y rubros (catálogo editable, con marca “Validado por gerencia”). */
import { useState } from 'react';
import { useStore, useCtx } from '../../store/StoreProvider.jsx';
import { Modal, useToast } from '../../components/ui/index.js';
import { ESPECIALIDADES } from '../../domain/constants.js';
import { fd, hoyISO } from '../../domain/format.js';

const formDe = C => Object.fromEntries(ESPECIALIDADES.map(e => [e, { d: C[e].d, r: C[e].r.join('\n'), v: !!C[e].validado }]));

export default function CatalogoTab() {
  const { state, actions } = useStore(); const ctx = useCtx(); const toast = useToast();
  const C = ctx.catalog;
  const [f, setF] = useState(null); const [err, setErr] = useState(''); const [confirmar, setConfirmar] = useState(false);
  const form = f || formDe(C);
  const set = (e, k, v) => { setF({ ...form, [e]: { ...form[e], [k]: v } }); setErr(''); };
  const nv = ESPECIALIDADES.filter(e => !C[e].validado).length;
  const guardar = () => {
    const out = {};
    for (const e of ESPECIALIDADES) {
      const r = form[e].r.split('\n').map(x => x.trim()).filter(Boolean);
      if (!r.length) return setErr(`${e}: escribe al menos un rubro.`);
      out[e] = { d: form[e].d.trim(), r: [...new Set(r)], validado: form[e].v ? (C[e].validado || { f: hoyISO() }) : null };
    }
    actions.setConfig({ ...state.config, catalogo: out }); setF(null); toast('Especialidades y rubros guardados');
  };
  const restablecer = () => { const { catalogo, ...rest } = state.config; actions.setConfig(rest); setF(null); toast('Se restableció la propuesta inicial'); };
  return <div className="card"><h2>Especialidades y rubros <small>{nv ? `${nv} de ${ESPECIALIDADES.length} por validar con gerencia` : 'validadas por gerencia'}</small></h2>
    <div className="banner warn" style={{ marginBottom: 10 }}><span><b>Rubros opcionales.</b> Gerencia no los ha definido en detalle; se pueden usar desde ahora o completar más adelante. Indican a qué corresponde cada especialidad (qué potencia, qué mecánica…). Elegir un rubro en un caso técnico no es obligatorio. Para agrupar, escribe “Grupo · rubro” (por ejemplo, “Fibra óptica · Transmisión y backhaul”).</span></div>
    <div className="catgrid">{ESPECIALIDADES.map(e => <fieldset key={e} className="catf">
      <legend>{e} {C[e].validado ? <span className="cchip good">Validado {fd(C[e].validado.f)}</span> : <span className="cchip warn">Propuesta</span>}</legend>
      <label className="f">A qué corresponde<input type="text" value={form[e].d} onChange={ev => set(e, 'd', ev.target.value)} /></label>
      <label className="f">Rubros (uno por línea; para agrupar escribe “Grupo · rubro”)<textarea rows={8} value={form[e].r} onChange={ev => set(e, 'r', ev.target.value)} /></label>
      <label className="checks"><label><input type="checkbox" checked={form[e].v} onChange={ev => set(e, 'v', ev.target.checked)} />Validado por gerencia</label></label>
    </fieldset>)}</div>
    <div className="toolbar">
      <button className="btn pri" type="button" onClick={guardar}>Guardar especialidades y rubros</button>
      <button className="btn" type="button" onClick={() => setConfirmar(true)}>Volver a la propuesta inicial</button>
      {f && <button className="btn ghost" type="button" onClick={() => { setF(null); setErr(''); }}>Descartar cambios</button>}
      {err && <span className="err">{err}</span>}
    </div>
    {confirmar && <Modal title="Volver a la propuesta inicial" subtitle="Se reemplazan descripciones y rubros por la propuesta original y se quitan las marcas de validado."
      onClose={() => setConfirmar(false)} onOk={restablecer} okLabel="Restablecer" />}
  </div>;
}
