/** Guía · secciones de cartera, ingeniería, configuración, datos, alertas, glosario y preguntas frecuentes. */
import { ESPECIALIDADES, ENTREGABLES, ETAPAS_ING } from '../../domain/constants.js';
import { STORAGE_KEY } from '../../store/storage.js';
import { Go, T, Dl } from './parts.jsx';

export function Cartera() {
  return <>
    <p><Go to="/clientes">Clientes</Go> es la lista única de empresas: <b>razón social, nombre comercial, RUC / RUT, país, tipo</b> (Cliente, Proveedor o Socio), <b>dirección, web, vertical y notas</b>, más sus oportunidades, contactos y casos técnicos.</p>
    <ul>
      <li><b>Registrar:</b> botón <b>+ Nueva empresa</b> o la opción <b>＋ Registrar empresa nueva…</b> de cualquier menú de empresa. Se bloquean nombres (también los alias del Excel) y RUC repetidos.</li>
      <li><b>Completar en bloque:</b> botón <b>Completar datos de empresas</b>: tabla editable con <b>Guardar</b> por fila. Valida el RUC peruano (11 dígitos, empieza con 10, 15, 17 o 20), el RUT chileno (12345678-9), que no se repita y que la web sea válida.</li>
      <li>La columna <b>Ficha</b> indica cuántos datos faltan (RUC, dirección, web).</li>
    </ul>
    <p><Go to="/contactos">Contactos</Go>: la empresa siempre sale de la lista de clientes. Campos: 1 nombre completo, 2 empresa, 3 cargo, 4 área, 5 email (se valida), 6 teléfono / WhatsApp, 7 rol / influencia (varios), 8 última interacción (se actualiza sola desde la bitácora), 9 notas clave (hasta 280 caracteres), y postura opcional (Promotor, Neutral, Detractor). Se filtra por empresa, área y rol, y se exporta a CSV.</p>
  </>;
}

export function Ingenieria({ p, coord }) {
  return <>
    <p>Cada caso técnico está unido a una oportunidad (o a un proyecto en ejecución) y muestra quién trabaja cada especialidad ({ESPECIALIDADES.join(', ')}) y en qué punto está. Se crea con <b>+ Nuevo caso técnico</b> o desde la pestaña Ingeniería de la oportunidad, indicando alcance, prioridad, coordinador técnico (por defecto {coord}), kickoff, límite de consultas y fechas requeridas de solución y costeo.</p>
    <h3>Las tres fechas de cada especialidad</h3>
    <T h={['Fecha', 'Quién la registra', 'Para qué sirve']} rows={[
      [<b>1. Fecha comprometida</b>, `El coordinador técnico, a más tardar ${p.diasParaComprometer} días después de la asignación.`, <>Primer acuerdo y línea base de medición. <b>Solo se corrige el mismo día</b> en que se registra y sin revisiones; desde el día siguiente queda fija.</>],
      [<b>2. Fecha revisada</b>, 'El coordinador, con Revisar fecha, indicando el motivo.', 'La fecha vigente que consultan comercial y proyectos. Un solo campo con contador e historial de cambios.'],
      [<b>3. Entrega final</b>, 'El especialista o el coordinador, al entregar.', 'La fecha real. Exige entregables listos y especialista asignado; no puede estar en el futuro.'],
    ]} />
    <p><b>Cumplimiento:</b> <span className="cchip good">A tiempo</span> si la entrega final es igual o anterior a la fecha comprometida original; <span className="cchip info">Dentro de lo revisado</span> si llegó dentro de la revisada; <span className="cchip crit">Con atraso</span> si pasó la fecha vigente. Mientras no se entrega: <span className="cchip good">En plazo</span>, <span className="cchip warn">Vence en N d</span> (aviso {p.diasCompromisoAviso} días antes) o <span className="cchip crit">Vencida</span>.</p>
    <p><b>Flujo:</b> <span className="mono" style={{ fontSize: 12.5 }}>{ETAPAS_ING.join(' → ')}</span>. Entregables (Pendiente, Listo o N/A): {ENTREGABLES.map(x => x[1]).join(', ')}. Los documentos no se suben: van en la carpeta de SharePoint. Las consultas se avisan {p.diasConsultasAviso} días antes del límite.</p>
  </>;
}

