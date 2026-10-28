import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
/**
 * Ventana modal.
 * onOk: función (puede ser async). Si lanza Error, se muestra su mensaje y la ventana queda abierta;
 * si devuelve false, queda abierta sin mensaje. Cualquier otro resultado cierra la ventana.
 */
export default function Modal({ title, subtitle, children, onClose, onOk, okLabel = 'Aceptar', cancelLabel, wide = false, okDisabled = false }) {
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const ref = useRef(null);
  // Escape cierra solo la ventana que está encima
  useEffect(() => { const h = e => { if (e.key !== 'Escape') return; const all = document.querySelectorAll('.modal'); if (all[all.length - 1] !== ref.current) return; e.stopPropagation(); onClose?.(); }; window.addEventListener('keydown', h, true); return () => window.removeEventListener('keydown', h, true); }, [onClose]);
  const ok = async () => {
    setErr(''); setBusy(true);
    try { const r = await onOk(); if (r !== false) onClose?.(); }
    catch (e) { setErr(e.message || String(e)); }
    finally { setBusy(false); }
  };
  return createPortal(
    <div className="modal" ref={ref} onMouseDown={e => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="box" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} style={wide ? { width: 'min(980px,96vw)', maxWidth: 980 } : undefined}>
        <header><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</header>
        <div className="body">{children}{err && <div className="err" role="alert">{err}</div>}</div>
        <footer>
          <button className="btn" type="button" onClick={onClose}>{cancelLabel || (onOk ? 'Cancelar' : 'Cerrar')}</button>
          {onOk && <button className="btn pri" type="button" onClick={ok} disabled={busy || okDisabled}>{okLabel}</button>}
        </footer>
      </div>
    </div>, document.body);
}
