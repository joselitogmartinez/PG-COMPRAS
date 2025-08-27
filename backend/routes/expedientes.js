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
  const fechaCampo = {
    presupuesto: 'fecha_traslado_presupuesto',
    contabilidad: 'fecha_traslado_contabilidad',
    tesoreria: 'fecha_traslado_tesoreria',
    compras: 'fecha_traslado_compras'
  }[area];

  if (!fechaCampo) {
    return res.status(400).json({ message: 'Área no válida' });
  }

  try {
    const update = {
      areaActual: area,
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
