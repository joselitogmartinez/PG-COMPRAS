const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Ruta principal
app.get("/", (req, res) => {
  res.send("Servidor funcionando correctamente");
});

// Rutas
const expedientesRoutes = require("./routes/expedientes");
app.use("/api/expedientes", expedientesRoutes);

const authRoutes = require("./routes/auth");
app.use('/api/auth', authRoutes);

// Manejo global de errores 
app.use((err, req, res, next) => {
  console.error('Error interno:', err);
  res.status(500).json({ mensaje: 'Error en el servidor', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});