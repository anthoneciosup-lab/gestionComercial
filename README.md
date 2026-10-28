# VOYANT Gestión Comercial · Frontend React

Versión 2.3 del sistema comercial reescrita en **React 18**, organizada por módulos y componentes, con los datos guardados en el **localStorage** del navegador.

## Arranque
```bash
npm install
npm run dev          # http://localhost:5173 (desarrollo)
npm run build        # genera dist/ (estático: se puede servir desde cualquier servidor o carpeta)
npm run preview      # sirve dist/ en http://localhost:4173
npm test             # pruebas de reglas de negocio y persistencia (vitest)
npm run test:e2e     # prueba en navegador sobre el build (requiere playwright y `npm run preview` activo)
```

## Datos y persistencia
- La primera vez se carga la base inicial `src/data/seed.json`: 229 oportunidades, 89 empresas y 53 contactos reales del Excel, más la configuración (equipo, especialistas y coordinador por defecto).
- **Dónde se guarda:** todo cambio se guarda en `localStorage`, en la clave `voyant.comercial.datos`.
- **Cuándo se guarda:** automáticamente, unos 250 ms después del último cambio.
- **Varias pestañas:** si el sistema está abierto en otra pestaña del mismo navegador, esa pestaña se actualiza sola.
- **Filtros:** los filtros de cada persona (responsable y país) se guardan en `voyant.comercial.ui`.
- **Respaldo:** está en *Configuración → Respaldo e integración*:
  - descargar un respaldo JSON;
  - importar un respaldo (también el del sistema anterior);
  - restablecer la base inicial;
  - exportar CSV.
- **Importante:** localStorage es por navegador y por equipo. Para trabajar en equipo con los mismos datos, conectar el servidor Node.js + MongoDB. Basta con cambiar `src/store/storage.js` por un repositorio que use la API, con las mismas funciones `load`, `save` y `subscribe`; los componentes no cambian.

## Estructura (resumen)
```
src/
  domain/        reglas de negocio puras (pronóstico, alertas, fechas comprometidas, cumplimiento, validaciones)
  store/         StoreProvider (estado + acciones) y storage (localStorage)
  components/ui  Modal, Drawer, Tabs, Kpi, Stat, BarRows, EtapaPill, selects del catálogo…
  components/layout  Sidebar, Topbar, Layout (fichas laterales por URL: ?opp= ?caso= ?cliente=)
  features/      tablero · pipeline · oportunidades · agenda · ingenieria · clientes · contactos · analisis · config · guia
```
El detalle de contratos entre módulos, la forma de los datos y las reglas está en `docs/ARQUITECTURA.md`.

## Módulos
| Menú | Ruta | Contenido |
|---|---|---|
| Tablero | `/tablero` | Montos registrados frente a estimaciones, completitud de datos, embudo, pronóstico, por responsable, cartera por reasignar |
| Pipeline | `/pipeline` | Kanban con arrastrar y soltar (etapas, standby, ganada, perdida) |
| Oportunidades | `/oportunidades` | Registro maestro, filtros, CSV y ficha con resumen, bitácora, ofertas, ingeniería y cierre |
| Agenda y revisión | `/agenda`, `/agenda/revision` | Próximas acciones agrupadas y revisión semanal |
| Casos técnicos | `/ingenieria` | Fecha comprometida (fija), revisada (contador e historial) y entrega final por especialidad; cumplimiento e indicadores |
| Clientes / Contactos | `/clientes`, `/contactos` | Fichas, completar RUC, dirección y web, y los 9 campos de contacto |
| Resultados y calidad | `/analisis/...` | Ganadas y perdidas, calidad de datos, valores reales |
| Configuración | `/config/...` | Equipo y ex colaboradores, especialistas, rubros, parámetros, respaldo |
| Guía de uso | `/guia` | Cómo usar el sistema |

## Verificación
- **20 pruebas unitarias** (`npm test`): reglas, fechas comprometidas, cumplimiento, numeración, validaciones y persistencia.
- **21 comprobaciones en navegador** (`tests/e2e.cjs`):
  - caso técnico completo (fijar, revisar, entregar);
  - persistencia tras recargar y sincronización entre pestañas;
  - reasignación de la cartera de JT;
  - bitácora;
  - arrastrar en el pipeline;
  - descarga del respaldo;
  - todas las rutas y la vista móvil sin errores.
