/**
 * Estado global de datos (oportunidades, clientes, contactos, casos técnicos y configuración).
 * - useReducer + Context; cada cambio se guarda en localStorage (con un pequeño retraso para agrupar ráfagas).
 * - Las acciones son síncronas y devuelven el registro resultante (o lanzan Error con un mensaje en español).
 * - Bitácoras e historiales solo agregan entradas.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import * as storage from './storage.js';
import { makeCtx } from '../domain/rules.js';
import { hoyISO, nowTs } from '../domain/format.js';

const StoreCtx = createContext(null);
const COLLS = ['opps', 'clientes', 'contacts', 'solicitudes'];

function reducer(state, a) {
  switch (a.type) {
    case 'replace': return a.data;
    case 'upsert': {
      const list = state[a.coll], i = list.findIndex(d => d.id === a.doc.id);
      const next = i >= 0 ? list.map((d, j) => (j === i ? a.doc : d)) : [...list, a.doc];
      return { ...state, [a.coll]: next };
    }
    case 'remove': return { ...state, [a.coll]: state[a.coll].filter(d => d.id !== a.id) };
    case 'config': return { ...state, config: a.config };
    default: return state;
  }
}

export function StoreProvider({ children }) {
  const first = useRef(storage.load());
  const [state, dispatch] = useReducer(reducer, first.current.data);
  const [info, setInfo] = useState({ origen: first.current.origen, guardado: first.current.data.guardado, error: null });
  const stateRef = useRef(state); stateRef.current = state;
  const skipSave = useRef(first.current.origen === 'localStorage'); // la base inicial se guarda de inmediato

  // Guardar en localStorage (agrupando cambios seguidos)
  useEffect(() => {
    if (skipSave.current) { skipSave.current = false; return; }
    const t = setTimeout(() => {
      const ok = storage.save(state);
      setInfo(i => ({ ...i, guardado: ok ? new Date().toISOString() : i.guardado, error: ok ? null : 'No se pudo guardar en este navegador (almacenamiento lleno o bloqueado).' }));
    }, 250);
    return () => clearTimeout(t);
  }, [state]);
  // Cambios hechos en otra pestaña
  useEffect(() => storage.subscribe(data => { skipSave.current = true; dispatch({ type: 'replace', data }); setInfo(i => ({ ...i, origen: 'otra pestaña', guardado: data.guardado })); }), []);

  const get = (coll, id) => stateRef.current[coll].find(d => d.id === id);
  // Aplica el cambio también a la referencia, para que varias acciones seguidas sobre el mismo registro no se pisen
  const commit = a => { stateRef.current = reducer(stateRef.current, a); dispatch(a); };
  const touchContact = (kid, f) => {
    const k = get('contacts', kid);
    if (k && !(k.ultimaInteraccion && k.ultimaInteraccion >= f)) commit({ type: 'upsert', coll: 'contacts', doc: { ...k, ultimaInteraccion: f, actualizado: nowTs() } });
  };

  const actions = useMemo(() => ({
    /** Crea o reemplaza un registro completo. */
    upsert(coll, doc) {
      if (!COLLS.includes(coll)) throw new Error('Colección desconocida: ' + coll);
      if (!doc.id) throw new Error('El registro necesita un id.');
      const d = { ...doc, actualizado: nowTs() };
      commit({ type: 'upsert', coll, doc: d }); return d;
    },
    /** Modifica campos de un registro existente. */
    patch(coll, id, changes) {
      const cur = get(coll, id); if (!cur) throw new Error('No existe el registro ' + id);
      const d = { ...cur, ...changes, actualizado: nowTs() };
      commit({ type: 'upsert', coll, doc: d }); return d;
    },
    remove(coll, id) { commit({ type: 'remove', coll, id }); },
    /**
     * Actualiza una oportunidad y agrega entradas a su bitácora.
     * log: {t, tipo?, a?, contacto?, f?} o lista de ellos.
     */
    updateOpp(id, changes = {}, log) {
      const cur = get('opps', id); if (!cur) throw new Error('No existe la oportunidad ' + id);
      const bit = [...(cur.bitacora || [])];
      for (const l of [].concat(log || [])) {
        bit.push({ f: l.f || hoyISO(), t: l.t, a: l.a || changes.resp || cur.resp || '', tipo: l.tipo || 'Nota', contacto: l.contacto || '', origen: 'Sistema', ts: nowTs() });
        if (l.contacto) touchContact(l.contacto, l.f || hoyISO());
      }
      const d = { ...cur, ...changes, bitacora: bit, actualizado: nowTs() };
      commit({ type: 'upsert', coll: 'opps', doc: d }); return d;
    },
    /** Actualiza un caso técnico agregando una entrada a su historial. */
    updateCaso(id, changes = {}, logText) {
      const cur = get('solicitudes', id); if (!cur) throw new Error('No existe el caso ' + id);
      const log = [...(cur.log || [])]; if (logText) log.push({ f: hoyISO(), t: logText, ts: nowTs() });
      const d = { ...cur, ...changes, log, actualizado: nowTs() };
      commit({ type: 'upsert', coll: 'solicitudes', doc: d }); return d;
    },
    setConfig(config) { const c = { ...config, actualizado: nowTs() }; commit({ type: 'config', config: c }); return c; },
    /** Reemplaza todos los datos por un respaldo (valida antes). */
    importData(raw) { const data = storage.normalize(raw); commit({ type: 'replace', data }); return data; },
    exportData() { const s = stateRef.current; return { sistema: 'VOYANT Gestión Comercial', exportado: nowTs(), esquema: storage.SCHEMA, totales: Object.fromEntries(COLLS.map(c => [c, s[c].length])), config: s.config, clientes: s.clientes, contacts: s.contacts, opps: s.opps, solicitudes: s.solicitudes }; },
    resetToSeed() { commit({ type: 'replace', data: storage.seedData() }); },
  }), []);

  const value = useMemo(() => ({ state, actions, info }), [state, actions, info]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

/** { state, actions, info } */
export function useStore() { const v = useContext(StoreCtx); if (!v) throw new Error('useStore fuera de StoreProvider'); return v; }
/** Contexto de reglas de negocio (parámetros, catálogo, nombres, índice de clientes). */
export function useCtx() {
  const { state } = useStore();
  return useMemo(() => makeCtx(state), [state.config, state.clientes, state.solicitudes]);
}

/* ---------- Estado de interfaz por persona (filtros), también en localStorage ---------- */
const UiCtx = createContext(null);
export function UiProvider({ children }) {
  const [ui, setUi] = useState(() => ({ resp: '', pais: '', ...storage.uiGet() }));
  const set = useCallback((k, v) => setUi(u => { const n = { ...u, [k]: v }; storage.uiSet(n); return n; }), []);
  return <UiCtx.Provider value={{ ui, set }}>{children}</UiCtx.Provider>;
}
export const useUi = () => useContext(UiCtx);
/** Oportunidades filtradas por los filtros globales (responsable y país). */
export function useScopedOpps() {
  const { state } = useStore(); const { ui } = useUi();
  return useMemo(() => state.opps.filter(o => (!ui.resp || o.resp === ui.resp) && (!ui.pais || o.pais === ui.pais)), [state.opps, ui.resp, ui.pais]);
}
