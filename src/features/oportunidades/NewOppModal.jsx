/** Alta de oportunidad: numeración automática AA-P + correlativo, cliente de la lista y primera próxima acción. */
import { useState } from 'react';
import { useCtx, useStore, useUi } from '../../store/StoreProvider.jsx';
import { ETAPAS_ABIERTAS, PAISES, VERTICALES } from '../../domain/constants.js';
import { addDays, etLabel, fd, hoyISO, nowTs } from '../../domain/format.js';
import { nextNumero } from '../../domain/rules.js';
import { ClienteSelect, Field, Modal, Options, RespSelect, useForm, useToast } from '../../components/ui/index.js';
import ClienteFormModal from '../clientes/ClienteFormModal.jsx';
import { AccionInput, isUrlOk, numOrNull } from './shared.jsx';

export default function NewOppModal({ onClose, onCreated }) {
  const { state, actions } = useStore(); const ctx = useCtx(); const { ui } = useUi(); const toast = useToast();
  const [f, set] = useForm({
    pais: '1', resp: ctx.respActivo(ui?.resp) ? ui.resp : (ctx.equipoActivo[0]?.ini || ''), etapa: ETAPAS_ABIERTAS[0], ref: '',
    cid: '', fid: '', vertical: '', monto: '', fOferta: '', fCierre: '', sp: '',
    accion: 'Enviar propuesta', fAccion: addDays(hoyISO(), ctx.params.diasPrimeraAccion),
  });
  const [nuevoCli, setNuevoCli] = useState(null); // 'cid' | 'fid'
  const nn = nextNumero(state.opps, +f.pais);

  const setComprador = id => {
    set('cid', id);
    const c = ctx.cliById(id); if (c?.vertical && !f.vertical) set('vertical', c.vertical);
  };

  const crear = () => {
    const ref = f.ref.trim(), cid = f.cid, fid = f.fid || cid, a = f.accion.trim(), af = f.fAccion, sp = f.sp.trim();
    if (!ref || !cid || !a || !af) throw new Error('Referencia, cliente (de la lista), próxima acción y fecha son obligatorios.');
    if (!f.resp) throw new Error('Elige el responsable.');
    if (!isUrlOk(sp)) throw new Error('El enlace debe empezar con https://');
    if (state.opps.some(o => o.id === nn.numero)) throw new Error('Ese número ya existe; vuelve a intentarlo.');
    const pc = +f.pais, h = hoyISO(), c = ctx.cliById(cid);
    const o = {
      id: nn.numero, numero: nn.numero, anio: nn.anio, pais: PAISES[pc], paisCod: pc, correlativo: nn.correlativo, version: 0, fCreacion: h, resp: f.resp, ref,
      clienteId: cid, clienteFinalId: fid, cliente: c?.nombre || '', clienteOriginal: '', clienteFinal: ctx.cliById(fid)?.nombre || '', clienteFinalOriginal: '',
      fConsulta: null, lineas: { energia: false, clima: false, security: false }, ingenieria: 'Falta', fOfertaRequerida: f.fOferta || null, fUltimaOferta: null,
      monto: numOrNull(f.monto), montoLocal: null, etapa: f.etapa, fCierre: f.fCierre || null, prob: ctx.params.probEtapa[f.etapa] ?? null,
      decisorTecnico: '', decisorFinal: '', vertical: f.vertical || c?.vertical || '', solucion: '', sharepoint: sp, standby: null,
      bitacora: [{ f: h, t: `Oportunidad registrada. Próxima acción: ${a} (${fd(af)})`, a: f.resp, tipo: 'Nota', origen: 'Sistema', ts: nowTs() }],
      proxAccion: a, fProxAccion: af, lecciones: '', causaPerdida: '', causaOtra: '', forecast: '', revision: null, versiones: [], origen: 'Registrada en el sistema', obs: [],
    };
    actions.upsert('opps', o);
    toast(`Oportunidad ${o.numero} creada`);
    onCreated?.(o.id);
  };

  return <>
    <Modal title="Nueva oportunidad" subtitle="La numeración se asigna sola (AA-P + correlativo). El cliente se elige de la lista; si no existe, regístralo desde el mismo menú."
      onClose={onClose} onOk={crear} okLabel="Crear oportunidad">
      <div className="grid g2">
        <Field label="País"><select value={f.pais} onChange={e => set('pais', e.target.value)} autoFocus>
          {Object.entries(PAISES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field label="Número asignado"><input type="text" value={nn.numero} readOnly /></Field>
        <Field label="Responsable"><RespSelect value={f.resp} onChange={v => set('resp', v)} blank={f.resp ? undefined : 'Elegir…'} /></Field>
        <Field label="Etapa"><select value={f.etapa} onChange={e => set('etapa', e.target.value)}>
          {ETAPAS_ABIERTAS.map(e => <option key={e} value={e}>{etLabel(e)}</option>)}</select></Field>
      </div>
      <Field label="Referencia"><input type="text" value={f.ref} onChange={e => set('ref', e.target.value)} placeholder="Ej.: SUMINISTRO DE UPS + BANCO DE BATERÍAS" /></Field>
      <div className="grid g2">
        <Field label="Cliente comprador"><ClienteSelect value={f.cid} onChange={setComprador} onNew={() => setNuevoCli('cid')} /></Field>
        <Field label="Cliente final"><ClienteSelect value={f.fid} onChange={v => set('fid', v)} onNew={() => setNuevoCli('fid')} blank="Igual al comprador" /></Field>
        <Field label="Vertical"><select value={f.vertical} onChange={e => set('vertical', e.target.value)}><Options list={VERTICALES} blank="—" /></select></Field>
        <Field label="Monto estimado USD"><input type="number" value={f.monto} onChange={e => set('monto', e.target.value)} /></Field>
        <Field label="Fecha requerida de oferta"><input type="date" value={f.fOferta} onChange={e => set('fOferta', e.target.value)} /></Field>
        <Field label="Cierre previsto"><input type="date" value={f.fCierre} onChange={e => set('fCierre', e.target.value)} /></Field>
      </div>
      <Field label="Carpeta de documentos en SharePoint (opcional)"><input type="url" value={f.sp} onChange={e => set('sp', e.target.value)} placeholder="https://…" /></Field>
      <fieldset className="nextbox"><legend>Próxima acción</legend>
        <Field label="Acción" full><AccionInput value={f.accion} onChange={v => set('accion', v)} /></Field>
        <Field label="Fecha"><input type="date" value={f.fAccion} onChange={e => set('fAccion', e.target.value)} /></Field>
      </fieldset>
    </Modal>
    {nuevoCli && <ClienteFormModal onClose={() => setNuevoCli(null)}
      onSaved={id => { if (nuevoCli === 'cid') setComprador(id); else set('fid', id); setNuevoCli(null); }} />}
  </>;
}
