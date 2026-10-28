/** Guía de uso: índice lateral y secciones (versión condensada de la guía 2.3, adaptada a esta aplicación). */
import { useMemo } from 'react';
import { useStore, useCtx } from '../../store/StoreProvider.jsx';
import { isActive, isStandby, porReasignar } from '../../domain/rules.js';
import { APP } from '../../domain/constants.js';
import { Inicio, Pantalla, Oportunidad, Accion, Etapas, Pronostico, Tablero } from './seccionesUso.jsx';
import { Cartera, Ingenieria, Equipo, Datos, Alertas, Rutinas, Glosario, Faq } from './seccionesGestion.jsx';

const SECCIONES = [
  ['inicio', 'Qué es y para qué sirve', Inicio], ['pantalla', 'Menú, módulos y pestañas', Pantalla], ['ficha', 'La ficha de oportunidad', Oportunidad],
  ['accion', 'Próxima acción y bitácora', Accion], ['etapas', 'Etapas, standby y cierre', Etapas], ['pronostico', 'Revisión semanal y pronóstico', Pronostico],
  ['tablero', 'Tablero: montos reales y estimados', Tablero], ['cartera', 'Clientes y contactos', Cartera], ['ingenieria', 'Casos técnicos: las tres fechas', Ingenieria],
  ['equipo', 'Ex colaboradores y reasignación', Equipo], ['datos', 'Dónde se guardan los datos y respaldo', Datos], ['alertas', 'Alertas principales', Alertas],
  ['rutinas', 'Rutinas de trabajo', Rutinas], ['glosario', 'Glosario', Glosario], ['faq', 'Preguntas frecuentes', Faq],
];

export default function GuiaPage() {
  const { state } = useStore(); const ctx = useCtx();
  const d = useMemo(() => {
    const act = state.opps.filter(isActive);
    return { opps: state.opps.length, clientes: state.clientes.length, contactos: state.contacts.length, casos: state.solicitudes.length,
      activas: act.length, sinAccion: act.filter(o => !o.proxAccion).length, standby: state.opps.filter(isStandby).length, porReasignar: porReasignar(state.opps, ctx).length };
  }, [state, ctx]);
  const ir = k => e => { e.preventDefault(); document.getElementById('g-' + k)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  return <div className="guide">
    <nav className="gtoc" aria-label="Índice de la guía"><b>Contenido</b>
      {SECCIONES.map(([k, l], i) => <a key={k} href={'#g-' + k} onClick={ir(k)}>{i + 1}. {l}</a>)}</nav>
    <article className="gbody">
      <div className="gcall"><b>Versión {APP.version} · interfaz React.</b> Mismas reglas y módulos que la versión 2.3: diez módulos con pestañas, casos técnicos con tres fechas por especialidad, reasignación de la cartera de ex colaboradores y Tablero con montos reales separados de las estimaciones. Los datos se guardan en este navegador (sección 11).</div>
      {SECCIONES.map(([k, l, C], i) => <section key={k} id={'g-' + k}><h2>{i + 1}. {l}</h2><C d={d} p={ctx.params} coord={ctx.coordDef} /></section>)}
    </article>
  </div>;
}
