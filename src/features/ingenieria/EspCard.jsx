import { useState } from 'react';
import { useStore, useCtx } from '../../store/StoreProvider.jsx';
import { Field, Options, EspecialistaSelect, RubroSelect, CumplChip, useToast } from '../../components/ui/index.js';
import { ETAPAS_ING, ENTREGABLES } from '../../domain/constants.js';
import { hoyISO, fd, diffDays, pct, clone } from '../../domain/format.js';
import { espKey, espIdx, espFinal, espRubro, espAvance, espCumpl, compCorregible } from '../../domain/ingenieria.js';
import { espLabel, writeEsp } from './casoUtils.js';
import Entregables, { entValue } from './Entregables.jsx';

const draftOf = (e, s) => ({ ...clone(e), ent: clone(e.ent || {}), compPor: e.compPor || s.coordinador || '', fin: espFinal(e) || '' });

function Stepper({ e }) {
  const ix = espIdx(e);
  return <ol className="stepper">{ETAPAS_ING.map((st, i) => <li key={st} className={i < ix ? 'done' : i === ix ? 'cur' : ''}>{st}</li>)}</ol>;
}

/** Las tres fechas (comprometida, revisada, entrega final) + cumplimiento e historial. */
function DatesBlock({ s, e, x, setX, onRev }) {
  const ctx = useCtx();
  const open = s.estado === 'Abierta', c = espCumpl(e, open, ctx.params), fin = espFinal(e), revs = e.revisiones || [];
  return <>
    <div className="dates3">
      <div className="d3"><span className="l">1 · Fecha comprometida <small>(coordinador técnico · corregible solo el día que se registra)</small></span>
        {compCorregible(e) ? <>
          <input type="date" value={x.fComprometida || ''} onChange={ev => setX('fComprometida', ev.target.value || null)} aria-label="Fecha comprometida" />
          <EspecialistaSelect blank="Coordinador…" value={x.compPor} onChange={v => setX('compPor', v)} aria-label="Coordinador que compromete" />
        </> : <b className="num">{fd(e.fComprometida)}</b>}
        {e.fComprometida && <small className="muted">por {e.compPor || '—'} · registrada {fd(e.compFecha)}</small>}</div>
      <div className="d3"><span className="l">2 · Entrega comprometida revisada</span><b className="num">{e.fRevisada ? fd(e.fRevisada) : '—'}</b>
        <small className="muted">Cambios de fecha: <b>{revs.length}</b>{revs.length > 0 && ` · último motivo: ${revs[revs.length - 1].motivo}`}</small>
        {e.fComprometida && !fin && open && <button className="btn sm" type="button" onClick={onRev}>Revisar fecha</button>}</div>
      <div className="d3"><span className="l">3 · Fecha de entrega final</span>
        <input type="date" max={hoyISO()} value={x.fin} onChange={ev => setX('fin', ev.target.value)} aria-label="Fecha de entrega final" />
        <small className="muted">{fin && e.fAsignado ? `${diffDays(fin, e.fAsignado)} días desde la asignación` : 'al registrarla, la especialidad pasa a “Solución entregada”'}</small></div>
      <div className="d3 res"><span className="l">Cumplimiento</span>
        {s.fRequeridaSolucion && <small className="muted">requerida por comercial: {fd(s.fRequeridaSolucion)}</small>}
        <CumplChip c={c} />
        {c.d != null && fin && <small className="muted">desvío vs. original: {c.d > 0 ? '+' : ''}{c.d} d</small>}</div>
    </div>
    {revs.length > 0 && <details className="revs"><summary>Ver historial de fecha comprometida ({revs.length + 1})</summary><ol>
      <li>{fd(e.fComprometida)} · fecha comprometida original · {e.compPor || ''}</li>
      {revs.map((r, k) => <li key={r.ts || k}>{fd(r.ant)} → <b>{fd(r.f)}</b> · {r.motivo}{r.detalle ? ': ' + r.detalle : ''} · {r.por || ''} · {fd(r.fReg)}</li>)}</ol></details>}
  </>;
}

