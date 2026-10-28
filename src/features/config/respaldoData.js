/** Ficha técnica: modelo de datos, historial de versiones, verificación de integridad y exportaciones CSV. */
import { ETAPAS_ABIERTAS } from '../../domain/constants.js';
import { isActive, cliName, cliFinalName, stageLabel, forecastOf, causaTxt } from '../../domain/rules.js';
import { csvOf } from '../../domain/csv.js';

export const SCHEMA_DOC = {
  opps: { n: 'Oportunidades', key: 'id = N° (AA-PCCC; “-B” si el número venía duplicado)', f: [
    ['id / numero', 'texto', 'N° de oportunidad. Clave única e inmutable.'], ['anio · pais · paisCod · correlativo', 'número / texto', 'Partes de la numeración. paisCod: 1 Perú, 2 Chile, 3 Ecuador, 4 Otros.'],
    ['fCreacion', 'fecha ISO', 'Fecha de registro.'], ['resp', 'texto', 'Iniciales del responsable (→ config.equipo.ini).'], ['ref', 'texto', 'Referencia / alcance comercial.'],
    ['clienteId · clienteFinalId', 'id', '→ clientes.id. El nombre se resuelve siempre desde la ficha del cliente.'], ['cliente · clienteFinal', 'texto', 'Copia del nombre al momento de guardar (respaldo para exportaciones).'],
    ['etapa', 'lista', 'PROSPECTO · CALIFICACIÓN · PROPUESTA · CIERRE · CERRADA GANADA · CERRADA PERDIDA.'], ['standby', 'objeto | null', '{motivo, desde, fRevision, etapaPrevia, nota}. Si existe y no está cerrada, la oportunidad está en standby.'],
    ['monto · prob', 'número', 'Monto USD y probabilidad (0 a 1).'], ['forecast', 'lista', 'Commit · Best · Pipeline; vacío = automático según probabilidad.'],
    ['fCierre · fConsulta · fOfertaRequerida · fUltimaOferta', 'fecha ISO', 'Fechas comerciales.'], ['proxAccion · fProxAccion', 'texto / fecha', 'Única próxima acción y su fecha límite.'],
    ['decisorTecnico · decisorFinal', 'texto', 'Personas que deciden (sugeridas desde contactos).'], ['vertical', 'lista', 'Vertical del negocio.'],
    ['lineas', 'objeto', '{energia, clima, security}: especialidades involucradas (Potencia, Mecánica, Security).'], ['ingenieria', 'lista', 'Falta · Completado (estado heredado del Excel).'],
    ['sharepoint', 'URL', 'Carpeta de documentos de la oportunidad.'], ['bitacora', 'lista de objetos', '{f, t, tipo, a, contacto, origen, ts}. Solo se agregan entradas.'],
    ['versiones', 'lista', 'Ofertas enviadas: {v, f, monto, nota, resp, contacto, cambios}.'], ['revision', 'objeto', 'Última revisión semanal: {f, sucedio, compromiso, riesgo, manager}.'],
    ['causaPerdida · causaOtra · competidor · lecciones', 'texto', 'Análisis de cierre.'], ['forecastAlCierre · probAlCierre', 'texto / número', 'Pronóstico y probabilidad que tenía al cerrarse (para calibrar el pronóstico).'], ['obs · actualizado', 'lista / ISO', 'Observaciones de calidad y última edición.']] },
  clientes: { n: 'Clientes (empresas)', key: 'id = “cl-” + nombre normalizado', f: [
    ['nombre', 'texto', 'Razón social, en mayúsculas. Única.'], ['nombreComercial', 'texto', 'Nombre comercial.'], ['ruc', 'texto', 'RUC (Perú, 11 dígitos) o RUT (Chile, 12345678-9). Único.'],
    ['pais · tipo · vertical', 'lista', 'País; Cliente · Proveedor · Socio; vertical principal.'], ['direccion · web · notas', 'texto', 'Datos de la empresa (web sin https://).'],
    ['alias', 'lista', 'Nombres con que figuraba en el Excel original.'], ['estado · creado · origen · actualizado', 'texto / ISO', 'Control.']] },
  contacts: { n: 'Contactos', key: 'id = “c” + correlativo (c001…)', f: [
    ['nombre', 'texto', '1. Nombre completo.'], ['empresaId', 'id', '2. Empresa → clientes.id (obligatorio).'], ['cargo', 'texto', '3. Cargo.'], ['area', 'lista', '4. Área.'],
    ['email', 'email', '5. Email (formato validado).'], ['telefono', 'texto', '6. Teléfono / WhatsApp.'], ['roles', 'lista múltiple', '7. Decisor · Influenciador · Técnico · Compras · Usuario.'],
    ['ultimaInteraccion', 'fecha ISO', '8. Se actualiza sola desde la bitácora.'], ['notas', 'texto ≤ 280', '9. Notas clave.'], ['postura', 'lista', 'Promotor · Neutral · Detractor (opcional).'], ['empresa · creado · actualizado', 'texto / ISO', 'Copia del nombre de la empresa y control.']] },
  solicitudes: { n: 'Casos técnicos', key: 'id = SI-AA-NNN', f: [
    ['origen · oppId · proyecto · clienteId', 'texto / id', 'Oportunidad (→ opps.id) o proyecto en ejecución.'], ['alcance · prioridad · solicitante · coordinador', 'texto / lista', 'Datos del caso.'],
    ['fSolicitud · fKickoff · fLimiteConsultas · fRequeridaSolucion · fRequeridaCosteo · fCierre', 'fecha ISO', 'Hitos del caso técnico.'], ['estado', 'lista', 'Abierta · Cerrada · Cancelada.'],
    ['esp', 'lista de objetos', 'Por especialidad: {esp, rubro, rubroOtro, especialista, etapa, ent{clave:{st:pend|ok|na, f}}, fAsignado, fConsultas, sinConsultas, fComprometida, compPor, compFecha, fRevisada, revisiones[{f, ant, motivo, detalle, por, fReg, ts}], fEntregaFinal (= fSolucion), fCosteo, notas}.'],
    ['log', 'lista de objetos', 'Historial {f, t, ts}. Solo se agregan entradas.'], ['sharepoint', 'URL', 'Carpeta del caso.']] },
  config: { n: 'Configuración', key: 'objeto único config', f: [
    ['equipo', 'lista', '{ini, nombre, activo}: responsables comerciales.'], ['especialistas', 'lista', '{nombre, activo}: especialistas de ingeniería (todos atienden todas las especialidades).'],
    ['coordinadorDefault', 'texto', 'Coordinador técnico propuesto en cada caso (por defecto Hernán Olguín).'], ['catalogo', 'objeto', '{especialidad:{d, r[rubros], validado{f}}}: a qué corresponde cada especialidad y sus rubros.'],
    ['archivo', 'objeto', '{equipo:[{ini, nombre, eliminado}], especialistas:[…]}: personas eliminadas, conservadas para el historial.'], ['parametros', 'objeto', 'Umbrales de pronóstico, textos de cierre esperado, periodo, probEtapa{etapa: 0–1}, días de alertas y plazos sugeridos.']] },
};

