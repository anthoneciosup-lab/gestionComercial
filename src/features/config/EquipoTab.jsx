/** Configuración → Equipo y reasignación: equipo comercial, especialistas, archivo y reasignación. */
import { useState } from 'react';
import { useStore, useCtx } from '../../store/StoreProvider.jsx';
import { useToast } from '../../components/ui/index.js';
import { clone, hoyISO } from '../../domain/format.js';
import { draftFrom, validarBorrador, renombresEquipo, renombresEsp, cambiosCasos, configDesde, abiertasDe } from './equipoOps.js';
import { EquipoCard, EspecialistasCard } from './EquipoTables.jsx';
import { EliminarPersonaModal, EliminarEspecialistaModal } from './EliminarModals.jsx';
import ArchivoCard from './ArchivoCard.jsx';
import { ReasignarTodasCard, PorReasignarCard } from './ReasignacionCards.jsx';
import ReasignarModal from '../oportunidades/ReasignarModal.jsx';

/** Borrador local + guardado con cascada. */
function useEquipo() {
  const { state, actions } = useStore(); const ctx = useCtx(); const toast = useToast();
  const [draft, setDraft] = useState(null);
  const dr = draft || draftFrom(state.config);
  const edit = fn => setDraft(cur => { const n = clone(cur || draftFrom(state.config)); fn(n); return n; });
  /** Guarda el borrador. extra: {reasignar:{de,a,nombre}} al eliminar a alguien del equipo; {reemplazo:{de,a}} al eliminar un especialista. */
  const persist = (d, extra = {}) => {
    const err = validarBorrador(d); if (err) throw new Error(err);
    const ren = renombresEquipo(d), renE = renombresEsp(d), { reasignar, reemplazo } = extra;
    let n = 0;
    if (reasignar) for (const o of abiertasDe(reasignar.de, state.opps)) {
      actions.updateOpp(o.id, { resp: reasignar.a }, { t: `Reasignada de ${reasignar.de} (${reasignar.nombre}) a ${reasignar.a} (${ctx.respName(reasignar.a)}) al eliminar a ${reasignar.nombre} del equipo.`, a: reasignar.a }); n++;
    }
    for (const [a, b] of ren) for (const o of state.opps.filter(x => x.resp === a)) { actions.updateOpp(o.id, { resp: b }, { t: `Iniciales del responsable actualizadas: ${a} → ${b}.`, a: b }); n++; }
    const casos = cambiosCasos(state.solicitudes, { esp: renE, ini: ren, reemplazo });
    for (const c of casos) actions.updateCaso(c.id, c.cambios, c.texto || undefined);
    let coord = state.config.coordinadorDefault;
    for (const [a, b] of renE) if (coord === a) coord = b;
    if (reemplazo && coord === reemplazo.de) coord = reemplazo.a || undefined;
    actions.setConfig(configDesde(state.config, d, coord));
    setDraft(null);
    toast(n || casos.length ? `Guardado · ${n} oportunidades y ${casos.length} casos actualizados` : 'Guardado');
  };
  return { dr, dirty: !!draft, edit, persist, descartar: () => setDraft(null) };
}

export default function EquipoTab() {
  const { state, actions } = useStore(); const toast = useToast();
  const { dr, dirty, edit, persist, descartar } = useEquipo();
  const [err, setErr] = useState(''); const [modal, setModal] = useState(null);
  const guardar = () => { setErr(''); try { persist(dr); } catch (e) { setErr(e.message); } };
  const sinArchivo = i => edit(d => d.equipo.splice(i, 1));

  const delPersona = i => { const p = dr.equipo[i]; if (!p._orig) return sinArchivo(i); setModal({ tipo: 'persona', p, i }); };
  const delEsp = i => { const p = dr.especialistas[i]; if (!p._orig) return edit(d => d.especialistas.splice(i, 1)); setModal({ tipo: 'esp', p, i }); };
  const confirmarPersona = to => {
    const d = clone(dr), { p, i } = modal; d.equipo.splice(i, 1); d.archivo.equipo.push({ ini: p._orig, nombre: p.nombre, eliminado: hoyISO() });
    persist(d, to ? { reasignar: { de: p._orig, a: to, nombre: p.nombre } } : {});
  };
  const confirmarEsp = to => {
    const d = clone(dr), { p, i } = modal; d.especialistas.splice(i, 1); d.archivo.especialistas.push({ nombre: p._orig, eliminado: hoyISO() });
    persist(d, { reemplazo: { de: p._orig, a: to } });
  };
  const restaurar = (tipo, i) => {
    const d = clone(dr);
    if (tipo === 'equipo') { const [p] = d.archivo.equipo.splice(i, 1); d.equipo.push({ ini: p.ini, nombre: p.nombre, activo: false, _orig: p.ini }); }
    else { const [p] = d.archivo.especialistas.splice(i, 1); d.especialistas.push({ nombre: p.nombre, activo: true, _orig: p.nombre }); }
    try { persist(d); } catch (e) { setErr(e.message); }
  };
  const setCoord = v => { actions.setConfig({ ...state.config, coordinadorDefault: v }); toast('Coordinador por defecto actualizado'); };

  return <>
    <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
      <EquipoCard dr={dr} edit={edit} onDelete={delPersona} onReasignar={ini => setModal({ tipo: 'reasignar', ini })} />
      <EspecialistasCard dr={dr} edit={edit} onDelete={delEsp} onCoord={setCoord} />
    </div>
    <div className="toolbar">
      <button className="btn pri" type="button" onClick={guardar} disabled={!dirty}>Guardar equipo y especialistas</button>
      <button className="btn" type="button" onClick={() => { descartar(); setErr(''); }} disabled={!dirty}>Descartar cambios</button>
      {dirty && <span className="muted" style={{ fontSize: 12.5 }}>Hay cambios sin guardar.</span>}
      {err && <span className="err">{err}</span>}
    </div>
    <ArchivoCard archivo={dr.archivo} onRestaurar={restaurar} />
    <ReasignarTodasCard />
    <PorReasignarCard />
    {modal?.tipo === 'persona' && <EliminarPersonaModal p={modal.p} onClose={() => setModal(null)} onConfirm={confirmarPersona} />}
    {modal?.tipo === 'esp' && <EliminarEspecialistaModal p={modal.p} onClose={() => setModal(null)} onConfirm={confirmarEsp} />}
    {modal?.tipo === 'reasignar' && <ReasignarModal list={abiertasDe(modal.ini, state.opps)} title={`Reasignar cartera de ${modal.ini} · ${dr.equipo.find(p => p._orig === modal.ini)?.nombre || modal.ini}`} onClose={() => setModal(null)} />}
  </>;
}
