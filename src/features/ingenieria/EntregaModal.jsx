import { useState } from 'react';
import { useStore, useCtx } from '../../store/StoreProvider.jsx';
import { Modal, Field, EspecialistaSelect, useToast } from '../../components/ui/index.js';
import { ENTREGABLES, ETAPAS_ING } from '../../domain/constants.js';
import { hoyISO, fd } from '../../domain/format.js';
import { espCumpl } from '../../domain/ingenieria.js';
import { espLabel, writeEsp, solTitulo } from './casoUtils.js';
import Entregables, { entValue } from './Entregables.jsx';

/** Registra la entrega final de una especialidad (fecha real, especialista, entregables y consultas). */
export default function EntregaModal({ casoId, i, onClose }) {
  const { state, actions } = useStore(); const ctx = useCtx(); const toast = useToast();
  const s = state.solicitudes.find(x => x.id === casoId);
  const cur = s?.esp?.[i];
  const [fecha, setFecha] = useState(hoyISO());
  const [quien, setQuien] = useState(cur?.especialista || '');
  const [ent, setEnt] = useState({ ...(cur?.ent || {}) });
  const [noConsultas, setNoConsultas] = useState(true);
  if (!cur) return null;
  const askConsultas = !cur.fConsultas && !cur.sinConsultas;
  const marcarTodos = () => setEnt(x => { const n = { ...x }; ENTREGABLES.forEach(([k]) => { if (!n[k] || n[k].st === 'pend') n[k] = entValue('ok'); }); return n; });
  const ok = () => {
    if (!fecha) throw new Error('Indica la fecha de entrega final.');
    if (fecha > hoyISO()) throw new Error('La entrega final es una fecha real: no puede ser futura.');
    if (cur.fAsignado && fecha < cur.fAsignado) throw new Error('No puede ser anterior a la asignación.');
    if (!quien) throw new Error('Sin dueño técnico no se entrega: asigna el especialista.');
    const pend = ENTREGABLES.filter(([k]) => ent[k]?.st !== 'ok' && ent[k]?.st !== 'na');
    if (pend.length) throw new Error('Faltan entregables: ' + pend.map(x => x[1]).join(', ') + '.');
    if (askConsultas && !noConsultas) throw new Error('Registra en la ficha la fecha de envío de consultas, o marca que no se requirieron.');
    const ix = Math.max(ETAPAS_ING.indexOf(cur.etapa), 4);
    const ne = { ...cur, especialista: quien, ent, etapa: ETAPAS_ING[ix], fEntregaFinal: fecha, fSolucion: fecha, sinConsultas: cur.sinConsultas || (askConsultas ? noConsultas : false) };
    const c = espCumpl(ne, true, ctx.params);
    writeEsp(actions, s, i, ne, `${cur.esp}: entrega final ${fd(fecha)} · ${c.t}.`);
    if (state.opps.some(x => x.id === s.oppId)) actions.updateOpp(s.oppId, {}, { t: `Ingeniería ${s.id}: ${cur.esp} — solución entregada ${fd(fecha)} (${c.t}).`, tipo: 'Nota' });
    toast('Guardado');
  };
  return <Modal title={`Registrar entrega final · ${espLabel(cur.esp)}`} subtitle={`${s.id} · ${solTitulo(s, state.opps, ctx)}`} onClose={onClose} onOk={ok} okLabel="Registrar entrega">
    <div className="grid g2">
      <Field label="Fecha de entrega final"><input type="date" max={hoyISO()} value={fecha} onChange={e => setFecha(e.target.value)} /></Field>
      <Field label="Especialista"><EspecialistaSelect value={quien} onChange={setQuien} /></Field>
    </div>
    {askConsultas && <div className="checks"><label><input type="checkbox" checked={noConsultas} onChange={e => setNoConsultas(e.target.checked)} />No requirió consultas al cliente</label></div>}
    <div className="f"><span>Entregables de la solución técnica</span>
      <Entregables ent={ent} showDate={false} order={[['ok', 'Listo'], ['na', 'N/A'], ['pend', 'Pendiente']]} onSet={(k, st) => setEnt(x => ({ ...x, [k]: entValue(st) }))} />
      <button className="btn sm" type="button" style={{ marginTop: 6, alignSelf: 'flex-start' }} onClick={marcarTodos}>Marcar todos los pendientes como listos</button>
    </div>
  </Modal>;
}
