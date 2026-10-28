import { useStore } from '../../store/StoreProvider.jsx';

/** Contactos del cliente comprador y del cliente final de la oportunidad. */
export default function ContactPicker({ o, value, onChange }) {
  const { state } = useStore();
  const ids = [o.clienteId, o.clienteFinalId].filter(Boolean);
  const ks = state.contacts.filter(k => ids.includes(k.empresaId));
  return <select value={value} onChange={e => onChange(e.target.value)}>
    <option value="">— Ninguno / no registrado —</option>
    {ks.map(k => <option key={k.id} value={k.id}>{k.nombre}{k.cargo ? ' · ' + k.cargo : ''}</option>)}
  </select>;
}
