const mongoose = require("mongoose");

/**
 * Conecta a MongoDB. Permite pasar una URI explícita (útil para pruebas con Mongo en memoria).
 * En entorno de test no hace process.exit para permitir que Jest capture el error.
 */
const connectDB = async (uri) => {
  const mongoUri = uri || process.env.MONGO_URI;
  if (!mongoUri) {
    const msg = 'MONGO_URI no definida';
    if (process.env.NODE_ENV === 'test') throw new Error(msg);
    console.error(msg);
    process.exit(1);
  }
  try {
    await mongoose.connect(mongoUri);
    if (process.env.NODE_ENV !== 'test') {
      console.log('MongoDB conectado correctamente');
    }
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error.message);
    if (process.env.NODE_ENV === 'test') throw error;
    process.exit(1);
  }
};

module.exports = connectDB;