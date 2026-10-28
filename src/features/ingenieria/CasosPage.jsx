import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, useCtx } from '../../store/StoreProvider.jsx';
import { useDrawer } from '../../app/useDrawer.js';
import { Stat, Tabs } from '../../components/ui/index.js';
import { ESPECIALIDADES } from '../../domain/constants.js';
import { hoyISO, pct } from '../../domain/format.js';
import { csvOf, downloadText } from '../../domain/csv.js';
import { allEsp, cumplAgg, espCumpl, espFinal, espKey, espRubro, espVigente } from '../../domain/ingenieria.js';
import { solTitulo, csvCols, ESTADOS_CASO, FILTROS_C, FILTRO_K } from './casoUtils.js';
import DatesTable from './DatesTable.jsx';
import CasosList from './CasosList.jsx';
import Indicadores from './Indicadores.jsx';
import NewCaseModal from './NewCaseModal.jsx';
import RevisarFechaModal from './RevisarFechaModal.jsx';
import EntregaModal from './EntregaModal.jsx';

/* Filtros de la vista: se conservan mientras la aplicación esté abierta (como en la v2.3). */
let memo = { tab: 'fechas', q: '', estado: '', esp: '', quien: '', pend: false, filtroC: '' };

function HeroEmpty({ ctx, onNew, onOpps }) {
  return <div className="hero-empty"><h2>Aún no hay casos técnicos registrados</h2>
    <p>Cada caso técnico se crea al convocar el kickoff con ingeniería. Por cada especialidad ({ESPECIALIDADES.join(', ')}) se controlan tres fechas:</p>
    <ol className="flow3">
      <li><b>Fecha comprometida</b><span>La fija el coordinador técnico ({ctx.coordDef}) con su equipo. Solo se corrige el mismo día; luego queda fija y es la base de medición.</span></li>
      <li><b>Fecha de entrega comprometida revisada</b><span>Se actualiza cada vez que se replanifica, con motivo. El sistema cuenta los cambios y guarda el historial.</span></li>
      <li><b>Fecha de entrega final</b><span>La fecha real de entrega. Se compara con la comprometida original: a tiempo, dentro de lo revisado o con atraso.</span></li>
    </ol>
    <div className="toolbar" style={{ justifyContent: 'center' }}>
      <button className="btn pri" type="button" onClick={onNew}>+ Nuevo caso técnico</button>
      <button className="btn" type="button" onClick={onOpps}>Crear desde una oportunidad</button></div>
  </div>;
}

