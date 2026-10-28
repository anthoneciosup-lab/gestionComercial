/**
 * Catálogos y valores por defecto del proceso comercial de VOYANT.
 * Fuente: Excel “00. Numeracion_Oportunidades”, PPT del proceso comercial y reuniones del 30/09 y 16/10/2026.
 */
export const APP={version:'2.3',fecha:'2026-10-26',nombre:'VOYANT Gestión Comercial'};
export const ETAPAS_ABIERTAS=['PROSPECTO','CALIFICACIÓN','PROPUESTA','CIERRE'];
export const ETAPAS=[...ETAPAS_ABIERTAS,'CERRADA GANADA','CERRADA PERDIDA'];
export const PAISES={1:'PERÚ',2:'CHILE',3:'ECUADOR',4:'OTROS'};
export const VERTICALES=['DATACENTER','MINERÍA','INDUSTRIA ELÉCTRICA','INDUSTRIA','OTROS'];
export const SOLUCIONES=['Baterías','UPS','Solución DC','Solución AC','Gabinete o Rack','Servicio','Solar','Repuestos','Motogeneradores','Otro'];
export const ACCIONES=['Enviar propuesta','Llamar para seguimiento','Reunión de cierre','Llamar para presentación','Enviar encuesta de satisfacción','Visita técnica / inspección','Pedir cotización a fabricante','Negociación'];
export const TIPOS_BIT=['Nota','Llamada','Reunión','Email','Visita','Oferta enviada'];
export const CAUSAS=['Precio','Acceso a decisores','Alcance incompleto','Plazo de entrega','Requisitos / homologación','Oferta no enviada a tiempo','Capacidad / estructura','Cliente canceló / sin presupuesto','Competidor preferido','Otra'];
export const MOTIVOS_STANDBY=['Cliente pospuso el presupuesto','Proyecto en pausa por el cliente','Esperando definición del cliente','Licitación postergada','Otro'];
/* Parámetros editables (Equipo y catálogos → Parámetros). Valores por defecto: probabilidades = mediana real por etapa en los datos 2026. */
export const DEFAULT_PARAMS={commitMin:0.9,commitCierreMin:0.8,bestMin:0.5,tasaCommit:'90–95 %',tasaBest:'50–70 %',tasaPipeline:'10–30 %',periodo:'Trimestre',
  probEtapa:{PROSPECTO:0.1,'CALIFICACIÓN':0.2,PROPUESTA:0.4,CIERRE:0.6},diasSinMovimiento:30,diasConsultasAviso:2,diasProxAccion:7,diasPrimeraAccion:3,
  diasStandbyRevision:30,diasPosventa:14,diasSolucionAntesOferta:5,diasCosteoAntesOferta:2,diasCompromisoAviso:2,diasParaComprometer:2};

export const DESLICES=['Demora del lado del comprador','Exceso de optimismo del representante','Falla del proceso'];
export const AREAS=['Compras','Ingeniería','Operaciones','Mantenimiento','Proyectos','Gerencia','Logística','Finanzas','TI','Otra'];
export const ROLES_CONTACTO=['Decisor','Influenciador','Técnico','Compras','Usuario'];
export const POSTURAS=['Promotor','Neutral','Detractor'];
export const TIPOS_EMPRESA=['Cliente','Proveedor','Socio'];
/* Ingeniería (PPT “Proceso comercial”, láminas 5 a 8) */
/* Tres especialidades del proceso comercial (PPT, láminas 5–8; reunión del 16/10). Security, conectividad y telco es una sola especialidad con tres áreas. */
export const ESPECIALIDADES=['Potencia','Mecánica','Security, conectividad y telco'];
export const ESP_CORTO={'Potencia':'Potencia','Mecánica':'Mecánica','Security, conectividad y telco':'Security · Conect. · Telco','Security':'Security · Conect. · Telco','Conectividad':'Security · Conect. · Telco','Teleco':'Security · Conect. · Telco'};

/* Rubros por especialidad: PROPUESTA inicial, editable en Equipo y catálogos, por validar con gerencia (consulta del 23/10/2026) */
export const DEFAULT_CATALOGO={
  'Potencia':{d:'Energía eléctrica para infraestructura crítica (línea “energía” de la oportunidad).',r:['UPS y respaldo de energía','Bancos de baterías','Rectificadores y energía DC','Grupos electrógenos y transferencias (ATS)','Sistemas de media tensión','Tableros de distribución eléctrica de baja tensión','Energía solar o híbrida','Puesta a tierra y protección eléctrica']},
  'Mecánica':{d:'Gestión térmica y sistemas mecánicos (línea “clima” de la oportunidad).',r:['Gestión térmica','HVAC industrial','Ventilación y free cooling','Detección y extinción de incendios','Estructuras, soportería y canalizaciones','Obras civiles y shelters']},
  'Security, conectividad y telco':{d:'Seguridad electrónica, comunicaciones y telecomunicaciones (línea “security” de la oportunidad). Una sola especialidad; los rubros se agrupan por tipo de medio o servicio.',r:[
    'Protocolos de comunicación UTI, UTP/BNC · CCTV y videovigilancia','Protocolos de comunicación UTI, UTP/BNC · Control de acceso','Protocolos de comunicación UTI, UTP/BNC · Detección de intrusión y alarmas','Protocolos de comunicación UTI, UTP/BNC · Cableado estructurado de cobre','Protocolos de comunicación UTI, UTP/BNC · Redes LAN/WAN y Wi-Fi',
    'Fibra óptica · Planta interna y externa','Fibra óptica · Transmisión y backhaul',
    'Monitoreo variable · Monitoreo de variables','Monitoreo variable · Monitoreo remoto (NOC/SOC)',
    'PCIM',
    'Conectividad Teleco · Radioenlaces y microondas','Conectividad Teleco · Sitios celulares y radiobases','Conectividad Teleco · Sistemas DAS y small cells']}};

export const ESPECIALISTAS_BASE=['Ángel Yataco','Kevin Reyna','Pablo Cancino','Luis Alvarado','Hernán Olguín'];
export const MOTIVOS_REVISION=['Falta información del cliente','Consultas sin respuesta','Cambio de alcance','Carga de trabajo del especialista','Dependencia de proveedor o fabricante','Otro'];
export const ETAPAS_ING=['Asignada','Análisis técnico','Consultas','Diseño de solución','Solución entregada','En costeo','Costeo listo'];
export const ENTREGABLES=[['memoria','Memoria descriptiva'],['boq','BoQ (cuadro de cantidades)'],['equipos','Equipos con especificaciones'],['crono','Cronograma estimado'],['personal','Cuadro de personal requerido'],['herram','Cuadro de herramientas'],['riesgos','Cuadro de riesgos'],['premisas','Premisas (normativa aplicada)'],['exclus','Exclusiones']];
export const PRIORIDADES=['Alta','Media','Baja'];
