const express = require('express');
const router = express.Router();
const Expediente = require('../models/Expediente');

// GET todos los expedientes
router.get('/', async (req, res) => {
  try {
    const expedientes = await Expediente.find();
    res.json(expedientes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST crear un expediente
router.post('/', async (req, res) => {
  // Convierte todos los campos de fecha a Date local
  [
    'fecha_publicacion',
    'fecha_adjudicacion',
    'fecha_cur',
    'fecha_traslado_presupuesto',
    'fecha_traslado_contabilidad',
    'fecha_traslado_tesoreria',
    'fecha_traslado_compras'
    // agrega aquí todos los campos de fecha de tu modelo
  ].forEach(field => {
    if (req.body[field]) {
      req.body[field] = new Date(req.body[field] + 'T00:00:00');
    }
  });

  // Crea el expediente con TODOS los datos recibidos
  const expediente = new Expediente(req.body);

  try {
    const nuevoExpediente = await expediente.save();
    res.status(201).json(nuevoExpediente);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//ACTUALIZAR expediente por ID
router.put('/:id', async (req, res) => {
  [
    'fecha_publicacion',
    'fecha_adjudicacion',
    'fecha_cur',
    'fecha_traslado_presupuesto',
    'fecha_traslado_contabilidad',
    'fecha_traslado_tesoreria',
    'fecha_traslado_compras'
    // agrega aquí todos los campos de fecha de tu modelo
  ].forEach(field => {
    if (req.body[field]) {
      req.body[field] = new Date(req.body[field] + 'T00:00:00');
    }
  });

  try {
    const expedienteActualizado = await Expediente.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(expedienteActualizado);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ELIMINAR expediente por ID
router.delete('/:id', async (req, res) => {
  try {
    await Expediente.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expediente eliminado' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/trasladar/:id', async (req, res) => {
  const { area } = req.body;
  // Usar minúsculas solo para buscar el campo de fecha
  const fechaCampo = {
    presupuesto: 'fecha_traslado_presupuesto',
    contabilidad: 'fecha_traslado_contabilidad',
    tesoreria: 'fecha_traslado_tesoreria',
    compras: 'fecha_traslado_compras'
  }[area ? area.toLowerCase() : ''];

  if (!fechaCampo) {
    return res.status(400).json({ message: 'Área no válida' });
  }

  try {
    const update = {
      areaActual: area, // Guarda en mayúsculas si así lo recibes
      [fechaCampo]: new Date()
    };
    const expediente = await Expediente.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );
    res.json(expediente);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
