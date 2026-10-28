import { useRef, useState } from 'react';

/**
 * Arrastrar y soltar con la API nativa de HTML5.
 * zone(key) devuelve los props de una zona de destino; onDrop(id, key) recibe la tarjeta soltada.
 */
export function useDnd(onDrop) {
  const drag = useRef(null);
  const [over, setOver] = useState(null);
  const start = id => { drag.current = id; };
  const end = () => { drag.current = null; setOver(null); };
  const zone = key => ({
    onDragOver: e => { if (!drag.current) return; e.preventDefault(); if (over !== key) setOver(key); },
    onDragLeave: e => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(o => (o === key ? null : o)); },
    onDrop: e => {
      e.preventDefault(); e.stopPropagation();
      let id = drag.current; try { id = id || e.dataTransfer.getData('text/plain'); } catch { /* sin datos */ }
      end(); if (id) onDrop(id, key);
    },
  });
  return { start, end, zone, over };
}
