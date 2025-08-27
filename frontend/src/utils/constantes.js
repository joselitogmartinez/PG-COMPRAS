export const MODALIDADES = [
  { key: 'directa', label: 'COMPRA DIRECTA' },
  { key: 'abierto', label: 'CONTRATO ABIERTO' },
  { key: 'baja', label: 'BAJA CUANTÍA' }
];

export const CAMPOS_MODALIDAD = {
  directa: [
    { name: 'no_identificacion', label: 'No', type: 'text' },
    { name: 'modalidad', label: 'Modalidad', type: 'text', disabled: true },
    { name: 'no_nog', label: 'NOG', type: 'text' },
    { name: 'fecha_publicacion', label: 'Fecha Publicación', type: 'date' },
    { name: 'estatus_evento', label: 'Estatus Evento', type: 'text' },
    { name: 'fecha_adjudicacion', label: 'Fecha Adjudicación', type: 'date' },    
    { name: 'descripcion_evento', label: 'Descripción Evento', type: 'text' },
    { name: 'solicitud', label: 'No. Solicitud', type: 'text' },
    { name: 'no_oc', label: 'No. O.C', type: 'text' },
    { name: 'fecha_oc', label: 'Fecha O.C', type: 'date' },
    { name: 'nit_adjudicado', label: 'NIT Proveedor', type: 'text' },
    { name: 'proveedor', label: 'Nombre Proveedor', type: 'text' },
    { name: 'producto', label: 'Descripcion del Producto', type: 'text' },    
    { name: 'renglon', label: 'Renglón', type: 'text' },
    { name: 'codigo_insumo', label: 'Código Insumo', type: 'text' },
    { name: 'presentacion_unidad', label: 'Presentación/Unidad', type: 'text' },
    { name: 'precio', label: 'Precio Unitario', type: 'number' },
    { name: 'cantidad_adjudicada', label: 'Cantidad Adjudicada', type: 'number' },
    { name: 'monto_total', label: 'Monto Total', type: 'number' },
    { name: 'factura_numero', label: 'No. Factura', type: 'text' },
    { name: 'factura_fecha', label: 'Fecha Factura', type: 'date' },
    { name: 'almacen_no_ingreso', label: 'No. Ingreso Almacén', type: 'text' },
    { name: 'almacen_fecha_ingreso', label: 'F/I Almacén', type: 'date' },
    { name: 'cur_numero', label: 'No. CUR', type: 'text' },
    { name: 'cur_fecha', label: 'Fecha CUR', type: 'date' },
    { name: 'registro_sanitario', label: 'Registro Sanitario', type: 'text' },
    { name: 'distrito', label: 'Distrito', type: 'text' },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea' },
    { name: 'finalizado', label: 'Finalizado', type: 'checkbox' }
  ],
  abierto: [
    { name: 'no', label: 'No', type: 'text' },
    { name: 'modalidad', label: 'Modalidad', type: 'text', disabled: true },
    { name: 'rubro', label: 'Rubro', type: 'text' },
    { name: 'no_nog', label: 'NOG', type: 'text' },
    { name: 'fecha_inicio', label: 'Fecha Inicio', type: 'date' },
    { name: 'fecha_vencimiento', label: 'Fecha Vencimiento', type: 'date' },    
    { name: 'solicitud', label: 'Solicitud', type: 'text' },    
    { name: 'descripcion_evento', label: 'Descripción Evento', type: 'text' },
    { name: 'no_oc', label: 'Orden de Compra', type: 'text' },
    { name: 'fecha_oc', label: 'Fecha OC', type: 'date' },
    { name: 'nit_adjudicado', label: 'NIT Adjudicado', type: 'text' },
    { name: 'proveedor', label: 'Nombre Proveedor', type: 'text' },
    { name: 'producto', label: 'Descripcion del Producto', type: 'text' },
    { name: 'renglon', label: 'Renglón', type: 'text' },
    { name: 'codigo_insumo', label: 'Código Insumo', type: 'text' },
    { name: 'presentacion_unidad', label: 'Presentación/Unidad', type: 'text' },
    { name: 'unidad_medida', label: 'Unidad de Medida', type: 'text' },
    { name: 'precio', label: 'Precio Unitario', type: 'number' },
    { name: 'cantidad_adjudicada', label: 'Cantidad Adjudicada', type: 'number' },
    { name: 'monto_total', label: 'Monto Total', type: 'number' },
    { name: 'factura_numero', label: 'No. Factura', type: 'text' },
    { name: 'factura_fecha', label: 'Fecha Factura', type: 'date' },
    { name: 'almacen_no_ingreso', label: 'No. Ingreso Almacén', type: 'text' },
    { name: 'almacen_fecha_ingreso', label: 'Fecha Ingreso Almacén', type: 'date' },
    { name: 'cur_numero', label: 'No. CUR', type: 'text' },
    { name: 'cur_fecha', label: 'Fecha CUR', type: 'date' },
    { name: 'realizado_por', label: 'Realizado Por', type: 'text' },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea' },
    { name: 'finalizado', label: 'Finalizado', type: 'checkbox' }
  ],
  baja: [
    { name: 'no', label: 'No', type: 'text' },
    { name: 'modalidad', label: 'Modalidad', type: 'text', disabled: true },
    { name: 'npg', label: 'NPG', type: 'text' },
    { name: 'fecha_publicacion', label: 'Fecha Publicación', type: 'date' },
    { name: 'descripcion_evento', label: 'Descripción Evento', type: 'text' },
    { name: 'solicitud', label: 'Solicitud', type: 'text' },
    { name: 'no_oc', label: 'Orden de Compra', type: 'text' },
    { name: 'fecha_oc', label: 'Fecha OC', type: 'date' },
    { name: 'nit_adjudicado', label: 'NIT Proveedor', type: 'text' },
    { name: 'proveedor', label: 'Nombre Proveedor', type: 'text' },
    { name: 'producto', label: 'Descripcion del Producto', type: 'text' },
    { name: 'renglon', label: 'Renglón', type: 'text' },
    { name: 'codigo_insumo', label: 'Código Insumo', type: 'text' },
    { name: 'presentacion_unidad', label: 'Presentación/Unidad', type: 'text' },
    { name: 'precio', label: 'Precio Unitario', type: 'number' },
    { name: 'cantidad_adjudicada', label: 'Cantidad Adjudicada', type: 'number' },
    { name: 'monto_total', label: 'Monto Total', type: 'number' },
    { name: 'factura_numero', label: 'No. Factura', type: 'text' },
    { name: 'factura_fecha', label: 'Fecha Factura', type: 'date' },
    { name: 'almacen_no_ingreso', label: 'No. Ingreso Almacén', type: 'text' },
    { name: 'almacen_fecha_ingreso', label: 'Fecha Ingreso Almacén', type: 'date' },
    { name: 'cur_numero', label: 'No. CUR', type: 'text' },
    { name: 'cur_fecha', label: 'Fecha CUR', type: 'date' },
    { name: 'realizado_por', label: 'Realizado Por', type: 'text' },
    { name: 'no_acta', label: 'No. Acta', type: 'text' },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea' },
    { name: 'finalizado', label: 'Finalizado', type: 'checkbox' }
  ]
};

export const COLUMNAS_TABLA = {
  directa: [
    ...CAMPOS_MODALIDAD.directa.filter(c => c.name !== 'observaciones'),
  ],
  abierto: [
    ...CAMPOS_MODALIDAD.abierto.filter(c => c.name !== 'no_acta' && c.name !== 'observaciones'),
  ],
  baja: [
    ...CAMPOS_MODALIDAD.baja.filter(c => c.name !== 'no_acta' && c.name !== 'observaciones'),
  ]
};

// Utilidad para formato de fecha
export function formatoFecha(fecha) {
  if (!fecha) return '';
  const d = new Date(fecha);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const anio = d.getFullYear();
  return `${dia}/${mes}/${anio}`;
}