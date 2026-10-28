import { createContext, useCallback, useContext, useRef, useState } from 'react';
const Ctx = createContext(() => {});
/** Mensajes breves de confirmación (“Guardado”). Uso: const toast = useToast(); toast('Guardado'); */
export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null); const t = useRef();
  const show = useCallback(m => { setMsg(m); clearTimeout(t.current); t.current = setTimeout(() => setMsg(null), 2800); }, []);
  return <Ctx.Provider value={show}>{children}{msg && <div className="toast" role="status">{msg}</div>}</Ctx.Provider>;
}
export const useToast = () => useContext(Ctx);
