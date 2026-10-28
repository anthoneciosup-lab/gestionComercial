import { describe, it, expect, beforeEach } from 'vitest';
import seed from '../src/data/seed.json';
import { makeCtx, forecastOf, alerts, porReasignar, nextNumero, isActive } from '../src/domain/rules.js';
import { espCumpl, compCorregible, cumplAgg, espKey, groupRubros } from '../src/domain/ingenieria.js';
import { addDays, hoyISO, usd } from '../src/domain/format.js';
import { rucCheck, webNorm } from '../src/domain/validators.js';
import * as storage from '../src/store/storage.js';

const ctx = makeCtx(seed); const P = ctx.params; const h = hoyISO();

describe('datos reales', () => {
  it('base inicial completa', () => { expect(seed.opps).toHaveLength(229); expect(seed.clientes).toHaveLength(89); expect(seed.contacts).toHaveLength(53); });
  it('toda oportunidad apunta a un cliente existente', () => { expect(seed.opps.every(o => ctx.cliById(o.clienteId))).toBe(true); });
  it('32 oportunidades abiertas de JT por reasignar', () => { expect(porReasignar(seed.opps, ctx).length).toBe(32); });
});
describe('pronóstico', () => {
  it('sin probabilidad no se inventa', () => { expect(forecastOf({ etapa: 'PROPUESTA', prob: null }, P)).toBe(''); });
  it('umbrales', () => {
    expect(forecastOf({ etapa: 'PROPUESTA', prob: 0.9 }, P)).toBe('Commit');
    expect(forecastOf({ etapa: 'CIERRE', prob: 0.8 }, P)).toBe('Commit');
    expect(forecastOf({ etapa: 'PROPUESTA', prob: 0.5 }, P)).toBe('Best');
    expect(forecastOf({ etapa: 'PROPUESTA', prob: 0.2 }, P)).toBe('Pipeline');
  });
  it('alerta sin probabilidad', () => { const o = seed.opps.find(x => isActive(x) && x.prob == null); expect(alerts(o, ctx).some(a => a[2] === 'sinProb')).toBe(true); });
});
describe('fechas comprometidas', () => {
  const base = { fAsignado: addDays(h, -10), fComprometida: addDays(h, -2), compFecha: addDays(h, -5), revisiones: [] };
  it('vencida', () => { expect(espCumpl(base, true, P).k).toBe('vencida'); });
  it('a tiempo', () => { expect(espCumpl({ ...base, fEntregaFinal: addDays(h, -3) }, true, P).k).toBe('atiempo'); });
  it('dentro de lo revisado', () => { expect(espCumpl({ ...base, fRevisada: h, fEntregaFinal: h }, true, P).k).toBe('revisado'); });
  it('con atraso', () => { expect(espCumpl({ ...base, fEntregaFinal: h }, true, P).k).toBe('atraso'); });
  it('solo se corrige el mismo día y sin revisiones', () => {
    expect(compCorregible({ fComprometida: h, compFecha: h, revisiones: [] })).toBe(true);
    expect(compCorregible({ fComprometida: h, compFecha: addDays(h, -1), revisiones: [] })).toBe(false);
    expect(compCorregible({ fComprometida: h, compFecha: h, revisiones: [{}] })).toBe(false);
  });
  it('agregado de cumplimiento', () => {
    const s = { estado: 'Abierta' };
    const a = cumplAgg([{ s, e: { ...base, fEntregaFinal: addDays(h, -3) } }, { s, e: { ...base, fEntregaFinal: h } }], P);
    expect(a.ent).toBe(2); expect(a.pct).toBe(0.5);
  });
  it('datos antiguos de Security se agrupan', () => { expect(espKey('Teleco')).toBe('Security, conectividad y telco'); });
  it('rubros agrupados', () => { expect(groupRubros(ctx.catalog['Security, conectividad y telco'].r).map(g => g.group)).toEqual(['Protocolos de comunicación UTI, UTP/BNC', 'Fibra óptica', 'Monitoreo variable', '', 'Conectividad Teleco']); });
});
describe('numeración y validaciones', () => {
  it('siguiente número', () => { expect(nextNumero(seed.opps, 1).numero).toMatch(/^\d{2}-1\d{3}$/); });
  it('RUC y web', () => { expect(rucCheck('20123456789')).toBeNull(); expect(rucCheck('123')).not.toBeNull(); expect(webNorm('https://x.pe/')).toBe('x.pe'); });
  it('formato de montos', () => { expect(usd(24900000)).toBe('$24.9M'); expect(usd(566000)).toBe('$566K'); });
});
describe('persistencia', () => {
  beforeEach(() => localStorage.clear());
  it('sin datos guardados usa la base inicial', () => { expect(storage.load().origen).toBe('base inicial'); });
  it('guarda y vuelve a cargar', () => { const d = storage.seedData(); d.opps = d.opps.slice(0, 3); storage.save(d); const r = storage.load(); expect(r.origen).toBe('localStorage'); expect(r.data.opps).toHaveLength(3); });
  it('rechaza respaldos inválidos', () => { expect(() => storage.normalize({ opps: 'x' })).toThrow(); expect(() => storage.normalize({ opps: [{ ref: 'sin id' }] })).toThrow(); });
});
