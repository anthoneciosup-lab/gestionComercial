/** Importar un respaldo JSON (reemplaza todos los datos) y restablecer la base inicial, ambos con confirmación. */
import { useRef, useState } from 'react';
import { useStore } from '../../store/StoreProvider.jsx';
import { normalize } from '../../store/storage.js';
import { Modal, useToast } from '../../components/ui/index.js';

export function ImportarRespaldo() {
  const { actions } = useStore(); const toast = useToast();
  const ref = useRef(); const [pend, setPend] = useState(null); const [err, setErr] = useState('');
  const elegir = e => {
    const file = e.target.files?.[0]; e.target.value = ''; setErr(''); if (!file) return;
    const fr = new FileReader();
    fr.onerror = () => setErr('No se pudo leer el archivo.');
    fr.onload = () => {
      try {
        const json = JSON.parse(String(fr.result));
        const n = normalize(json); // validación previa para mostrar el resumen
        setPend({ json, nombre: file.name, tot: { opps: n.opps.length, clientes: n.clientes.length, contacts: n.contacts.length, solicitudes: n.solicitudes.length }, exportado: json.exportado });
      } catch (x) { setErr(x instanceof SyntaxError ? 'El archivo no es un JSON válido.' : x.message); }
    };
    fr.readAsText(file);
  };
  const confirmar = () => {
    try { actions.importData(pend.json); } catch (x) { throw new Error('No se pudo importar: ' + x.message); }
    toast('Respaldo importado');
  };
  return <>
    <input ref={ref} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={elegir} />
    <button className="btn" type="button" onClick={() => ref.current.click()}>Importar respaldo…</button>
    {err && <span className="err">{err}</span>}
    {pend && <Modal title="Importar respaldo" subtitle={pend.nombre} onClose={() => setPend(null)} onOk={confirmar} okLabel="Reemplazar datos">
      <div className="banner warn"><span><b>Se reemplazarán todos los datos guardados en este navegador</b> (oportunidades, clientes, contactos, casos técnicos y configuración) por los del archivo. Si no tienes copia de los datos actuales, cancela y descarga antes un respaldo.</span></div>
      <dl className="kv">
        {pend.exportado && <><dt>Exportado</dt><dd>{String(pend.exportado).replace('T', ' ').slice(0, 16)}</dd></>}
        <dt>Oportunidades</dt><dd>{pend.tot.opps}</dd><dt>Clientes</dt><dd>{pend.tot.clientes}</dd><dt>Contactos</dt><dd>{pend.tot.contacts}</dd><dt>Casos técnicos</dt><dd>{pend.tot.solicitudes}</dd>
      </dl>
    </Modal>}
  </>;
}

export function RestablecerBase() {
  const { actions } = useStore(); const toast = useToast(); const [open, setOpen] = useState(false);
  return <>
    <button className="btn danger" type="button" onClick={() => setOpen(true)}>Restablecer base inicial</button>
    {open && <Modal title="Restablecer base inicial" subtitle="Vuelven los datos migrados del Excel (versión 2.3)." onClose={() => setOpen(false)}
      onOk={() => { actions.resetToSeed(); toast('Base inicial restablecida'); }} okLabel="Restablecer">
      <div className="banner warn"><span>Se perderán <b>todos los cambios hechos en este navegador</b> (oportunidades nuevas, bitácoras, clientes, contactos, casos técnicos y configuración). Descarga antes un respaldo si quieres conservarlos.</span></div>
    </Modal>}
  </>;
}
