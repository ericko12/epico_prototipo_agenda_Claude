/**
 * Catálogos propuestos para Épico — Agenda / Check-in / Check-out
 * Fuente funcional: SPEC-F2-001 y SPEC-F2-002, acuerdos 2026-10-22.
 * Códigos propios propuestos (NO son IDs de Salesforce).
 * Los tipos con habilitadoMvp=false se conservan solo como referencia.
 */
export type Relacion = 'CLIENTE' | 'LEAD' | 'CLIENTE_O_LEAD' | 'SUCURSAL' | 'NINGUNA';
export type TipoEvento = {
  codigo: string;
  nombre: string;
  relacion: Relacion;
  esVisita: boolean;
  requiereCliente: boolean;
  requiereDireccion: boolean;
  habilitaCheckinCheckout: boolean;
  origen: 'MANUAL' | 'SISTEMA';
  habilitadoMvp: boolean;
  listaObjetivoId: string | null;
  listaResultadoId: string | null;
  requiereObjetivo: boolean;
  requiereResultado: boolean;
  requiereHallazgos: boolean;
  permiteProductosNegados: boolean;
};
const noVisita = (codigo: string, nombre: string, relacion: Relacion, requiereDireccion=false): TipoEvento => ({
  codigo,nombre,relacion,esVisita:false,requiereCliente:relacion==='CLIENTE'||relacion==='CLIENTE_O_LEAD',
  requiereDireccion,habilitaCheckinCheckout:false,origen:'MANUAL',habilitadoMvp:true,
  listaObjetivoId:null,listaResultadoId:null,requiereObjetivo:false,requiereResultado:false,
  requiereHallazgos:false,permiteProductosNegados:false
});
const visita = (codigo: string,nombre: string,relacion: Relacion,origen:'MANUAL'|'SISTEMA',habilitadoMvp:boolean): TipoEvento=>({
  codigo,nombre,relacion,esVisita:true,requiereCliente:relacion==='CLIENTE'||relacion==='CLIENTE_O_LEAD',
  requiereDireccion:true,habilitaCheckinCheckout:true,origen,habilitadoMvp,
  listaObjetivoId:'OBJETIVOS_VISITA',listaResultadoId:'RESULTADOS_VISITA',
  requiereObjetivo:true,requiereResultado:true,requiereHallazgos:false,permiteProductosNegados:true
});
export const TIPOS_EVENTO: readonly TipoEvento[] = [
  noVisita('ACTIVIDAD_PHONE_DAY','Actividad phone day','SUCURSAL'),
  noVisita('FRENTE_APYMSA','Frente APYMSA','SUCURSAL'),
  noVisita('INVENTARIO_DE_CONSIGNA','Inventario de consigna','CLIENTE',true),
  noVisita('LEVANTAMIENTO_PARQUE_VEHICULAR','Levantamiento parque vehicular','CLIENTE_O_LEAD',true),
  noVisita('OTRAS_ACTIVIDADES_ADMINISTRATIVAS','Otras actividades/Administrativas','SUCURSAL'),
  noVisita('PLANEACION_COMERCIAL','Planeación comercial','SUCURSAL'),
  noVisita('REUNION_REMOTA_PRESENCIAL','Reunión Remota/Presencial','SUCURSAL'),
  noVisita('TRASLADO','Traslado','NINGUNA'),
  {...noVisita('VACACIONES','Vacaciones','NINGUNA'),habilitadoMvp:false},
  visita('AGENDA','Agenda','CLIENTE','MANUAL',true),
  visita('VISITA_A_PROSPECTO','Visita a prospecto','LEAD','MANUAL',false),
  visita('VISITA_INICIADA','Visita iniciada','CLIENTE_O_LEAD','SISTEMA',true),
  visita('VISITA_REALIZADA','Visita realizada','CLIENTE_O_LEAD','SISTEMA',true)
];
export const TIPOS_SELECCIONABLES = TIPOS_EVENTO.filter(t=>t.origen==='MANUAL'&&t.habilitadoMvp);

export const OBJETIVOS_VISITA = [
  {codigo:'PRESENTACION_PROPUESTA_COMERCIAL',nombre:'Presentación propuesta comercial'},
  {codigo:'COBRANZA',nombre:'Cobranza'},
  {codigo:'GARANTIA_Y_DEVOLUCIONES',nombre:'Garantía y Devoluciones'},
  {codigo:'VISITA_SERVICIO_SEGUIMIENTO',nombre:'Visita de servicio/seguimiento'}
] as const;
export const RESULTADOS_VISITA = [
  {codigo:'CON_VENTA',nombre:'Con venta'},
  {codigo:'SIN_VENTA',nombre:'Sin venta'},
  {codigo:'CLIENTE_ATENDIO',nombre:'Cliente atendió',automatico:true},
  {codigo:'CLIENTE_NO_ATENDIO',nombre:'Cliente no atendió'}
] as const;
export const RESULTADOS_POR_OBJETIVO: Record<string, readonly string[]> = {
  PRESENTACION_PROPUESTA_COMERCIAL:['CON_VENTA','SIN_VENTA','CLIENTE_NO_ATENDIO'],
  COBRANZA:['CLIENTE_ATENDIO','CLIENTE_NO_ATENDIO'],
  GARANTIA_Y_DEVOLUCIONES:['CLIENTE_ATENDIO','CLIENTE_NO_ATENDIO'],
  VISITA_SERVICIO_SEGUIMIENTO:['CON_VENTA','SIN_VENTA','CLIENTE_NO_ATENDIO']
};
export function resultadosSeleccionables(objetivo:string) {
  return RESULTADOS_VISITA.filter(r=>RESULTADOS_POR_OBJETIVO[objetivo]?.includes(r.codigo)&&!('automatico' in r&&r.automatico));
}
export function resultadoDerivado(objetivo:string, datos:{numeroFactura?:string;folioPapeleta?:string;clienteNoAtendio?:boolean}):string|null {
  if(datos.clienteNoAtendio)return 'CLIENTE_NO_ATENDIO';
  if(objetivo==='COBRANZA'&&datos.numeroFactura?.trim())return 'CLIENTE_ATENDIO';
  if(objetivo==='GARANTIA_Y_DEVOLUCIONES'&&datos.folioPapeleta?.trim())return 'CLIENTE_ATENDIO';
  return null;
}
export function validarCierreManual(objetivo:string,datos:{resultado?:string;numeroFactura?:string;folioPapeleta?:string;clienteNoAtendio?:boolean}) {
  if(!OBJETIVOS_VISITA.some(x=>x.codigo===objetivo))return 'Selecciona un objetivo válido.';
  if(datos.clienteNoAtendio&&(datos.numeroFactura?.trim()||datos.folioPapeleta?.trim()))return 'No puedes indicar cliente no atendido y registrar una gestión.';
  const derivado=resultadoDerivado(objetivo,datos);
  if(objetivo==='COBRANZA'||objetivo==='GARANTIA_Y_DEVOLUCIONES')
    return derivado?null:'Registra el comprobante de la gestión o indica que el cliente no atendió.';
  return datos.resultado&&RESULTADOS_POR_OBJETIVO[objetivo]?.includes(datos.resultado)?null:'Selecciona un resultado válido.';
}
// Cierre automático: no ejecutar validarCierreManual ni inventar objetivo/resultado.
