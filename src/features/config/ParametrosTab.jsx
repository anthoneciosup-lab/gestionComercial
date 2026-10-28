/** Configuración → Parámetros y estimaciones (umbrales, textos, probabilidad por etapa y plazos). */
import { useMemo, useState } from 'react';
import { useStore, useCtx } from '../../store/StoreProvider.jsx';
import { Modal, useToast } from '../../components/ui/index.js';
import { ETAPAS_ABIERTAS } from '../../domain/constants.js';
import { isActive } from '../../domain/rules.js';
import { etLabel } from '../../domain/format.js';

const PCT = ['commitMin', 'commitCierreMin', 'bestMin'];
const TXT = ['tasaCommit', 'tasaBest', 'tasaPipeline', 'periodo'];
const DIAS = [
  ['diasSinMovimiento', 'Alerta “sin movimiento” después de', 'días'], ['diasConsultasAviso', 'Aviso de consultas antes del límite', 'días'],
  ['diasProxAccion', 'Plazo sugerido de la siguiente acción', 'días'], ['diasPrimeraAccion', 'Plazo de la primera acción / reactivación', 'días'],
  ['diasStandbyRevision', 'Revisión sugerida de un standby', 'días'], ['diasPosventa', 'Seguimiento posventa tras ganar', 'días'],
];
const DIAS_ING = [
  ['diasSolucionAntesOferta', 'Solución técnica requerida', 'días antes de la oferta'], ['diasCosteoAntesOferta', 'Costeo requerido', 'días antes de la oferta'],
  ['diasParaComprometer', 'Plazo del coordinador para fijar la fecha comprometida', 'días desde la asignación'], ['diasCompromisoAviso', 'Aviso antes de la entrega comprometida', 'días'],
];
const MIN1 = ['diasSinMovimiento', 'diasProxAccion', 'diasPrimeraAccion', 'diasStandbyRevision', 'diasPosventa'];
const pc = v => String(Math.round((v ?? 0) * 100));

/** Mediana real de la probabilidad registrada en las oportunidades activas, por etapa. */
export const realProbEtapa = opps => Object.fromEntries(ETAPAS_ABIERTAS.map(e => {
  const v = opps.filter(o => isActive(o) && o.etapa === e && o.prob != null).map(o => o.prob).sort((a, b) => a - b);
  return [e, v.length ? v[Math.floor((v.length - 1) / 2)] : null];
}));

const formDe = p => ({
  ...Object.fromEntries(PCT.map(k => [k, pc(p[k])])), ...Object.fromEntries(TXT.map(k => [k, p[k]])),
  ...Object.fromEntries([...DIAS, ...DIAS_ING].map(([k]) => [k, String(p[k])])),
  probEtapa: Object.fromEntries(ETAPAS_ABIERTAS.map(e => [e, pc(p.probEtapa[e])])),
});
const pct01 = s => Math.min(100, Math.max(0, parseFloat(s || '0') || 0)) / 100;
function leer(f) {
  return {
    ...Object.fromEntries(PCT.map(k => [k, pct01(f[k])])), ...Object.fromEntries(TXT.map(k => [k, String(f[k]).trim()])),
    ...Object.fromEntries([...DIAS, ...DIAS_ING].map(([k]) => [k, Math.max(0, parseInt(f[k] || '0', 10) || 0)])),
    probEtapa: Object.fromEntries(ETAPAS_ABIERTAS.map(e => [e, pct01(f.probEtapa[e])])),
  };
}
export function validarParams(p) {
  if (!(p.bestMin < p.commitMin)) return 'Best case debe empezar por debajo de Commit.';
  if (MIN1.some(k => !(p[k] >= 1))) return 'Los plazos deben ser de al menos 1 día.';
  if (!p.periodo) return 'Elige el periodo del pronóstico.';
  return '';
}

