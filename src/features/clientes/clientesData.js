/** Cálculos puros del módulo Clientes (agregados por empresa y validación de la ficha). */
import { isActive, isStandby, isOpen, lastActivity } from '../../domain/rules.js';
import { rucCheck, webNorm } from '../../domain/validators.js';

export const FALTAN_KEYS = ['ruc', 'direccion', 'web'];
export const faltan = c => FALTAN_KEYS.filter(k => !c[k]).length;
export const incompleta = c => !c.ruc || !c.direccion || !c.web;
const sum = L => L.reduce((s, x) => s + (x.monto || 0), 0);

/** Agregado de una empresa a partir de las oportunidades (ya filtradas), contactos y casos técnicos. */
export function aggCliente(c, opps, contacts, sols) {
  const o = opps.filter(x => x.clienteId === c.id || x.clienteFinalId === c.id), comp = o.filter(x => x.clienteId === c.id);
  const w = comp.filter(x => x.etapa === 'CERRADA GANADA'), l = comp.filter(x => x.etapa === 'CERRADA PERDIDA'), op = comp.filter(isActive);
  return {
    ...c, o, n: comp.length, nf: o.length - comp.length, open: op.length, sb: comp.filter(isStandby).length, pip: sum(op),
    w: w.length, l: l.length, wv: sum(w), wr: w.length + l.length ? w.length / (w.length + l.length) : null,
    last: o.map(lastActivity).sort().pop() || '', con: contacts.filter(k => k.empresaId === c.id).length,
    sol: sols.filter(s => s.clienteId === c.id).length, faltan: faltan(c),
  };
}
export const aggClientes = (clientes, opps, contacts, sols) => clientes.map(c => aggCliente(c, opps, contacts, sols));

export const abiertasDe = (id, opps) => opps.filter(o => o.clienteId === id && isOpen(o)).length;

export const webOk = w => !w || /^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(webNorm(w));

/** Duplicado por RUC/RUT en otra empresa. */
export const rucDuplicado = (ruc, selfId, clientes) => (ruc ? clientes.find(x => x.id !== selfId && (x.ruc || '').toUpperCase() === ruc.toUpperCase()) : null);

/** Duplicado por razón social (sin distinguir mayúsculas), incluidos los nombres con que figuraba (alias). */
export function nombreDuplicado(nombre, selfId, clientes) {
  const n = nombre.trim().toLowerCase();
  return clientes.find(c => c.id !== selfId && [c.nombre, ...(c.alias || [])].some(a => String(a || '').trim().toLowerCase() === n));
}

/** Valida los datos de la ficha; devuelve el mensaje de error o ''. */
export function validarCliente(d, selfId, clientes) {
  if (!d.nombre) return 'La razón social es obligatoria.';
  const dn = nombreDuplicado(d.nombre, selfId, clientes);
  if (dn) return `Ya existe: ${dn.nombre}. Búscalo en la lista en vez de crear otro.`;
  const rc = rucCheck(d.ruc, d.pais); if (rc) return rc;
  const dr = rucDuplicado(d.ruc, selfId, clientes);
  if (dr) return `El RUC / RUT ya está registrado en ${dr.nombre}.`;
  if (!webOk(d.web)) return 'La página web no es válida.';
  return '';
}