export const CHANGELOG = [
  ['2.3 · React', '26/10/2026', 'Nueva interfaz en React 18 + Vite con las mismas reglas, textos y estilos de la versión 2.3. Los datos se guardan en este navegador (localStorage) y se sincronizan entre pestañas; respaldo e importación en JSON desde Configuración → Respaldo e integración. Las fichas de oportunidad, caso técnico y cliente se abren por enlace (URL) y se cierran con el botón Atrás.'],
  ['2.3', '23/10/2026', 'Acuerdos de la reunión del 16/10 (Víctor Salas): por cada especialidad, fecha comprometida fijada por el coordinador técnico (corregible solo el mismo día, luego fija), fecha de entrega comprometida revisada (un solo campo, con contador e historial de cambios) y fecha de entrega final; cumplimiento y desvío contra la fecha original. Coordinador técnico por defecto Hernán Olguín (editable). Los cinco especialistas en todos los menús. Rubros por especialidad (propuesta por validar con gerencia). Se retiró “Tipo de solución” de la ficha. Rediseño (24/10): menú de 10 módulos con pestañas, tabla de fechas por especialidad con acciones rápidas (fijar, revisar, registrar entrega), tarjetas filtrables, botón principal según el módulo y reasignación rápida de la cartera de ex colaboradores (JT, JM).'],
  ['2.2', '16/10/2026', 'JM = Jean Meléndez. Equipo y especialistas totalmente editables y eliminables, con reasignación previa, cambio de iniciales en cascada y archivo restaurable. Parámetros y estimaciones editables (pronóstico, probabilidad por etapa con medianas reales, plazos y alertas) y panel de valores reales medidos con calibración del pronóstico. Adaptador para backend Node.js + MongoDB.'],
  ['2.1', '13/10/2026', 'Nombres confirmados (JP Javier Ponce, JH Jhonatan). Reasignación individual o masiva de oportunidades de personas inactivas. Edición rápida de RUC/RUT, dirección y web con validación. Respaldo completo en JSON y ficha técnica.'],
  ['2.0', '12/10/2026', 'Acuerdos de la reunión del 30/09: standby, causa “Otra”, ficha de cliente y de contacto (9 campos), equipo editable, carpeta SharePoint, responsable del envío de ofertas, histórico retirado, solicitudes a ingeniería (v1).'],
  ['1.0', '30/09/2026', 'Migración del Excel “00. Numeracion_Oportunidades” a base compartida: oportunidades, bitácora, ofertas, revisión semanal, lecciones, calidad de datos y guía de uso.'],
];