export default function CasosPage() {
  const { state } = useStore(); const ctx = useCtx(); const d = useDrawer(); const navigate = useNavigate();
  const [f, setF] = useState(memo);
  const set = ch => setF(x => (memo = { ...x, ...ch }));
  const [modal, setModal] = useState(null); // {type:'nuevo'|'rev'|'ent', id, i}
  const sols = state.solicitudes, P = ctx.params;
  const tit = s => solTitulo(s, state.opps, ctx);

  const v = useMemo(() => {
    const q = f.q.toLowerCase();
    const match = s => (!f.estado || s.estado === f.estado) && (!q || [s.id, s.alcance, solTitulo(s, state.opps, ctx), s.coordinador, ...(s.esp || []).map(e => e.especialista + ' ' + espRubro(e))].join(' ').toLowerCase().includes(q));
    const espOk = e => (!f.esp || espKey(e.esp) === f.esp) && (!f.quien || e.especialista === f.quien);
    const L = sols.filter(s => (match(s) && (s.esp || []).some(espOk)) || (!f.esp && !f.quien && match(s) && !(s.esp || []).length))
      .sort((a, b) => (b.estado === 'Abierta') - (a.estado === 'Abierta') || b.id.localeCompare(a.id));
    const A = sols.filter(s => s.estado === 'Abierta'), G = cumplAgg(allEsp(sols), P);
    const rows = L.flatMap(s => (s.esp || []).map((e, i) => ({ s, e, i })).filter(r => espOk(r.e)))
      .filter(r => !f.pend || !espFinal(r.e))
      .filter(r => !f.filtroC || f.filtroC === 'abiertos' || espCumpl(r.e, r.s.estado === 'Abierta', P).k === FILTRO_K[f.filtroC])
      .sort((a, b) => (espVigente(a.e) || '9999').localeCompare(espVigente(b.e) || '9999'));
    const quienes = [...new Set([...ctx.especialistasActivos.map(x => x.nombre), ...sols.flatMap(s => (s.esp || []).map(e => e.especialista))].filter(Boolean))].sort();
    return { L, A, G, rows, quienes };
  }, [f, sols, state.opps, ctx, P]);

  const open = id => d.open('caso', id);
  const modals = <>
    {modal?.type === 'nuevo' && <NewCaseModal onClose={() => setModal(null)} onCreated={open} />}
    {modal?.type === 'rev' && <RevisarFechaModal casoId={modal.id} i={modal.i} onClose={() => setModal(null)} />}
    {modal?.type === 'ent' && <EntregaModal casoId={modal.id} i={modal.i} onClose={() => setModal(null)} />}
  </>;
  if (!sols.length) return <><HeroEmpty ctx={ctx} onNew={() => setModal({ type: 'nuevo' })} onOpps={() => navigate('/oportunidades')} />{modals}</>;

  const { L, A, G, rows, quienes } = v;
  const statF = k => () => set({ tab: 'fechas', estado: 'Abierta', pend: true, filtroC: k });
  const exportar = () => {
    const R = sols.flatMap(s => (s.esp || []).map(e => ({ s, e })));
    downloadText(`VOYANT_casos_tecnicos_${hoyISO()}.csv`, csvOf(csvCols(tit, P), R), 'text/csv;charset=utf-8');
  };
  return <>
    <div className="stats">
      <Stat label="Casos abiertos" value={A.length} detail={`${A.reduce((t, s) => t + (s.esp || []).length, 0)} especialidades`} active={f.filtroC === 'abiertos'} onClick={statF('abiertos')} />
      <Stat label="Entregas vencidas" value={G.venc} detail="fecha vigente ya pasó" tone={G.venc ? 'crit' : ''} active={f.filtroC === 'vencidas'} onClick={statF('vencidas')} />
      <Stat label="Por vencer" value={G.porv} detail={`en ${P.diasCompromisoAviso} días o menos`} tone={G.porv ? 'warn' : ''} active={f.filtroC === 'porvencer'} onClick={statF('porvencer')} />
      <Stat label="Sin fecha comprometida" value={G.sinFecha} detail="el coordinador debe fijarla" tone={G.sinFecha ? 'warn' : ''} active={f.filtroC === 'sinfecha'} onClick={statF('sinfecha')} />
      <Stat label="Cumplimiento" value={pct(G.pct)} detail={`${G.atiempo} de ${G.ent} en la fecha original`} />
    </div>
    <Tabs value={f.tab} onChange={tab => set({ tab })} tabs={[{ key: 'fechas', label: 'Fechas por especialidad', badge: rows.length }, { key: 'casos', label: 'Casos', badge: L.length }, { key: 'indicadores', label: 'Indicadores' }]} />
    {f.tab !== 'indicadores' && <div className="toolbar">
      <input type="search" placeholder="Buscar caso, oportunidad, cliente, especialista o rubro" aria-label="Buscar casos técnicos" value={f.q} onChange={e => set({ q: e.target.value })} />
      <select aria-label="Estado del caso" value={f.estado} onChange={e => set({ estado: e.target.value })}><option value="">Todos los estados</option>{ESTADOS_CASO.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      <select aria-label="Especialidad" value={f.esp} onChange={e => set({ esp: e.target.value })}><option value="">Todas las especialidades</option>{ESPECIALIDADES.map(x => <option key={x}>{x}</option>)}</select>
      <select aria-label="Especialista" value={f.quien} onChange={e => set({ quien: e.target.value })}><option value="">Todos los especialistas</option>{quienes.map(x => <option key={x}>{x}</option>)}</select>
      {f.filtroC && f.tab === 'fechas' && <button className="chipx" type="button" onClick={() => set({ filtroC: '' })}>Filtro: {FILTROS_C[f.filtroC]} ✕</button>}
      {f.tab === 'fechas' && <div className="checks"><label><input type="checkbox" checked={f.pend} onChange={e => set({ pend: e.target.checked })} />Solo pendientes de entrega</label></div>}
      <button className="btn sm" type="button" onClick={exportar}>Exportar CSV</button>
    </div>}
    {f.tab === 'fechas' && <DatesTable rows={rows} tit={tit} onOpen={open} onRev={(id, i) => setModal({ type: 'rev', id, i })} onEnt={(id, i) => setModal({ type: 'ent', id, i })} />}
    {f.tab === 'casos' && <CasosList list={L} tit={tit} onOpen={open} />}
    {f.tab === 'indicadores' && <Indicadores onEsp={esp => set({ esp, tab: 'fechas', pend: false, filtroC: '' })} onQuien={quien => set({ quien, tab: 'fechas', pend: false, filtroC: '' })} />}
    {modals}
  </>;
}
