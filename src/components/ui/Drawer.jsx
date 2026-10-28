import { useEffect } from 'react';
import { createPortal } from 'react-dom';
/** Ficha lateral (oportunidad, caso técnico, cliente). header: contenido de la cabecera; footer opcional. */
export default function Drawer({ label, header, actions, children, footer, onClose }) {
  useEffect(() => { const h = e => { if (e.key === 'Escape' && !document.querySelector('.modal')) onClose(); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
  return createPortal(<>
    <div className="scrim" onClick={onClose} />
    <aside className="drawer" role="dialog" aria-label={label}>
      <div className="dh"><div className="row"><div style={{ minWidth: 0 }}>{header}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>{actions}<button className="btn" type="button" onClick={onClose}>Cerrar</button></div></div></div>
      <div className="db">{children}</div>
      {footer && <div className="df">{footer}</div>}
    </aside></>, document.body);
}
