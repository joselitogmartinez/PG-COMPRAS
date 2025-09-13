const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  // Nuevo identificador de acceso (nombre de usuario)
  usuario: { type: String, required: true, unique: true, trim: true },
  // Email pasa a ser opcional
  email: { 
    type: String,
    required: false,
    unique: false,
    match: [/.+\@.+\..+/, 'Email inválido'],
    sparse: true
  },
  contraseña: { type: String, required: true },
  rol: { 
    type: String, 
    enum: ['admin', 'compras', 'presupuesto', 'contabilidad', 'tesoreria'],
    required: true 
  },
  activo: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Usuario', usuarioSchema);