/** Registrar o editar una empresa de la lista de clientes. */
import { Modal, Field, Options, useForm, useToast } from '../../components/ui/index.js';
import { useStore } from '../../store/StoreProvider.jsx';
import { PAISES, TIPOS_EMPRESA, VERTICALES } from '../../domain/constants.js';
import { slugCliente, webNorm } from '../../domain/validators.js';
import { hoyISO } from '../../domain/format.js';
import { validarCliente } from './clientesData.js';

const leer = f => ({
  nombre: f.nombre.trim().toUpperCase(), nombreComercial: f.nombreComercial.trim(), ruc: f.ruc.trim().toUpperCase(), pais: f.pais, tipo: f.tipo,
  direccion: f.direccion.trim(), web: webNorm(f.web), vertical: f.vertical, notas: f.notas.trim(),
});

export default function ClienteFormModal({ cliente, onClose, onSaved }) {
  const { state, actions } = useStore(); const toast = useToast();
  const c = cliente || {};
  const [f, set] = useForm({
    nombre: c.nombre || '', nombreComercial: c.nombreComercial || '', ruc: c.ruc || '', pais: c.pais || 'PERÚ', tipo: c.tipo || 'Cliente',
    direccion: c.direccion || '', web: c.web || '', vertical: c.vertical || '', notas: c.notas || '',
  });
  const save = () => {
    const d = leer(f);
    const err = validarCliente(d, c.id, state.clientes); if (err) throw new Error(err);
    let id = c.id;
    if (cliente) actions.upsert('clientes', { ...cliente, ...d });
    else {
      id = slugCliente(d.nombre).slice(0, 63);
      if (state.clientes.some(x => x.id === id)) id += '-' + Date.now().toString(36);
      actions.upsert('clientes', { ...d, id, alias: [], estado: 'Activo', creado: hoyISO(), origen: 'Registrado en el sistema' });
    }
    toast(cliente ? 'Guardado' : `Empresa ${d.nombre} registrada`);
    onSaved?.(id);
  };
  const inp = (k, props = {}) => <input type="text" value={f[k]} onChange={e => set(k, e.target.value)} {...props} />;
  return <Modal title={cliente ? 'Editar cliente' : 'Registrar cliente'} subtitle={cliente ? c.nombre : 'Antes de registrar, búscalo en la lista: el sistema avisa si el nombre o el RUC ya existen.'}
    onClose={onClose} onOk={save} okLabel={cliente ? 'Guardar' : 'Registrar cliente'}>
    <div className="grid g2">
      <Field label="Razón social" full>{inp('nombre', { placeholder: 'Ej.: SOCIEDAD MINERA CERRO VERDE S.A.A.', autoFocus: true })}</Field>
      <Field label="Nombre comercial">{inp('nombreComercial', { placeholder: 'Ej.: Cerro Verde' })}</Field>
      <Field label="RUC / RUT" hint="Perú: 11 dígitos · Chile: 12345678-9">{inp('ruc', { inputMode: 'numeric', className: 'mono' })}</Field>
      <Field label="País"><select value={f.pais} onChange={e => set('pais', e.target.value)}><Options list={Object.values(PAISES)} /></select></Field>
      <Field label="Tipo"><select value={f.tipo} onChange={e => set('tipo', e.target.value)}><Options list={TIPOS_EMPRESA} /></select></Field>
      <Field label="Dirección" full>{inp('direccion')}</Field>
      <Field label="Página web">{inp('web', { placeholder: 'www.empresa.com' })}</Field>
      <Field label="Vertical"><select value={f.vertical} onChange={e => set('vertical', e.target.value)}><Options list={VERTICALES} blank="—" /></select></Field>
      <Field label="Notas" full><textarea value={f.notas} onChange={e => set('notas', e.target.value)} placeholder="Contexto útil: unidades, sedes, condiciones de homologación, etc." /></Field>
    </div>
  </Modal>;
}
