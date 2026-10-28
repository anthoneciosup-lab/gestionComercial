/** Guía · secciones de uso diario: qué es, pantalla, oportunidades, acciones, etapas, pronóstico y Tablero. */
import { CAUSAS, DESLICES } from '../../domain/constants.js';
import { Go, T, Dl } from './parts.jsx';

export function Inicio({ d }) {
  return <>
    <p>Este sistema reemplaza el uso diario del archivo <b>00. Numeracion_Oportunidades.xlsx</b>. Hoy contiene <b>{d.opps} oportunidades</b>, {d.clientes} empresas en la lista de clientes, {d.contactos} contactos y {d.casos} casos técnicos.</p>
    <p><b>Cada oportunidad es un expediente</b> con número único, cliente, responsable, estado, bitácora, ofertas enviadas, casos técnicos y una próxima acción con fecha. Nada se sobrescribe: cada cambio queda registrado.</p>
    <div className="gcall"><b>El objetivo:</b> que ninguna oportunidad se quede sin dueño ni siguiente paso, que el pipeline muestre solo lo que está realmente vivo, que ingeniería y comercial vean el mismo estado de cada propuesta, y que cada pérdida deje una lección.</div>
    <p>Hoy hay <b>{d.activas} oportunidades activas</b> ({d.sinAccion} sin próxima acción), <b>{d.standby} en standby</b>{d.porReasignar > 0 && <> y <b>{d.porReasignar}</b> abiertas a nombre de ex colaboradores</>}.</p>
  </>;
}

export function Pantalla() {
  return <>
    <p>El <b>menú lateral</b> tiene diez módulos en seis grupos. Los números indican cantidades; en rojo, lo que requiere atención.</p>
    <T h={['Grupo', 'Módulo', 'Pestañas y para qué sirve']} rows={[
      ['Seguimiento', <Go to="/tablero">Tablero</Go>, 'Montos registrados y estimaciones, completitud de datos y cartera por reasignar.'],
      ['', <Go to="/pipeline">Pipeline</Go>, 'Tablero por etapas: arrastra una tarjeta para cambiar de etapa, pasarla a standby o cerrarla.'],
      ['', <Go to="/oportunidades">Oportunidades</Go>, 'Registro maestro: una fila por oportunidad, con filtros y exportación.'],
      ['', <Go to="/agenda">Agenda y revisión</Go>, 'Próximas acciones · Revisión semanal.'],
      ['Ingeniería', <Go to="/ingenieria">Casos técnicos</Go>, 'Casos por especialidad con fecha comprometida, revisada y entrega final.'],
      ['Cartera', <Go to="/clientes">Clientes</Go>, 'Lista única de empresas y su ficha; “Completar datos de empresas”.'],
      ['', <Go to="/contactos">Contactos</Go>, 'Personas de cada empresa: rol, postura y última interacción.'],
      ['Análisis', <Go to="/analisis">Resultados y calidad</Go>, 'Ganadas y perdidas · Calidad de datos · Valores reales.'],
      ['Administración', <Go to="/config">Configuración</Go>, 'Equipo y reasignación · Especialidades y rubros · Parámetros · Respaldo e integración.'],
      ['Ayuda', 'Guía de uso', 'Esta guía.'],
    ]} />
    <ul>
      <li><b>Barra superior:</b> los filtros por responsable y país aparecen solo en los módulos comerciales y se recuerdan en este navegador. El botón principal cambia según el módulo: <b>+ Nueva oportunidad</b>, <b>+ Nuevo caso técnico</b>, <b>+ Nueva empresa</b> o <b>+ Nuevo contacto</b>.</li>
      <li><b>Fichas laterales:</b> clic en cualquier fila o tarjeta abre su ficha a la derecha (oportunidad, caso técnico o cliente). Se cierran con <b>Cerrar</b>, clic afuera, <b>Esc</b> o el botón <b>Atrás</b> del navegador. Cada ficha tiene su propio enlace, que se puede copiar.</li>
    </ul>
  </>;
}

export function Oportunidad() {
  return <>
    <p>La ficha tiene cinco pestañas:</p>
    <Dl items={[
      ['Resumen', 'Próxima acción, datos comerciales, cliente comprador y final (de la lista de clientes), decisores, líneas, fechas y carpeta de SharePoint.'],
      ['Bitácora', 'Línea de tiempo de todo lo ocurrido; al agregar una entrada se elige con qué contacto fue.'],
      ['Ofertas', 'Cada versión enviada con fecha, monto, responsable del envío, destinatario y cambios.'],
      ['Ingeniería', 'Los casos técnicos de la oportunidad con el estado de cada especialidad.'],
      ['Cierre y lecciones', 'Causa de pérdida (con “Otra”), competidor y lecciones; botones para cerrar como ganada o perdida.'],
    ]} />
    <h3>Registrar una oportunidad nueva</h3>
    <ol>
      <li>Pulsa <b>+ Nueva oportunidad</b> y elige el país. El número se asigna solo: <span className="mono">AA-P + correlativo</span> (ej. 26-1227).</li>
      <li>Elige el <b>cliente comprador de la lista</b>. Si no está, elige <b>＋ Registrar empresa nueva…</b> en el mismo menú: el sistema avisa si el nombre o el RUC ya existen.</li>
      <li>Si quien usa la solución es otra empresa, elige el <b>cliente final</b>.</li>
      <li>Completa referencia, responsable, etapa, vertical, monto y fechas, y define la <b>próxima acción con su fecha</b> (obligatorio).</li>
    </ol>
  </>;
}

