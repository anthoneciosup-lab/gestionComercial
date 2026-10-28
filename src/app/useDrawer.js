import { useSearchParams } from 'react-router-dom';
/**
 * Fichas laterales abiertas desde cualquier módulo mediante la URL (?opp=ID, ?caso=ID, ?cliente=ID).
 * Así una ficha se puede enlazar, y el botón Atrás del navegador la cierra.
 */
export function useDrawer() {
  const [sp, setSp] = useSearchParams();
  const open = (type, id, tab) => { const n = new URLSearchParams(); n.set(type, id); if (tab) n.set('tab', tab); setSp(n); };
  const close = () => setSp(new URLSearchParams(), { replace: false });
  const setTab = tab => { const n = new URLSearchParams(sp); n.set('tab', tab); setSp(n, { replace: true }); };
  return { open, close, setTab, opp: sp.get('opp'), caso: sp.get('caso'), cliente: sp.get('cliente'), tab: sp.get('tab') };
}
