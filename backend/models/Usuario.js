const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    match: [/.+\@.+\..+/, 'Email inválido']
  },
  contraseña: { type: String, required: true },
rol: { 
  type: String, 
  enum: ['admin', 'compras', 'presupuesto', 'contabilidad', 'tesoreria'], // <-- asegúrate que 'admin' esté aquí
  required: true 
},
  activo: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Usuario', usuarioSchema);