export function Equipo() {
  return <>
    <p>En <Go to="/config">Configuración → Equipo y reasignación</Go>:</p>
    <ul>
      <li><b>Equipo comercial:</b> iniciales, nombre y “En la empresa”, todo editable. Si cambias las iniciales de alguien, se actualizan solas en sus oportunidades (con nota en la bitácora) y en los casos técnicos que solicitó.</li>
      <li><b>Ex colaboradores:</b> al desmarcar “En la empresa” la persona sale de los menús, pero su nombre queda en el historial. Sus oportunidades abiertas quedan con la marca <span className="flag warn">Por reasignar</span> hasta que se decida a quién pasan.</li>
      <li><b>Reasignar:</b> una por una en la tabla <b>Oportunidades por reasignar</b>, todas juntas con <b>Reasignar oportunidades abiertas</b> (De → A), con el botón <b>por reasignar</b> de cada ex colaborador, o desde el Tablero y Oportunidades. Cada cambio queda en la bitácora.</li>
      <li><b>Eliminar:</b> si la persona tiene oportunidades abiertas, primero se elige a quién reasignarlas; en un especialista, quién lo reemplaza en sus casos abiertos. Pasa a “Personas eliminadas” y se puede <b>restaurar</b>.</li>
      <li><b>Especialistas:</b> todos atienden todas las especialidades. Se elige el <b>coordinador técnico por defecto</b>.</li>
      <li>Pulsa <b>Guardar equipo y especialistas</b> para aplicar los cambios de las tablas.</li>
    </ul>
    <p>En <Go to="/config/especialidades">Especialidades y rubros</Go> se edita qué cubre cada especialidad y sus rubros (opcionales, “Grupo · rubro”), con la marca “Validado por gerencia”. En <Go to="/config/parametros">Parámetros</Go>, umbrales del pronóstico, textos de cierre esperado, periodo, probabilidad por etapa (con las medianas reales) y días de alertas.</p>
  </>;
}

export function Datos() {
  return <>
    <div className="gcall warn"><b>Los datos se guardan en este navegador</b> (localStorage, clave <span className="mono">{STORAGE_KEY}</span>), en este computador. No se comparten automáticamente con otras personas ni con otro navegador. Si se borran los datos de navegación, se pierde lo registrado.</div>
    <ul>
      <li>Los cambios se guardan solos al instante y se sincronizan entre pestañas del mismo navegador.</li>
      <li><b>Respaldar:</b> <Go to="/config/respaldo">Configuración → Respaldo e integración</Go> → <b>Descargar respaldo (JSON)</b>. Hazlo con frecuencia (por ejemplo, cada viernes) y guárdalo en SharePoint.</li>
      <li><b>Pasar a otro computador o recuperar:</b> <b>Importar respaldo…</b>, elige el archivo JSON y confirma. <b>Reemplaza todos los datos</b> de este navegador por los del archivo.</li>
      <li><b>Restablecer base inicial:</b> vuelve a los datos migrados del Excel; se pierden los cambios.</li>
      <li>Para Excel: CSV de oportunidades, clientes y contactos.</li>
    </ul>
  </>;
}

export function Alertas({ p }) {
  return <T h={['Alerta', 'Cuándo aparece', 'Cómo se resuelve']} rows={[
    [<><span className="flag crit">Sin próxima acción</span> <span className="flag crit">Acción vencida</span></>, 'Activa sin siguiente paso o con fecha pasada.', 'Registrar resultado y nueva acción.'],
    [<span className="flag warn">Sin monto / sin cierre</span>, 'Faltan datos comerciales.', 'Completarlos en la revisión semanal.'],
    [<span className="flag warn">N días sin movimiento</span>, `Más de ${p.diasSinMovimiento} días sin bitácora, oferta ni edición.`, 'Contactar al cliente y registrarlo.'],
    [<span className="flag crit">Revisar standby</span>, 'Standby con fecha de revisión pasada.', 'Reactivar o posponer con nueva fecha.'],
    [<span className="flag warn">Por reasignar (ex colaborador)</span>, 'Abierta a nombre de alguien que ya no está en la empresa.', 'Reasignar desde Tablero, Oportunidades o Configuración.'],
    [<span className="flag warn">Pérdida sin análisis</span>, 'Perdida sin causa o lección.', 'Completar en Cierre y lecciones.'],
  ]} />;
}

