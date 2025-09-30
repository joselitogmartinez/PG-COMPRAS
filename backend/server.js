const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");


dotenv.config();
connectDB();

const app = express();
// CORS: permite múltiples orígenes separados por coma en FRONTEND_ORIGINS
// Ej: FRONTEND_ORIGINS="http://localhost:3000,https://tu-sitio.netlify.app"
const defaultOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];
const envOrigins = (process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const allowedOrigins = envOrigins.length ? envOrigins : defaultOrigins;

app.use(cors({
  origin: function (origin, callback) {
    // Permitir herramientas sin origen (curl, pruebas locales)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: Origen no permitido: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Ruta principal
app.get("/", (req, res) => {
  res.send("Servidor funcionando correctamente");
});

// Ruta de salud para plataformas (Railway)
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Rutas
const expedientesRoutes = require("./routes/expedientes");
app.use("/api/expedientes", expedientesRoutes);

const authRoutes = require("./routes/auth");
app.use('/api/auth', authRoutes);

// Chatbot
const chatbotRoutes = require("./chatbot/chatbotRoutes");
app.use('/api/chatbot', chatbotRoutes);

// Manejo global de errores 
app.use((err, req, res, next) => {
  console.error('Error interno:', err);
  res.status(500).json({ mensaje: 'Error en el servidor', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});