/** Valida y arma la especialidad a guardar. Devuelve {e, parts} o lanza Error. */
function buildEsp(prev, x) {
  const e = { ...prev, ent: x.ent, especialista: x.especialista, notas: (x.notas || '').trim(), sinConsultas: !!x.sinConsultas };
  e.fConsultas = e.sinConsultas ? null : (x.fConsultas || null);
  e.rubro = x.rubro || ''; e.rubroOtro = e.rubro === 'Otro' ? (x.rubroOtro || '').trim() : '';
  if (e.rubro === 'Otro' && !e.rubroOtro) throw new Error('Especifica el rubro marcado como “Otro”.');
  if (compCorregible(prev)) {
    const fc = x.fComprometida || null, cp = x.compPor || '';
    if (fc && !cp) throw new Error('Indica qué coordinador técnico compromete la fecha.');
    if (fc && e.fAsignado && fc < e.fAsignado) throw new Error('La fecha comprometida no puede ser anterior a la asignación.');
    if (fc !== (prev.fComprometida || null) || (fc && cp !== (prev.compPor || ''))) { e.fComprometida = fc; e.compPor = fc ? cp : ''; e.compFecha = fc ? hoyISO() : null; }
  }
  const fin = x.fin || null;
  if (fin && e.fAsignado && fin < e.fAsignado) throw new Error('La entrega final no puede ser anterior a la asignación.');
  if (fin && fin > hoyISO()) throw new Error('La entrega final es una fecha real: no puede estar en el futuro.');
  let et = x.etapa; if (fin && ETAPAS_ING.indexOf(et) < 4) et = 'Solución entregada';
  const ix = ETAPAS_ING.indexOf(et);
  const pend = ENTREGABLES.filter(([k]) => e.ent[k]?.st !== 'na').filter(([k]) => e.ent[k]?.st !== 'ok');
  if (ix >= 4 && pend.length) throw new Error(`Para entregar la solución faltan: ${pend.map(p => p[1]).join(', ')}. Márcalos como listos o N/A.`);
  if (ix >= 4 && !e.especialista) throw new Error('Sin dueño técnico no se costea: asigna el especialista.');
  if (ix >= 3 && !e.fConsultas && !e.sinConsultas && espIdx(prev) < 3) throw new Error('Registra la fecha de envío de consultas o marca “No requiere consultas”.');
  e.etapa = et;
  if (ix >= 4) { e.fEntregaFinal = fin || prev.fEntregaFinal || prev.fSolucion || hoyISO(); e.fSolucion = e.fEntregaFinal; } else { e.fEntregaFinal = null; e.fSolucion = null; }
  if (ix >= 6 && !e.fCosteo) e.fCosteo = hoyISO(); if (ix < 6) e.fCosteo = null;
  const parts = [];
  if (prev.etapa !== e.etapa) parts.push(`${prev.etapa} → ${e.etapa}`);
  if (prev.especialista !== e.especialista) parts.push(`especialista: ${e.especialista || 'sin asignar'}`);
  const dOk = ENTREGABLES.filter(([k]) => e.ent[k]?.st === 'ok' && (prev.ent || {})[k]?.st !== 'ok').map(p => p[1]); if (dOk.length) parts.push('listo: ' + dOk.join(', '));
  if (e.fConsultas && e.fConsultas !== prev.fConsultas) parts.push(`consultas enviadas ${fd(e.fConsultas)}`);
  if ((e.fComprometida || null) !== (prev.fComprometida || null)) parts.push(e.fComprometida ? `fecha comprometida ${fd(e.fComprometida)} (${e.compPor})` : 'fecha comprometida retirada');
  if (e.fEntregaFinal && e.fEntregaFinal !== (prev.fEntregaFinal || null)) parts.push(`entrega final ${fd(e.fEntregaFinal)} · ${espCumpl(e).t}`);
  if (espRubro(e) !== espRubro(prev)) parts.push(`rubro: ${espRubro(e) || 'sin definir'}`);
  if (e.sinConsultas && !prev.sinConsultas) parts.push('no requiere consultas');
  return { e, parts };
}