/** Verificación de integridad en vivo: [{ok, t, n}] */
export function integrityReport({ opps, clientes, contacts, solicitudes, config }) {
  const r = [], ids = new Set(clientes.map(c => c.id)), oids = new Set(opps.map(o => o.id)), eq = config.equipo || [];
  const add = (t, n) => r.push({ ok: n === 0, t, n });
  add('Toda oportunidad apunta a un cliente existente', opps.filter(o => !o.clienteId || !ids.has(o.clienteId)).length);
  add('Todo contacto apunta a una empresa existente', contacts.filter(k => !k.empresaId || !ids.has(k.empresaId)).length);
  add('Todo caso técnico apunta a una oportunidad existente', solicitudes.filter(s => s.oppId && !oids.has(s.oppId)).length);
  add('Ninguna oportunidad activa sin etapa', opps.filter(o => isActive(o) && !ETAPAS_ABIERTAS.includes(o.etapa)).length);
  const rucs = clientes.filter(c => c.ruc).map(c => c.ruc); add('RUC/RUT sin duplicados', rucs.length - new Set(rucs).size);
  const nm = clientes.map(c => c.nombre); add('Razón social sin duplicados', nm.length - new Set(nm).size);
  add('Todo responsable existe en el equipo', opps.filter(o => o.resp && !eq.some(p => p.ini === o.resp)).length);
  return r;
}

export const oppsCsv = (O, ctx) => csvOf([
  ['numero', 'N°'], ['pais', 'País'], ['resp', 'Responsable'], ['fCreacion', 'Fecha creación'], ['ref', 'Referencia'], ['cliente', 'Cliente comprador', o => cliName(o, ctx)],
  ['clienteFinal', 'Cliente final', o => cliFinalName(o, ctx)], ['vertical', 'Vertical'], ['estado', 'Estado', stageLabel], ['etapa', 'Etapa'], ['monto', 'Monto USD'], ['prob', 'Probabilidad'],
  ['forecast', 'Pronóstico', o => forecastOf(o, ctx.params)], ['fCierre', 'Fecha prevista cierre'], ['fUltimaOferta', 'Fecha última oferta'], ['decisorTecnico', 'Decisor técnico'],
  ['decisorFinal', 'Decisor final'], ['proxAccion', 'Próxima acción'], ['fProxAccion', 'Fecha próxima acción'], ['standby', 'Motivo standby', o => (o.standby ? o.standby.motivo : '')],
  ['causa', 'Causa pérdida', causaTxt], ['lecciones', 'Lecciones'], ['sharepoint', 'Carpeta SharePoint'], ['bitacora', 'Bitácora', o => (o.bitacora || []).map(e => `${e.f || ''} ${e.t}`).join(' | ')]], O);

export const clientesCsv = L => csvOf([['id', 'Id'], ['nombre', 'Razón social'], ['nombreComercial', 'Nombre comercial'], ['ruc', 'RUC / RUT'], ['pais', 'País'], ['tipo', 'Tipo'],
  ['direccion', 'Dirección'], ['web', 'Página web'], ['vertical', 'Vertical'], ['notas', 'Notas']], L);
