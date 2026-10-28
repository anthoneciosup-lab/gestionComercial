# VOYANT Gestión Comercial · Frontend React: arquitectura y contratos

React 18 + Vite 5 + React Router 6 (HashRouter). JavaScript (JSX) sin TypeScript. Sin otras dependencias.
Persistencia: **localStorage** (clave `voyant.comercial.datos`). La primera vez se carga `src/data/seed.json` (datos reales del Excel).

## Estructura
```
src/
  main.jsx · App.jsx                 entrada y rutas
  app/routes.js                      menú (NAV) y títulos de módulo (PAGE)
  app/useDrawer.js                   abrir/cerrar fichas laterales por URL (?opp= ?caso= ?cliente=)
  data/seed.json                     base inicial (229 opps, 89 clientes, 53 contactos, config)
  domain/                            lógica pura, SIN React (testeable con vitest)
    constants.js format.js rules.js ingenieria.js csv.js validators.js
  store/storage.js                   localStorage: load/save/subscribe/normalize/clear
  store/StoreProvider.jsx            estado global + acciones + hooks
  components/ui/                     piezas visuales reutilizables (index.js las exporta)
  components/layout/                 Sidebar, Topbar, Layout
  features/<módulo>/                 una carpeta por módulo, con sus páginas, fichas y ventanas
  styles/app.css                     estilos (mismas clases que la versión 2.3 en HTML)
```

## Datos (forma de los registros)
Igual que la versión 2.3. Ver `/home/claude/voyant/src/e2_tecnica.js` (objeto `SCHEMA`) para la lista completa de campos.
- `opps[]`: id (= numero), numero, anio, correlativo, pais ('PERÚ'|'CHILE'|'ECUADOR'|'OTROS'), paisCod, fCreacion, resp (iniciales), ref, clienteId, clienteFinalId, cliente, clienteFinal, etapa ('PROSPECTO'|'CALIFICACIÓN'|'PROPUESTA'|'CIERRE'|'CERRADA GANADA'|'CERRADA PERDIDA'|''), standby ({motivo, desde, fRevision, etapaPrevia, nota} | null), monto, prob (0–1|null), forecast (''|'Commit'|'Best'|'Pipeline'), fCierre, fConsulta, fOfertaRequerida, fUltimaOferta, proxAccion, fProxAccion, decisorTecnico, decisorFinal, vertical, lineas {energia, clima, security}, ingenieria, sharepoint, bitacora [{f,t,a,tipo,contacto,origen,ts}], versiones [{v,f,monto,nota,resp,contacto,cambios}], revision {…}, causaPerdida, causaOtra, competidor, lecciones, forecastAlCierre, probAlCierre, obs[].
- `clientes[]`: id ('cl-…'), nombre, nombreComercial, ruc, pais, tipo ('Cliente'|'Proveedor'|'Socio'), direccion, web, vertical, notas, alias[].
- `contacts[]`: id ('c001'…), nombre, empresaId, cargo, area, email, telefono, roles[], postura, ultimaInteraccion, notas (≤280).
- `solicitudes[]` (casos técnicos): id ('SI-AA-NNN'), origen ('Oportunidad'|'Proyecto'), oppId, proyecto, clienteId, alcance, prioridad, solicitante, coordinador, fSolicitud, fKickoff, fLimiteConsultas, fRequeridaSolucion, fRequeridaCosteo, fCierre, estado ('Abierta'|'Cerrada'|'Cancelada'), sharepoint, log [{f,t,ts}], esp [{id, esp, rubro, rubroOtro, especialista, etapa, fAsignado, ent{clave:{st:'pend'|'ok'|'na', f}}, fConsultas, sinConsultas, fComprometida, compPor, compFecha, fRevisada, revisiones[{f,ant,motivo,detalle,por,fReg,ts}], fEntregaFinal, fSolucion, fCosteo, notas}].
- `config`: equipo [{ini,nombre,activo}], especialistas [{nombre,activo}], archivo {equipo:[{ini,nombre,eliminado}], especialistas:[{nombre,eliminado}]}, parametros {…DEFAULT_PARAMS}, catalogo {esp:{d,r[],validado:{f}|null}}, coordinadorDefault.

