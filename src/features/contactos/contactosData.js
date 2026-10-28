/** Funciones puras del módulo Contactos. */
import { emailOk } from '../../domain/validators.js';
import { csvOf } from '../../domain/csv.js';

/** Siguiente id correlativo: c001, c002… */
export function nextContactId(contacts) {
  const mx = contacts.reduce((m, k) => { const x = /^c(\d+)$/.exec(k.id); return x ? Math.max(m, +x[1]) : m; }, 0);
  return 'c' + String(mx + 1).padStart(3, '0');
}
export function validarContacto(d, selfId, contacts) {
  if (!d.nombre || !d.empresaId) return 'Nombre completo y empresa son obligatorios.';
  if (!emailOk(d.email)) return 'El email no tiene un formato válido.';
  if ((d.notas || '').length > 280) return 'Las notas clave admiten hasta 280 caracteres.';
  if (contacts.some(x => x.id !== selfId && x.empresaId === d.empresaId && x.nombre.toLowerCase() === d.nombre.toLowerCase())) return 'Ese contacto ya existe en esta empresa.';
  return '';
}
/** Interacciones de bitácora registradas con este contacto (más recientes primero). */
export const historialDe = (id, opps) => opps.flatMap(o => (o.bitacora || []).filter(e => e.contacto === id).map(e => ({ ...e, o }))).sort((a, b) => (b.f || '').localeCompare(a.f || ''));
/** Oportunidades de su empresa donde figura como decisor (coincidencia por primer nombre). */
export function decisorEn(k, opps) {
  const n = (k.nombre || '').split(' ')[0].toLowerCase(); if (!n) return [];
  return opps.filter(o => (o.clienteId === k.empresaId || o.clienteFinalId === k.empresaId) && [o.decisorTecnico, o.decisorFinal].some(x => x && x.toLowerCase().includes(n)));
}
export const contactosCsv = (L, cliById) => csvOf([
  ['nombre', 'Nombre completo'], ['empresa', 'Empresa', k => cliById(k.empresaId)?.nombre || ''], ['ruc', 'RUC empresa', k => cliById(k.empresaId)?.ruc || ''],
  ['cargo', 'Cargo'], ['area', 'Área'], ['email', 'Email'], ['telefono', 'Teléfono / WhatsApp'], ['roles', 'Rol / influencia', k => (k.roles || []).join(', ')],
  ['postura', 'Postura'], ['ultimaInteraccion', 'Última interacción'], ['notas', 'Notas clave']], L);