export function Rutinas() {
  return <>
    <h3>Cada día (10 minutos)</h3>
    <ol><li><Go to="/agenda">Agenda y revisión → Próximas acciones</Go> con tu filtro: vencidas y de hoy primero.</li><li>Después de cada contacto: <b>Registrar resultado</b> + siguiente acción.</li><li>Especialistas: actualizar etapa, entregables y fechas de sus casos.</li></ol>
    <h3>Cada semana</h3>
    <ol><li>Completar la revisión semanal antes de la reunión comercial.</li><li>Revisar en <Go to="/ingenieria">Casos técnicos</Go> las entregas por vencer.</li><li>Descargar un respaldo JSON.</li></ol>
    <h3>Cada mes</h3>
    <ol><li><Go to="/analisis">Resultados y calidad</Go>: causas que se repiten, calidad de datos y calibración del pronóstico.</li></ol>
  </>;
}

export const Glosario = () => <Dl items={[
  ['Numeración AA-PCCC', 'AA = año, P = país (1 Perú, 2 Chile, 3 Ecuador, 4 Otros), CCC = correlativo del año. Casos técnicos: SI-AA-NNN.'],
  ['Activa / Standby', 'Activa: está en una etapa del pipeline. Standby: viva pero sin poder ubicarse en una etapa; no suma al pipeline.'],
  ['Pipeline activo / Ponderado', 'Suma de montos de las activas / suma de monto × probabilidad.'],
  ['Tasa de cierre', 'Ganadas ÷ (ganadas + perdidas), por cantidad y por monto.'],
  ['Ex colaborador', 'Persona del equipo marcada fuera de la empresa: no aparece en los menús y sus oportunidades abiertas quedan por reasignar.'],
  ['Kickoff', 'Reunión en la que comercial entrega la información del cliente a los especialistas y se inicia el caso técnico.'],
  ['Coordinador técnico', 'Especialista que lidera la solución y fija la fecha comprometida.'],
  ['Rol / influencia y postura', 'Qué papel tiene el contacto en la decisión y si favorece (promotor) o frena (detractor) a VOYANT.'],
]} />;

export const Faq = () => <Dl items={[
  ['El cliente no está en la lista.', 'En el menú de empresa elige “＋ Registrar empresa nueva…”. Antes, búscalo por nombre comercial o RUC: puede estar con otro nombre.'],
  ['¿Se puede borrar una oportunidad?', 'No, para no perder información. Si fue un error o está duplicada, ciérrala como perdida con causa “Otra” y explícalo.'],
  ['¿Qué diferencia hay entre standby y perdida?', 'Standby: sigue viva y se volverá a revisar. Perdida: el cliente decidió en contra o canceló definitivamente.'],
  ['¿Por qué mi compañero no ve lo que registré?', 'Los datos se guardan en el navegador de cada computador. Descarga un respaldo JSON y que tu compañero lo importe, o usen el mismo equipo hasta conectar el servidor compartido.'],
  ['Cambié de computador o borré el historial del navegador.', 'Importa tu último respaldo JSON en Configuración → Respaldo e integración.'],
  ['¿Cómo quito a alguien que ya no está en la empresa?', 'En Configuración → Equipo y reasignación desmarca “En la empresa” y guarda. Luego reasigna sus oportunidades abiertas (todas juntas o una por una).'],
  ['¿Subo la memoria descriptiva o el BoQ?', 'No. Se marca el entregable como listo en el caso técnico; el documento va en la carpeta de SharePoint.'],
]} />;
