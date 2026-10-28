/** Exportación del registro de oportunidades a CSV (mismas columnas que la v2.3, sin “Tipo de solución”). */
import { csvOf, downloadText } from '../../domain/csv.js';
import { hoyISO } from '../../domain/format.js';
import { causaTxt, cliFinalName, cliName, forecastOf, stageLabel } from '../../domain/rules.js';

export function oppCsvColumns(ctx) {
  return [
    ['numero', 'N°'], ['pais', 'País'], ['resp', 'Responsable'], ['fCreacion', 'Fecha creación'], ['ref', 'Referencia'],
    ['cliente', 'Cliente comprador', o => cliName(o, ctx)], ['clienteFinal', 'Cliente final', o => cliFinalName(o, ctx)],
    ['vertical', 'Vertical'], ['estado', 'Estado', o => stageLabel(o)], ['etapa', 'Etapa'], ['monto', 'Monto USD'], ['prob', 'Probabilidad'],
    ['forecast', 'Pronóstico', o => forecastOf(o, ctx.params)], ['fCierre', 'Fecha prevista cierre'], ['fUltimaOferta', 'Fecha última oferta'],
    ['decisorTecnico', 'Decisor técnico'], ['decisorFinal', 'Decisor final'], ['proxAccion', 'Próxima acción'], ['fProxAccion', 'Fecha próxima acción'],
    ['standby', 'Motivo standby', o => (o.standby ? o.standby.motivo : '')], ['causa', 'Causa pérdida', causaTxt], ['lecciones', 'Lecciones'],
    ['sharepoint', 'Carpeta SharePoint'], ['bitacora', 'Bitácora', o => (o.bitacora || []).map(e => `${e.f || ''} ${e.t}`).join(' | ')],
  ];
}

export function exportOppsCSV(list, ctx) {
  downloadText(`VOYANT_oportunidades_${hoyISO()}.csv`, csvOf(oppCsvColumns(ctx), list), 'text/csv;charset=utf-8');
}