## Store (`src/store/StoreProvider.jsx`)
```js
const { state, actions, info } = useStore();
// state: { opps, clientes, contacts, solicitudes, config }
actions.upsert(coll, doc)               // crea o reemplaza (doc.id obligatorio)
actions.patch(coll, id, cambios)        // modifica campos
actions.remove(coll, id)
actions.updateOpp(id, cambios, log?)    // log {t, tipo?, a?, contacto?, f?} | lista → se AGREGA a la bitácora; actualiza ultimaInteraccion del contacto
actions.updateCaso(id, cambios, texto?) // agrega texto al historial (log) del caso
actions.setConfig(config)               // reemplaza la configuración completa
actions.importData(json) / actions.exportData() / actions.resetToSeed()
const ctx = useCtx();                   // reglas: ctx.params, ctx.catalog, ctx.coordDef, ctx.cliById(id), ctx.respName(ini), ctx.respActivo(ini), ctx.equipoActivo, ctx.especialistasActivos, ctx.solsDe(oppId), ctx.cfg
const { ui, set } = useUi();            // filtros globales {resp, pais}
const opps = useScopedOpps();           // oportunidades filtradas por responsable y país
```
Las acciones son síncronas y lanzan `Error('mensaje en español')` si algo no existe. Después de guardar, mostrar `toast('Guardado')` (`useToast()`).

## Dominio (`src/domain`)
- format: `hoyISO, addDays, diffDays, fd, nowTs, usd, pct, clone, etLabel`
- rules: `getParams, forecastTexts, getCatalog, makeCtx, isClosed, isStandby, isActive, isOpen, stageKey, stageLabel, causaTxt, cliName(o,ctx), cliFinalName(o,ctx), forecastOf(o, ctx.params), lastActivity, alerts(o, ctx), ISSUES, porReasignar(opps, ctx), nextNumero(opps, paisCod)`
- ingenieria: `espKey, espCorto, espIdx, espVigente, espFinal, espRubro, espAvance, compCorregible, espCumpl(e, abierta, ctx.params), solEtapa, solListo, solAvance, solAlerts(s, ctx.params), cumplAgg(rows, ctx.params), allEsp(sols), nextSolId(sols), groupRubros`
- csv: `csvOf(cols, rows)`, `downloadText(nombre, texto, tipo)` · validators: `rucCheck, webNorm, emailOk, slugCliente`
- constants: ETAPAS, ETAPAS_ABIERTAS, PAISES, VERTICALES, ACCIONES, TIPOS_BIT, CAUSAS, MOTIVOS_STANDBY, DEFAULT_PARAMS, DESLICES, AREAS, ROLES_CONTACTO, POSTURAS, TIPOS_EMPRESA, ESPECIALIDADES, ESP_CORTO, DEFAULT_CATALOGO, ESPECIALISTAS_BASE, MOTIVOS_REVISION, ETAPAS_ING, ENTREGABLES, PRIORIDADES, SOLUCIONES, APP

## Componentes UI (`import {...} from '../../components/ui/index.js'`)
`Modal({title, subtitle, onClose, onOk, okLabel, wide})` (onOk puede lanzar Error → se muestra; devolver false la deja abierta) ·
`Drawer({label, header, actions, footer, onClose})` · `Tabs({tabs:[{key,label,badge}], value, onChange, className})` ·
`KpiGrid({cols})`, `Kpi({label,value,detail,tone})`, `Stat({label,value,detail,tone,active,onClick})`, `Card({title,sub,onClick,className})`, `Tag({kind:'real'|'est'})`,
`EtapaPill({o})`, `ForecastChip({o, params})`, `DateCell({iso})`, `Flags({items,max})`, `Progress({value})`, `CumplChip({c})`, `Empty`, `BarRows({rows:[{label,v,txt,color,title,onClick}], max, color})`, `stageColor`,
`Field({label, full, hint})`, `Options({list, blank})`, `RespSelect`, `EspecialistaSelect`, `ClienteSelect({value,onChange,onNew,tipo})`, `RubroSelect({especialidad,value,onChange})`, `useForm(init)`, `useToast()`.