/** Tarjeta de una especialidad dentro de la ficha del caso. */
export default function EspCard({ s, i, opp, onRev, onRemove }) {
  const { actions } = useStore(); const toast = useToast();
  const e = s.esp[i];
  const [base, setBase] = useState(e);
  const [x, setXs] = useState(() => draftOf(e, s));
  const [err, setErr] = useState('');
  if (base !== e) { setBase(e); setXs(draftOf(e, s)); setErr(''); } // la especialidad cambió (guardado o revisión)
  const setX = (k, v) => setXs(d => ({ ...d, [k]: v }));
  const save = () => {
    setErr('');
    try {
      const { e: ne, parts } = buildEsp(e, x);
      writeEsp(actions, s, i, ne, `${ne.esp}: ${parts.join('; ') || 'actualizado'}.`);
      if (opp && e.etapa !== ne.etapa && ['Solución entregada', 'Costeo listo'].includes(ne.etapa)) actions.updateOpp(opp.id, {}, { t: `Ingeniería ${s.id}: ${ne.esp} — ${ne.etapa}.`, tipo: 'Nota' });
      toast('Guardado');
    } catch (ex) { setErr(ex.message); }
  };
  return <div className="espcard">
    <div className="eh"><b>{e.esp}{espRubro(e) && <span className="muted" style={{ fontWeight: 500 }}> · {espRubro(e)}</span>}</b><span className="num">{pct(espAvance(e))} entregables</span></div>
    <Stepper e={e} />
    <DatesBlock s={s} e={e} x={x} setX={setX} onRev={onRev} />
    <div className="grid g2">
      <Field label="Rubro (a qué corresponde)"><RubroSelect especialidad={espKey(e.esp)} blank="Sin definir" value={x.rubro} onChange={v => setX('rubro', v)} /></Field>
      <Field label="Otro rubro"><input type="text" value={x.rubroOtro || ''} disabled={x.rubro !== 'Otro'} onChange={ev => setX('rubroOtro', ev.target.value)} placeholder="Solo si el rubro es “Otro”" /></Field>
    </div>
    <div className="grid g3">
      <Field label="Especialista"><EspecialistaSelect value={x.especialista} onChange={v => setX('especialista', v)} /></Field>
      <Field label="Etapa"><select value={x.etapa} onChange={ev => setX('etapa', ev.target.value)}><Options list={ETAPAS_ING} /></select></Field>
      <Field label="Consultas enviadas"><input type="date" value={x.fConsultas || ''} disabled={x.sinConsultas} onChange={ev => setX('fConsultas', ev.target.value || null)} /></Field>
    </div>
    <div className="checks" style={{ margin: '4px 0' }}><label><input type="checkbox" checked={!!x.sinConsultas} onChange={ev => setX('sinConsultas', ev.target.checked)} />No requiere consultas</label></div>
    <Entregables ent={x.ent} onSet={(k, st) => setXs(d => ({ ...d, ent: { ...d.ent, [k]: entValue(st) } }))} />
    <Field label="Notas del especialista"><input type="text" value={x.notas || ''} onChange={ev => setX('notas', ev.target.value)} placeholder="Ej.: Falta respuesta del cliente sobre tensión de servicio" /></Field>
    <div className="muted" style={{ fontSize: 11.5 }}>Asignado {fd(e.fAsignado)}{e.fSolucion && ` · solución entregada ${fd(e.fSolucion)} (${diffDays(e.fSolucion, e.fAsignado)} días)`}{e.fCosteo && ` · costeo listo ${fd(e.fCosteo)}`}</div>
    {err && <div className="err" role="alert">{err}</div>}
    <div className="toolbar"><button className="btn sm pri" type="button" onClick={save}>Guardar {espLabel(e.esp)}</button>
      {s.esp.length > 1 && <button className="btn sm danger" type="button" onClick={onRemove}>Quitar especialidad</button>}</div>
  </div>;
}
