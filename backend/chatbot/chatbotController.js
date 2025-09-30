// chatbotController.js
// Lógica del chatbot, lista para IA local en el futuro

const Expediente = require('../models/Expediente');

// Esta función puede ser reemplazada por integración con IA local
async function responderPregunta(pregunta) {
  // Ejemplo de reglas simples
  if (pregunta.toLowerCase().includes('total de montos')) {
    const expedientes = await Expediente.find();
    const total = expedientes.reduce((sum, exp) => sum + (exp.monto || 0), 0);
    return `El total de montos es Q${total.toLocaleString()}`;
  }

  if (pregunta.toLowerCase().includes('cuántos expedientes')) {
    const count = await Expediente.countDocuments();
    return `Hay ${count} expedientes en la base de datos.`;
  }

  // Puedes agregar más reglas aquí

  return 'No entendí la pregunta o no tengo datos suficientes.';
}

module.exports = { responderPregunta };
