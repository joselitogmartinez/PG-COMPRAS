const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Cargar variables (en test Jest puede cargar dotenv también)
dotenv.config({ path: process.env.DOTENV_PATH || '.env' });

const app = express();

const defaultOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];
const envOrigins = (process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const allowedOrigins = envOrigins.length ? envOrigins : defaultOrigins;

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: Origen no permitido: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Servidor funcionando correctamente');
});

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use('/api/expedientes', require('./routes/expedientes'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chatbot', require('./chatbot/chatbotRoutes'));

app.use((err, req, res, next) => {
  console.error('Error interno:', err);
  res.status(500).json({ mensaje: 'Error en el servidor', error: err.message });
});

module.exports = app;