export default function ParametrosTab() {
  const { state, actions } = useStore(); const ctx = useCtx(); const toast = useToast();
  const [f, setF] = useState(null); const [err, setErr] = useState(''); const [confirmar, setConfirmar] = useState(false);
  const form = f || formDe(ctx.params);
  const rp = useMemo(() => realProbEtapa(state.opps), [state.opps]);
  const set = (k, v) => { setF({ ...form, [k]: v }); setErr(''); };
  const setE = (e, v) => { setF({ ...form, probEtapa: { ...form.probEtapa, [e]: v } }); setErr(''); };
  const usarReales = () => { const pe = { ...form.probEtapa }; Object.entries(rp).forEach(([e, v]) => { if (v != null) pe[e] = pc(v); }); setF({ ...form, probEtapa: pe }); toast('Medianas reales cargadas. Pulsa Guardar parámetros.'); };
  const guardar = () => {
    const p = leer(form), e = validarParams(p); if (e) return setErr(e);
    actions.setConfig({ ...state.config, parametros: p }); setF(null); toast('Parámetros guardados');
  };
  const restablecer = () => { const { parametros, ...rest } = state.config; actions.setConfig(rest); setF(null); toast('Parámetros por defecto restablecidos'); };
  const num = ([k, l, suf]) => <label key={k} className="f">{l}<span className="inline"><input type="number" min="0" step="1" value={form[k]} onChange={e => set(k, e.target.value)} /> {suf}</span></label>;
  const pcIn = (k, l, suf = '%') => <label className="f">{l}<span className="inline"><input type="number" min="0" max="100" value={form[k]} onChange={e => set(k, e.target.value)} /> {suf}</span></label>;
  const txt = (k, l) => <label className="f">{l}<input type="text" value={form[k]} onChange={e => set(k, e.target.value)} /></label>;

  return <div className="card"><h2>Parámetros y estimaciones <small>editables · se aplican en todo el sistema</small></h2>
    <div className="grid g3">
      <fieldset><legend>Pronóstico automático</legend>
        {pcIn('commitMin', 'Commit desde', '% de probabilidad')}{pcIn('commitCierreMin', 'Commit en etapa Cierre desde')}{pcIn('bestMin', 'Best case desde')}
        <label className="f">Periodo del pronóstico<select value={form.periodo} onChange={e => set('periodo', e.target.value)}>{['Mes', 'Trimestre', 'Semestre'].map(x => <option key={x}>{x}</option>)}</select></label>
      </fieldset>
      <fieldset><legend>Cierre esperado por categoría (texto de referencia)</legend>
        {txt('tasaCommit', 'Commit')}{txt('tasaBest', 'Best case')}{txt('tasaPipeline', 'Pipeline')}
        <small className="muted">Hoja3 del Excel. Ajústalos cuando la calibración real (Resultados y calidad → Valores reales) tenga suficientes cierres.</small>
      </fieldset>
      <fieldset><legend>Probabilidad sugerida por etapa</legend>
        {ETAPAS_ABIERTAS.map(e => <label key={e} className="f">{etLabel(e)}<span className="inline">
          <input type="number" min="0" max="100" value={form.probEtapa[e]} onChange={ev => setE(e, ev.target.value)} /> % <small className="muted">real hoy: {rp[e] == null ? '—' : pc(rp[e]) + ' %'}</small></span></label>)}
        <button className="btn sm" type="button" onClick={usarReales}>Usar medianas reales</button>
      </fieldset>
      <fieldset><legend>Plazos y alertas (días)</legend>{DIAS.map(num)}</fieldset>
      <fieldset><legend>Ingeniería</legend>{DIAS_ING.map(num)}</fieldset>
    </div>
    <div className="toolbar">
      <button className="btn pri" type="button" onClick={guardar}>Guardar parámetros</button>
      <button className="btn" type="button" onClick={() => setConfirmar(true)}>Restablecer valores por defecto</button>
      {f && <button className="btn ghost" type="button" onClick={() => { setF(null); setErr(''); }}>Descartar cambios</button>}
      {err && <span className="err">{err}</span>}
    </div>
    {confirmar && <Modal title="Restablecer parámetros" subtitle="Vuelven los valores por defecto (probabilidades = medianas reales de octubre 2026)."
      onClose={() => setConfirmar(false)} onOk={restablecer} okLabel="Restablecer" />}
  </div>;
}
