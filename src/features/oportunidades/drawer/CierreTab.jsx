/** Pestaña Cierre y lecciones: cerrar (ganada/perdida), standby/reactivación y análisis de cierre. */
import { useStore } from '../../../store/StoreProvider.jsx';
import { CAUSAS } from '../../../domain/constants.js';
import { pct } from '../../../domain/format.js';
import { isActive, isClosed, isStandby } from '../../../domain/rules.js';
import { Field, Options, useForm, useToast } from '../../../components/ui/index.js';

export default function CierreTab({ o, onModal }) {
  const { actions } = useStore(); const toast = useToast();
  const [f, set] = useForm({ causa: o.causaPerdida || '', otra: o.causaOtra || '', comp: o.competidor || '', lec: o.lecciones || '' });
  const perdida = o.etapa === 'CERRADA PERDIDA';

  const guardar = () => {
    const ot = f.otra.trim();
    if (f.causa === 'Otra' && !ot) { toast('Escribe la causa en “Otra”.'); return; }
    const ch = perdida
      ? { causaPerdida: f.causa, causaOtra: f.causa === 'Otra' ? ot : '', competidor: f.comp.trim(), lecciones: f.lec.trim() }
      : { lecciones: f.lec.trim(), competidor: f.comp.trim() };
    try { actions.updateOpp(o.id, ch); toast('Guardado'); } catch (e) { toast(e.message); }
  };

  return <>
    {!isClosed(o) && <>
      <div className="banner"><span>Al cerrar se registran el pronóstico y la probabilidad que tenía la oportunidad, para medir la calidad del pronóstico.{isStandby(o) ? ' Está en standby: puedes reactivarla o cerrarla.' : ''}</span></div>
      <div className="toolbar">
        <button className="btn" type="button" style={{ color: 'var(--good)' }} onClick={() => onModal({ k: 'cierre', to: 'CERRADA GANADA' })}>Marcar como ganada</button>
        <button className="btn danger" type="button" onClick={() => onModal({ k: 'cierre', to: 'CERRADA PERDIDA' })}>Marcar como perdida</button>
        {isActive(o) && <button className="btn" type="button" onClick={() => onModal({ k: 'standby' })}>Pasar a standby</button>}
        {isStandby(o) && <>
          <button className="btn pri" type="button" onClick={() => onModal({ k: 'reactivar' })}>Reactivar</button>
          <button className="btn" type="button" onClick={() => onModal({ k: 'standby' })}>Cambiar motivo o fecha</button>
        </>}
      </div>
    </>}
    {isClosed(o) && <>
      <div className="muted" style={{ fontSize: 12.5 }}>Al cierre: pronóstico {o.forecastAlCierre ? (o.forecastAlCierre === 'Best' ? 'Best case' : o.forecastAlCierre) : '—'} · probabilidad {pct(o.probAlCierre)}</div>
      <fieldset><legend>{perdida ? 'Análisis de la pérdida' : 'Por qué ganamos'}</legend>
        {perdida && <>
          <Field label="Causa principal de pérdida"><select value={f.causa} onChange={e => set('causa', e.target.value)}><Options list={CAUSAS} blank="—" /></select></Field>
          {f.causa === 'Otra' && <Field label="Escribe la causa"><input type="text" value={f.otra} onChange={e => set('otra', e.target.value)} /></Field>}
        </>}
        <Field label={perdida ? 'Competidor ganador' : 'Competidores en la evaluación (opcional)'}><input type="text" value={f.comp} onChange={e => set('comp', e.target.value)} /></Field>
        <Field label="Lecciones aprendidas" full><textarea value={f.lec} onChange={e => set('lec', e.target.value)}
          placeholder={perdida ? 'Qué haríamos distinto. Ej.: mapear decisores de compras desde la calificación' : 'Factor diferencial para repetir'} /></Field>
        <div className="full"><button className="btn pri" type="button" onClick={guardar}>Guardar análisis</button></div>
      </fieldset>
    </>}
  </>;
}