## Fichas y ventanas compartidas (contratos fijos entre módulos)
| Archivo (default export) | Props | Lo usan |
|---|---|---|
| `features/oportunidades/OppDrawer.jsx` | `{id, tab, onTab(tab), onClose}` · pestañas: resumen, bitacora, propuestas, ingenieria, cierre | Layout |
| `features/oportunidades/NewOppModal.jsx` | `{onClose, onCreated(id)}` | Layout |
| `features/oportunidades/ReasignarModal.jsx` | `{list: opps[], title?, onClose}` | Tablero, Oportunidades, Config |
| `features/oportunidades/CierreModal.jsx` | `{opp, to: 'CERRADA GANADA'|'CERRADA PERDIDA', onClose}` | Pipeline, OppDrawer |
| `features/oportunidades/StandbyModal.jsx` | `{opp, onClose}` (pasar a standby o editar/posponer un standby) | Pipeline, OppDrawer, Agenda |
| `features/oportunidades/ReactivarModal.jsx` | `{opp, etapa?, onClose}` (sacar de standby) | OppDrawer, Pipeline, Agenda |
| `features/agenda/ActionModal.jsx` | `{opp, onClose}` (registrar resultado y definir la siguiente acción) | Agenda |
| `features/ingenieria/NewCaseModal.jsx` | `{opp?, onClose, onCreated(id)}` | Layout, OppDrawer |
| `features/ingenieria/CaseDrawer.jsx` | `{id, onClose}` | Layout |
| `features/clientes/ClienteFormModal.jsx` | `{cliente?, onClose, onSaved(id)}` (crear o editar) | Layout, NewOppModal, ContactoModal |
| `features/clientes/ClienteDrawer.jsx` | `{id, onClose}` | Layout |
| `features/contactos/ContactoModal.jsx` | `{contacto?, empresaId?, onClose}` (crear o editar) | Layout, ClienteDrawer |

Abrir fichas desde cualquier lugar: `const d = useDrawer(); d.open('opp', id, 'ingenieria'); d.open('caso', id); d.open('cliente', id)`.
Navegar con filtros: `navigate('/oportunidades', { state: { etapa, alerta } })`; Oportunidades los lee con `useLocation().state` (etapa: 'ACTIVAS', 'STANDBY', 'GANADA', 'PERDIDA' o una etapa abierta; alerta: una clave de `ISSUES`).

## Notas de implementación
- Las acciones del store aplican cada cambio también a una referencia interna (`commit`), así varias acciones seguidas sobre el mismo registro no se pisan.
- `Modal`: Escape cierra solo la ventana de arriba. `Drawer`: Escape cierra la ficha si no hay ventanas abiertas.
- Cada módulo se carga bajo demanda (`React.lazy`); el paquete principal incluye la base inicial (seed.json).

## Reglas para escribir módulos
1. Textos en español, claros, sin tecnicismos. Fechas con `fd()`, montos con `usd()`.
2. Reutilizar las clases de `styles/app.css` (las mismas que el HTML de la v2.3: `card`, `kpis`, `kpi`, `toolbar`, `tw`, `table`, `click`, `ref`, `pill`, `flag`, `btn pri|sm|xs|ghost|danger`, `f`, `grid g2|g3`, `stats`, `stat`, `tabs`, `tdates`, `dates3`, `espcard`, `ents`, `seg3`, `stepper`, `hero-empty`, `flow3`, `actcard`, `mini3`, `dsec`, `tag`, `compl`, `cbar`, `catgrid`, `catf`, `revs`, `cchip`, `cnt`, `qfix`, `kanban`, `col`, `kc`, `drop`, `closedrow`, `tl`, `rev`, `legend-fc`, `lesson`, `banner`, `empty`, `muted`, `num`, `mono`…).
3. Comportamiento = el de la v2.3. La implementación de referencia (HTML + JS) está en `/home/claude/voyant/src/*.js`:
   a_core (reglas), b_views (tablero, pipeline, oportunidades, agenda, revisión, reasignación), c_rel (clientes, contactos, lecciones, calidad, configuración, catálogo, parámetros, valores reales), d_ficha (ficha de oportunidad, cierre, standby, nueva oportunidad, modal), e_ing (casos técnicos), e2_tecnica (ficha técnica y respaldo), f_guia (guía).
4. Componentes funcionales con hooks; un archivo por componente principal; subcomponentes pequeños en el mismo archivo o en la carpeta del módulo. Lógica de cálculo en `domain/` o en funciones puras del módulo, no dentro del JSX.
5. Nunca borrar historial: bitácoras, `log` y `revisiones` solo agregan entradas.
6. No agregar dependencias.
