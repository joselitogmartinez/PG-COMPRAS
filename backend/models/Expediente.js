const mongoose = require('mongoose');

const expedienteSchema = new mongoose.Schema({
  // Comunes a todas las modalidades
  modalidad: { type: String, enum: ['COMPRA DIRECTA', 'CONTRATO ABIERTO', 'BAJA CUANTÍA'], required: true },
  areaActual: { type: String, enum: ['COMPRAS', 'PRESUPUESTO', 'CONTABILIDAD', 'TESORERIA'], default: 'COMPRAS' },

  // Directa
  no_identificacion: String,
  no_nog: String,
  fecha_publicacion: Date,
  estatus_evento: String,
  fecha_adjudicacion: Date,
  descripcion_evento: String,
  solicitud: String,
  no_oc: String,
  fecha_oc: Date,
  nit_adjudicado: String,
  proveedor: String,
  producto: String,
  renglon: String,
  codigo_insumo: String,
  presentacion_unidad: String,
  precio: Number,
  cantidad_adjudicada: Number,
  monto_total: Number,
  factura_numero: String,
  factura_fecha: Date,
  almacen_no_ingreso: String,
  almacen_fecha_ingreso: Date,
  cur_numero: String,
  cur_fecha: Date,
  registro_sanitario: String,
  distrito: String,
  observaciones: String,
  finalizado: Boolean,
  fecha_traslado_presupuesto: Date,
  fecha_traslado_contabilidad: Date,
  fecha_traslado_tesoreria: Date,
  fecha_traslado_compras: Date,
  cur_aprobado: String,
  cur_devengado: String,
  metodo_pago: String,          
  fecha_pago: Date,
  pagado: { type: Boolean, default: false },

  

  // Abierto
  rubro: String,
  fecha_inicio: Date,
  fecha_vencimiento: Date,
  unidad_medida: String,
  realizado_por: String,

  // Baja
  npg: String,
  no_acta: String
});

module.exports = mongoose.model('Expediente', expedienteSchema);