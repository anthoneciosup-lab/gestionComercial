import { useStore, useCtx } from '../../store/StoreProvider.jsx';
import { useDrawer } from '../../app/useDrawer.js';
import { hoyISO, fd, usd } from '../../domain/format.js';
import { cliName, forecastOf, lastActivity, alerts } from '../../domain/rules.js';
import { EtapaPill, ForecastChip, Flags, Field, useForm, useToast } from '../../components/ui/index.js';

const PROBS = [0, 0.1, 0.2, 0.25, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
const PREGUNTAS = [
  ['sucedio', '¿Qué sucedió desde la semana pasada?', 'Acciones del comprador'],
  ['compromiso', '¿Cuál es el próximo compromiso del comprador?', 'Qué acordó hacer y para cuándo'],
  ['riesgo', '¿Qué está en riesgo?', '¿Presupuesto confirmado? ¿Sigue comprometido? ¿Entró un competidor?'],
  ['manager', '¿Qué se necesita del gerente? (opcional)', ''],
];

/** Revisión semanal de una oportunidad activa: cuatro preguntas + pronóstico, probabilidad y cierre. */
export default function RevisionCard({ o, onStandby }) {
  const { actions } = useStore(), ctx = useCtx(), d = useDrawer(), toast = useToast();
  const rv = o.revision || {};
  const [f, set] = useForm({ sucedio: rv.sucedio || '', compromiso: rv.compromiso || '', riesgo: rv.riesgo || '', manager: rv.manager || '',
    forecast: o.forecast || '', prob: o.prob == null ? '' : String(o.prob), fCierre: o.fCierre || '' });
  const probs = o.prob != null && !PROBS.includes(o.prob) ? [...PROBS, o.prob].sort((a, b) => a - b) : PROBS;
  const save = () => {
    const r = { f: hoyISO(), sucedio: f.sucedio.trim(), compromiso: f.compromiso.trim(), riesgo: f.riesgo.trim(), manager: f.manager.trim() };
    if (!r.sucedio && !r.compromiso) { toast('Completa al menos qué sucedió o el próximo compromiso.'); return; }
    const txt = [r.sucedio && 'Sucedió: ' + r.sucedio, r.compromiso && 'Compromiso: ' + r.compromiso, r.riesgo && 'Riesgo: ' + r.riesgo, r.manager && 'Necesita del gerente: ' + r.manager].filter(Boolean).join('\n');
    try {
      actions.updateOpp(o.id, { revision: r, forecast: f.forecast, prob: f.prob === '' ? null : parseFloat(f.prob), fCierre: f.fCierre || null }, { t: txt, tipo: 'Revisión semanal' });
      toast('Revisión guardada');
    } catch (e) { toast(e.message); }
  };
  return <div className="rev">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <div className="mono muted" style={{ fontSize: 12 }}>{o.numero || o.id} · {o.resp}</div>
      <a href="#" onClick={e => { e.preventDefault(); d.open('opp', o.id); }} style={{ fontWeight: 600, textDecoration: 'none' }}>{cliName(o, ctx)}</a>
      <div style={{ fontSize: 13 }}>{o.ref}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}><EtapaPill o={o} /><span className="num">{usd(o.monto)}</span><ForecastChip o={o} params={ctx.params} /></div>
      <div className="muted" style={{ fontSize: 12 }}>Última revisión: {rv.f ? fd(rv.f) : 'nunca'} · Último movimiento: {fd(lastActivity(o))}</div>
      <Flags items={alerts(o, ctx)} max={4} />
      <button className="btn sm" type="button" onClick={() => onStandby(o)} style={{ alignSelf: 'flex-start' }}>Pasar a standby</button>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
      <div className="qs">{PREGUNTAS.map(([k, l, ph]) => <Field key={k} label={l}><textarea value={f[k]} placeholder={ph || undefined} onChange={e => set(k, e.target.value)} /></Field>)}</div>
      <div className="toolbar">
        <Field label="Pronóstico"><select value={f.forecast} onChange={e => set('forecast', e.target.value)}>
          <option value="">Automático ({forecastOf({ ...o, forecast: '' }, ctx.params) || 'sin probabilidad'})</option>
          <option value="Commit">Commit</option><option value="Best">Best case</option><option value="Pipeline">Pipeline</option></select></Field>
        <Field label="Probabilidad"><select value={f.prob} onChange={e => set('prob', e.target.value)}>
          <option value="">Sin probabilidad</option>{probs.map(p => <option key={p} value={String(p)}>{Math.round(p * 100)}%</option>)}</select></Field>
        <Field label="Cierre previsto"><input type="date" value={f.fCierre} onChange={e => set('fCierre', e.target.value)} /></Field>
        <button className="btn pri" type="button" onClick={save} style={{ alignSelf: 'flex-end', marginLeft: 'auto' }}>Guardar revisión</button>
      </div>
    </div>
  </div>;
}
