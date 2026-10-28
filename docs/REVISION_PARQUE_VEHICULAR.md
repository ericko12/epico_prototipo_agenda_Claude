# Parque vehicular — revisión funcional con Luis Galván

Propuesta del 28 de octubre de 2026 basada en el wireflow revisado y SPEC-F2-005 v0.4. No sustituye una aprobación de negocio.

## Acceso

Menú **Clientes → Listado de clientes** o **Clientes → Parque vehicular**. Ambos llevan a la cartera de clientes de ejemplo. Elegir **Transportes del Centro → Ver detalle → DIRECCIÓN 1 → Parque vehicular**.

Rutas publicadas: `/Modulo/clientes/` y `/Modulo/parque-vehicular/`. Se reutilizan menú, Drawer, AppBar, breadcrumbs, tema Quicksand, iconos y controles MUI existentes. La nueva composición Dirección/listado/alta se basa en la captura compartida de Épico; no se introduce otra biblioteca visual.

## Recorrido a revisar

1. Transportes del Centro / Dirección fiscal comienza sin grupos: permite primera alta.
2. Transportes del Centro / Dirección 1 tiene dos grupos: 35 unidades en total. Los grupos y las unidades se muestran por separado.
3. Autobuses Regionales / Base Guadalajara contiene un autobús con carrocería.
4. Registrar un grupo, Guardar, abrir detalle y Modificar.
5. Guardar y agregar otro conserva Dirección, reinicia formulario y conserva grupos ya guardados.
6. Cambiar Tipo/Marca con captura dependiente solicita confirmación. Motor, años y unidades permanecen.
7. Cancelar una captura modificada solicita descarte. No elimina grupos guardados previamente.
8. Año invertido o unidades inválidas conserva captura y señala campos.
9. Una configuración exacta ya existente permite consultar su grupo. Esta resolución es provisional; no se implementan solapamientos.
10. Refrescar conserva los grupos en el mismo navegador. Si el almacenamiento falla, la pantalla avisa que la persistencia es sólo de la sesión abierta. No hay backend ni almacenamiento compartido entre revisores.

## Cartera

Identidad de demostración: vendedorID V-1001. Un cliente con una tercera dirección asignada a V-2002 permite comprobar que sólo aparecen las dos asignadas a V-1001. Un cliente asignado completamente a otro vendedor no aparece. La selección y el guardado verifican contexto Cliente/Dirección/cartera. Son comprobaciones de interfaz y datos ficticios; producción requiere autorización en servidor.

## Supuestos para comentar

- Los catálogos son una muestra, no la relación canónica de Empresas.
- Carrocería y Modelo de carrocería aparecen sólo para autobús en este demo. Confirmar aplicabilidad, dependencia y obligatoriedad.
- Motor y años opcionales en el demo; Tipo, Marca, Modelo y Unidades obligatorios. Confirmar regla definitiva.
- Guardar y agregar otro persiste individualmente en el navegador. No representa una decisión de atomicidad del servicio productivo.
- Duplicado exacto muestra el existente. Falta acordar bloqueo/fusión/justificación y solapamientos.
- Modificación permitida sobre los ejemplos de la cartera; falta matriz completa de permisos.
- Baja y «Otro» no habilitados hasta resolver política.
- No se equipara tener grupo con levantamiento completo; no hay caducidad, reportería, migración ni integración con recomendador.

El botón **Notas para revisión** presenta estas decisiones fuera del formulario operativo. Los comentarios se recopilan por el canal de revisión habitual; el prototipo no envía datos ni comentarios a Luis.

## Validación

- `npm run build`: compilación, TypeScript y exportación estática.
- `node scripts/test-fleet.cjs`: reglas de cartera, registros persistidos, catálogos, cantidades, años y coincidencia exacta.
- `node scripts/test-catalogs.cjs`: regresión existente de Agenda.

La vista previa administrada local no inicia por incompatibilidad de los argumentos del entorno (`--host` / `--strictPort`) con Next.js. La revisión visual debe realizarse sobre la publicación de GitHub Pages; esa limitación no requiere cambiar el comando de desarrollo del repositorio.
