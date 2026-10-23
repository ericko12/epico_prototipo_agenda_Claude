const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync('src/lib/catalogosAgendaVisitas.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const scope = {exports:{}}; vm.runInNewContext(code,scope); const c=scope.exports;
let checks=0;
const check=(f)=>{f();checks++;};
check(()=>assert.equal(c.OBJETIVOS_VISITA.length,4));
check(()=>assert.equal(c.TIPOS_EVENTO.length,13));
check(()=>assert.equal(new Set(c.TIPOS_EVENTO.map(t=>t.codigo)).size,13));
check(()=>assert.equal(c.TIPOS_SELECCIONABLES.length,9));
check(()=>assert.ok(c.TIPOS_SELECCIONABLES.every(t=>t.origen==='MANUAL' && t.relacion!=='LEAD')));
check(()=>assert.ok(c.TIPOS_SELECCIONABLES.filter(t=>t.codigo!=='AGENDA').every(t=>!t.esVisita && !t.habilitaCheckinCheckout)));
check(()=>assert.deepEqual(Array.from(c.TIPOS_SELECCIONABLES.filter(t=>t.codigo!=='AGENDA').map(t=>t.nombre)),['Actividad phone day','Frente APYMSA','Inventario de consigna','Levantamiento parque vehicular','Otras actividades/Administrativas','Planeación comercial','Reunión Remota/Presencial','Traslado']));
check(()=>assert.ok(!c.TIPOS_SELECCIONABLES.some(t=>['VACACIONES','VISITA_INICIADA','VISITA_REALIZADA','VISITA_A_PROSPECTO'].includes(t.codigo))));
for(const objective of ['PRESENTACION_PROPUESTA_COMERCIAL','VISITA_SERVICIO_SEGUIMIENTO']) {
 for(const result of ['CON_VENTA','SIN_VENTA','CLIENTE_NO_ATENDIO']) check(()=>assert.equal(c.validarCierreManual(objective,{resultado:result}),null));
 check(()=>assert.ok(c.validarCierreManual(objective,{})));
 check(()=>assert.ok(c.validarCierreManual(objective,{resultado:'CLIENTE_ATENDIO'})));
}
for(const [objective,field] of [['COBRANZA','numeroFactura'],['GARANTIA_Y_DEVOLUCIONES','folioPapeleta']]) {
 check(()=>assert.equal(c.resultadoDerivado(objective,{[field]:'QA-001'}),'CLIENTE_ATENDIO'));
 check(()=>assert.equal(c.validarCierreManual(objective,{[field]:'QA-001'}),null));
 check(()=>assert.ok(c.validarCierreManual(objective,{[field]:'  '})));
 check(()=>assert.equal(c.validarCierreManual(objective,{clienteNoAtendio:true}),null));
 check(()=>assert.ok(c.validarCierreManual(objective,{clienteNoAtendio:true,[field]:'QA-001'})));
 check(()=>assert.ok(!c.resultadosSeleccionables(objective).some(r=>r.codigo==='CLIENTE_ATENDIO')));
}
console.log(`${checks} comprobaciones de catálogos y cierres aprobadas.`);