export function Accion({ p }) {
  return <>
    <p><b>Toda oportunidad activa tiene una sola próxima acción, redactada, con fecha límite y responsable.</b> Se redacta qué, con quién y para qué.</p>
    <T h={['Mal', 'Bien']} rows={[
      ['Llamar para seguimiento', 'Llamar a Kevin Rojas para confirmar si la instalación entra en la parada de agosto 2027 — 07/10'],
      ['Ver precios', 'Pedir cotización a Eaton (Bernardo Cortez) para actualizar la oferta — 02/10'],
    ]} />
    <p>En <Go to="/agenda">Agenda y revisión → Próximas acciones</Go>, <b>Registrar resultado</b> pide qué pasó (y con qué contacto) y la siguiente acción; todo queda en la bitácora.</p>
    <p><b>Bitácora:</b> registra llamadas, reuniones, emails, visitas, ofertas y notas, con fecha, autor y contacto. Nunca se borra. Al elegir un contacto, su <b>última interacción</b> se actualiza sola. Si pasan más de {p.diasSinMovimiento} días sin movimiento, aparece una alerta.</p>
  </>;
}

export function Etapas({ p }) {
  return <>
    <T h={['Estado', 'Significa', 'Para pasar a la siguiente']} rows={[
      ['Prospecto', 'Hay interés o lead; aún no se sabe si es real.', 'Confirmar necesidad, cliente y presupuesto aproximado.'],
      ['Calificación', 'Necesidad confirmada; se entienden alcance y decisores.', 'Decisores identificados y decisión de ofertar (Go / No Go).'],
      ['Propuesta', 'Kickoff con ingeniería, consultas, solución técnica, costeo y emisión.', 'Oferta enviada y en revisión del cliente.'],
      ['Cierre', 'Negociación final, licitación o aprobación de compra.', 'OC recibida (ganada) o decisión del cliente (perdida).'],
      [<b>Standby</b>, <>Oportunidad real que no se puede ubicar en una etapa. <b>No cuenta en el pipeline ni en el pronóstico.</b></>, 'Reactivar eligiendo la etapa y la próxima acción.'],
      ['Ganada / Perdida', 'Cerrada.', 'Ganada: posventa. Perdida: causa y lección.'],
    ]} />
    <p><b>No existen oportunidades activas sin etapa.</b> Para pasar a standby se indica motivo y <b>fecha de revisión</b> (sugerida a {p.diasStandbyRevision} días); al llegar esa fecha aparece la alerta “Revisar standby”.</p>
    <p><b>Ganada:</b> monto adjudicado, fecha de OC y seguimiento de posventa a {p.diasPosventa} días. <b>Perdida:</b> no se cierra sin causa y lección. Causas: {CAUSAS.slice(0, -1).join(', ')} y <b>Otra</b> (con texto obligatorio).</p>
  </>;
}

export function Pronostico({ p }) {
  const pc = v => Math.round(v * 100);
  return <>
    <p>En <Go to="/agenda/revision">Agenda y revisión → Revisión semanal</Go> se responde, para cada oportunidad activa: qué sucedió, cuál es el próximo compromiso del comprador, qué está en riesgo y qué se necesita del gerente. Las respuestas quedan en la bitácora.</p>
    <p><b>El pronóstico</b> responde qué tan seguro es que la oportunidad cierre <b>dentro del periodo</b> ({p.periodo.toLowerCase()}). Es distinto de la etapa.</p>
    <T h={['Pronóstico', 'Criterio', 'Cierre esperado']} rows={[
      ['Commit', 'Se cierra en este periodo: acuerdo verbal o fecha de firma confirmada.', p.tasaCommit],
      ['Best case', 'Podría cerrar si todo sale bien: pendiente de aprobación.', p.tasaBest],
      ['Pipeline', 'Activa, pero no se espera que cierre en este periodo.', p.tasaPipeline],
    ]} />
    <p>En “Automático” se calcula con la probabilidad ({pc(p.commitMin)} % o más, o Cierre con {pc(p.commitCierreMin)} %+ = Commit; {pc(p.bestMin)} %+ = Best case). Sin probabilidad, la oportunidad queda “sin pronóstico”. Cuando un Commit no cierra, se revisa el motivo: {DESLICES.join(', ').toLowerCase()}.</p>
  </>;
}

export function Tablero() {
  return <>
    <p>El <Go to="/tablero">Tablero</Go> separa siempre dos tipos de cifras:</p>
    <T h={['Tipo', 'Qué incluye', 'De dónde sale']} rows={[
      [<span className="tag real">Montos registrados</span>, 'Pipeline activo, ganado, perdido, tasa de cierre y monto en standby.', 'El monto USD del Excel o lo registrado en el sistema. Una oportunidad sin monto suma 0: no se inventan montos.'],
      [<span className="tag est">Estimaciones del sistema</span>, 'Ponderado (monto × probabilidad), Commit y Best case.', 'Calculadas con la probabilidad y los umbrales de Configuración → Parámetros. Sin probabilidad no hay pronóstico.'],
    ]} />
    <p>La tarjeta <b>Completitud de los datos</b> muestra cuántas activas tienen monto, probabilidad, fecha de cierre y próxima acción, y lleva a completarlas. El standby nunca infla el embudo.</p>
  </>;
}
