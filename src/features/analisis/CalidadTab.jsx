import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, useCtx, useScopedOpps } from '../../store/StoreProvider.jsx';
import { pct } from '../../domain/format.js';
import { alerts, ISSUES } from '../../domain/rules.js';
import { Card, KpiGrid, Kpi } from '../../components/ui/index.js';

export const clienteIncompleto = c => !c.ruc || !c.direccion || !c.web;
export const contactoIncompleto = k => !k.area || !(k.roles || []).length || (!k.email && !k.telefono);

function Issue({ label, n, onClick }) {
  const key = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } };
  return <div className="issue" role="button" tabIndex={0} onClick={onClick} onKeyDown={key}>
    <span>{label}</span><b style={{ color: n ? 'var(--crit)' : 'var(--good)' }}>{n}</b></div>;
}

/** Calidad de datos: pendientes por tipo (llevan a Oportunidades filtradas) y fichas incompletas. */
export default function CalidadTab() {
  const { state } = useStore(), ctx = useCtx(), O = useScopedOpps(), nav = useNavigate();
  const { cnt, ok } = useMemo(() => {
    const cnt = {}; let ok = 0;
    O.forEach(o => { const a = alerts(o, ctx); if (!a.length) ok++; a.forEach(x => { cnt[x[2]] = (cnt[x[2]] || 0) + 1; }); });
    return { cnt, ok };
  }, [O, ctx]);
  const cliInc = state.clientes.filter(clienteIncompleto).length, kInc = state.contacts.filter(contactoIncompleto).length;
  return <>
    <KpiGrid cols={4}>
      <Kpi label="Oportunidades completas" value={ok} detail={`de ${O.length} (${pct(O.length ? ok / O.length : 0)})`} />
      <Kpi label="Con pendientes" value={O.length - ok} detail="al menos un dato por completar" tone="crit" />
      <Kpi label="Fichas de cliente incompletas" value={cliInc} detail={`de ${state.clientes.length} (RUC, dirección o web)`} />
      <Kpi label="Contactos incompletos" value={kInc} detail={`de ${state.contacts.length} (área, rol o medio de contacto)`} />
    </KpiGrid>
    <div className="grid g2">
      {Object.entries(ISSUES).map(([k, l]) => <Issue key={k} label={l} n={cnt[k] || 0} onClick={() => nav('/oportunidades', { state: { alerta: k, etapa: '' } })} />)}
      <Issue label="Fichas de cliente incompletas" n={cliInc} onClick={() => nav('/clientes')} />
      <Issue label="Contactos sin área, rol o medio de contacto" n={kInc} onClick={() => nav('/contactos')} />
    </div>
    <Card title="Correcciones hechas al importar el Excel">
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <li>Clientes unificados en una lista única ({state.clientes.length} empresas): HOCHILD → HOCHSCHILD; SOUTHERN / SOUTHERN COPPER / SOUTHERN PERU → SOUTHERN PERÚ; BAMBAS / MMG → LAS BAMBAS (MMG); CERRO VERDE → SMCV; SIDER → SIDER PERÚ. Cada oportunidad y cada contacto apunta a su ficha de cliente.</li>
        <li>Las 43 oportunidades “sin etapa” pasaron a <b>Standby</b>, como se acordó el 30/09: no ensucian el pipeline. Hay que reactivarlas en una etapa o fijarles fecha de revisión.</li>
        <li>El área de 24 contactos se dedujo del cargo (por ejemplo, “Compras” o “Logística”). Rol, postura y notas quedan por completar.</li>
        <li>El histórico 2021–2025 se retiró del sistema por no ser data confiable (acuerdo del 30/09).</li>
        <li>La numeración 26-1162 aparece dos veces; la segunda quedó como 26-1162-B. 26-10903 y 26-46287 tienen formato irregular.</li>
      </ul>
    </Card>
  </>;
}
