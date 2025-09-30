// chatbotRoutes.js
const express = require('express');
const router = express.Router();
const { responderPregunta } = require('./chatbotController');

// Endpoint para recibir preguntas del frontend
router.post('/preguntar', async (req, res) => {
  const { pregunta } = req.body;
  try {
    const respuesta = await responderPregunta(pregunta);
    res.json({ respuesta });
  } catch (error) {
    res.status(500).json({ respuesta: 'Error procesando la pregunta.' });
  }
}); 

module.exports = router;
