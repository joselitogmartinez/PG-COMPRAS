const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const router = express.Router();

// REGISTRO
router.post('/register', async (req, res) => {
  const { nombre, email, contraseña, rol } = req.body;
  try {
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) return res.status(400).json({ mensaje: 'El usuario ya existe' });

    const salt = await bcrypt.genSalt(10);
    const passwordEncriptado = await bcrypt.hash(contraseña, salt);

    const nuevoUsuario = new Usuario({
      nombre,
      email,
      contraseña: passwordEncriptado,
      rol,
      activo: true
    });

    await nuevoUsuario.save();
    res.status(201).json({ mensaje: 'Usuario registrado con éxito' });
  } catch (error) {
    console.error(error); 
    res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
  }
});

router.delete('/usuarios/:id', async (req, res) => {
  try {
    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar usuario' });
  }
});


// Editar usuario
router.put('/usuarios/:id', async (req, res) => {
  const { nombre, email, contraseña, rol } = req.body;
  const datosActualizados = { nombre, email, rol };

  if (contraseña) {
    datosActualizados.contraseña = await bcrypt.hash(contraseña, 10);
  }

  await Usuario.findByIdAndUpdate(req.params.id, datosActualizados);
  res.json({ mensaje: 'Usuario actualizado' });
});

// Activar/Inactivar usuario
router.patch('/usuarios/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    // Si es admin y se intenta desactivar no permite si hay solo un admin
    if (
      usuario.rol === 'admin' &&
      req.body.activo === false
    ) {
      const adminsActivos = await Usuario.countDocuments({ rol: 'admin', activo: true });
      if (adminsActivos <= 1) {
        return res.status(400).json({ mensaje: 'Debe haber al menos un administrador activo.' });
      }
    }

    usuario.activo = req.body.activo;
    await usuario.save();
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar el usuario' });
  }
});

// Obtener todos los usuarios
router.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-contraseña');
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener usuarios' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, contraseña } = req.body;
  const usuario = await Usuario.findOne({ email });
  if (!usuario) return res.status(400).json({ mensaje: 'Usuario no encontrado' });
  if (!usuario.activo) return res.status(401).json({ mensaje: 'Usuario inactivo' });
  const validPassword = await bcrypt.compare(contraseña, usuario.contraseña);
  if (!validPassword) return res.status(400).json({ mensaje: 'Contraseña incorrecta' });

  const token = jwt.sign({ id: usuario._id, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.json({
    token,
    usuario: {
      nombre: usuario.nombre,
      rol: usuario.rol
    }
  });
});

module.exports = router;
