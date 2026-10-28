export const SELLER_ID = 'V-1001';
export type Customer = { id: string; name: string; rfc: string; segment: string };
export type Address = { id: string; customerId: string; sellerId: string; label: string; street: string; shipping: string; qr: boolean };
export type Fleet = { id: string; addressId: string; type: string; brand: string; model: string; body: string; bodyModel: string; motor: string; from: string; to: string; units: string; createdAt: string; updatedAt: string };
export type FleetForm = Pick<Fleet, 'type' | 'brand' | 'model' | 'body' | 'bodyModel' | 'motor' | 'from' | 'to' | 'units'>;
export const CUSTOMERS: Customer[] = [
  { id: 'C-001', name: 'Transportes del Centro', rfc: 'TCE010101AB1', segment: 'Empresas' },
  { id: 'C-002', name: 'Autobuses Regionales', rfc: 'ARE010101AB2', segment: 'Empresas' },
  { id: 'C-003', name: 'Logística Nacional', rfc: 'LNA010101AB3', segment: 'Empresas' },
];
export const ADDRESSES: Address[] = [
  { id: 'D-001', customerId: 'C-001', sellerId: SELLER_ID, label: 'DIRECCIÓN FISCAL', street: 'AV. ARTESANOS 2715 Int. 0, Guadalajara Oriente, 44700 Guadalajara, Jalisco', shipping: 'Transporte Interno', qr: true },
  { id: 'D-002', customerId: 'C-001', sellerId: SELLER_ID, label: 'DIRECCIÓN 1', street: 'Av. Belisario Domínguez 2455 Int. 0, La Federacha, 44300 Guadalajara, Jalisco', shipping: 'Flecha Amarilla', qr: false },
  { id: 'D-003', customerId: 'C-001', sellerId: 'V-2002', label: 'BASE MONTERREY', street: 'Av. Industrial 120, Monterrey, Nuevo León', shipping: 'Transporte Interno', qr: true },
  { id: 'D-004', customerId: 'C-002', sellerId: SELLER_ID, label: 'BASE GUADALAJARA', street: 'Av. Aviación 450, Zapopan, Jalisco', shipping: 'Transporte Interno', qr: true },
  { id: 'D-005', customerId: 'C-003', sellerId: 'V-2002', label: 'BASE NORTE', street: 'Av. Norte 500, Monterrey, Nuevo León', shipping: 'Transporte Interno', qr: true },
];
// Muestra para revisar la interacción; no sustituye al catálogo de Empresas.
export const CATALOG: Record<string, Record<string, string[]>> = {
  'Servicio pesado': { FREIGHTLINER: ['COLUMBIA', 'CASCADIA'], KENWORTH: ['T680', 'T800'] },
  'Autobús – Transporte público o de personal': { VOLVO: ['9800'], MERCEDES: ['OF 1721'] },
  'Servicio ligero – Utilitario operativo': { NISSAN: ['NP300'], FORD: ['TRANSIT'] },
  'REMOLQUE - PLATAFORMA PLANA': { FRUEHAUF: ['Plataforma'] },
};
export const MOTORS = ['Detroit DD13', 'Cummins X15', 'D13', 'D11'];
export const EMPTY_FORM: FleetForm = { type: '', brand: '', model: '', body: '', bodyModel: '', motor: '', from: '', to: '', units: '' };
const stamp = '2026-10-20T12:00:00.000Z';
export const INITIAL_FLEETS: Fleet[] = [
  { ...EMPTY_FORM, id: 'PV-001', addressId: 'D-002', type: 'Servicio pesado', brand: 'FREIGHTLINER', model: 'COLUMBIA', motor: 'Detroit DD13', from: '2010', to: '2018', units: '25', createdAt: stamp, updatedAt: stamp },
  { ...EMPTY_FORM, id: 'PV-002', addressId: 'D-002', type: 'Servicio pesado', brand: 'KENWORTH', model: 'T680', from: '2019', to: '2022', units: '10', createdAt: stamp, updatedAt: stamp },
  { ...EMPTY_FORM, id: 'PV-003', addressId: 'D-004', type: 'Autobús – Transporte público o de personal', brand: 'VOLVO', model: '9800', body: 'VOLVO', bodyModel: '9800 DD', motor: 'D13', from: '2010', to: '2017', units: '20', createdAt: stamp, updatedAt: stamp },
];
export function assignedAddresses(customerId: string, sellerId = SELLER_ID) { return ADDRESSES.filter(a => a.customerId === customerId && a.sellerId === sellerId); }
export function canAccessAddress(addressId: string, sellerId = SELLER_ID) { return ADDRESSES.some(a => a.id === addressId && a.sellerId === sellerId); }
export function visibleCustomers(sellerId = SELLER_ID) { return CUSTOMERS.filter(c => assignedAddresses(c.id, sellerId).length > 0); }
export function hasBody(type: string) { return type.startsWith('Autobús'); }
export function validateFleet(form: FleetForm): Partial<Record<keyof FleetForm, string>> {
  const e: Partial<Record<keyof FleetForm, string>> = {};
  if (!CATALOG[form.type]) e.type = 'Selecciona un tipo de parque vehicular.';
  if (!CATALOG[form.type]?.[form.brand]) e.brand = 'Selecciona una marca compatible con el tipo.';
  if (!CATALOG[form.type]?.[form.brand]?.includes(form.model)) e.model = 'Selecciona un modelo compatible con la marca.';
  if (form.motor && !MOTORS.includes(form.motor)) e.motor = 'Selecciona un motor de la lista.';
  if (!/^\d+$/.test(form.units) || Number(form.units) <= 0 || !Number.isSafeInteger(Number(form.units))) e.units = 'Ingresa una cantidad entera mayor que cero.';
  if (form.from && !/^[1-9]\d{3}$/.test(form.from)) e.from = 'Ingresa un año de cuatro dígitos.';
  if (form.to && !/^[1-9]\d{3}$/.test(form.to)) e.to = 'Ingresa un año de cuatro dígitos.';
  if (form.from && form.to && Number(form.from) > Number(form.to)) { e.from = 'El año inicial no puede ser mayor que el final.'; e.to = 'Revisa el rango de años.'; }
  return e;
}
export function sameConfiguration(a: FleetForm, b: FleetForm) { return (['type', 'brand', 'model', 'body', 'bodyModel', 'motor', 'from', 'to'] as const).every(k => a[k] === b[k]); }
export function validStoredFleets(value: unknown): value is Fleet[] {
  return Array.isArray(value) && value.every(row => row && typeof row === 'object' && ['id', 'addressId', 'createdAt', 'updatedAt', ...Object.keys(EMPTY_FORM)].every(key => typeof row[key] === 'string') && canAccessAddress(row.addressId) && Object.keys(validateFleet(row)).length === 0);
}
