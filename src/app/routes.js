/** Menú y rutas. Las rutas con pestañas usan subrutas (/agenda/revision, /analisis/calidad, /config/parametros…). */
export const NAV = [
  { grupo: 'Seguimiento', items: [
    { to: '/tablero', label: 'Tablero' },
    { to: '/pipeline', label: 'Pipeline' },
    { to: '/oportunidades', label: 'Oportunidades', badge: 'opps' },
    { to: '/agenda', label: 'Agenda y revisión', badge: 'vencidas' },
  ] },
  { grupo: 'Ingeniería', items: [{ to: '/ingenieria', label: 'Casos técnicos', badge: 'casos' }] },
  { grupo: 'Cartera', items: [{ to: '/clientes', label: 'Clientes', badge: 'clientes' }, { to: '/contactos', label: 'Contactos', badge: 'contactos' }] },
  { grupo: 'Análisis', items: [{ to: '/analisis', label: 'Resultados y calidad' }] },
  { grupo: 'Administración', items: [{ to: '/config', label: 'Configuración' }] },
  { grupo: 'Ayuda', items: [{ to: '/guia', label: 'Guía de uso' }] },
];
export const PAGE = {
  tablero: { title: 'Tablero', sub: 'Montos reales registrados y estimaciones calculadas, separados; el standby no infla el embudo', filtros: true },
  pipeline: { title: 'Pipeline', sub: 'Arrastra una tarjeta para cambiar de etapa, pasarla a standby o cerrarla; cada cambio queda en la bitácora', filtros: true },
  oportunidades: { title: 'Oportunidades', sub: 'Registro maestro: una fila por oportunidad, una ficha por oportunidad', filtros: true },
  agenda: { title: 'Agenda y revisión', sub: 'Próximas acciones con fecha y responsable, y la revisión semanal de cada oportunidad activa', filtros: true },
  ingenieria: { title: 'Casos técnicos', sub: 'Casos técnicos por especialidad: fecha comprometida, fecha revisada y entrega final', nuevo: 'caso' },
  clientes: { title: 'Clientes', sub: 'Ficha de cada empresa: datos, oportunidades, contactos y casos técnicos', nuevo: 'cliente' },
  contactos: { title: 'Contactos', sub: 'Ficha de contacto vinculada siempre a una empresa de la lista de clientes', nuevo: 'contacto' },
  analisis: { title: 'Resultados y calidad', sub: 'Por qué ganamos y perdemos, qué falta registrar y cómo rinde el embudo en la realidad', filtros: true },
  config: { title: 'Configuración', sub: 'Equipo, especialidades, parámetros, respaldo e integración' },
  guia: { title: 'Guía de uso', sub: 'Cómo usar el sistema paso a paso' },
};
