const request = require('supertest');
const app = require('../app');
require('./setupTestDB');
const Usuario = require('../models/Usuario');

describe('Gestión Avanzada de Usuarios', () => {
  test('no permite eliminar el último administrador', async () => {
    // Crear un único admin
    const admin = await new Usuario({
      nombre: 'Admin Único',
      usuario: 'admin_unico',
      email: 'admin@test.com',
      contraseña: '$2a$10$hashedpassword',
      rol: 'admin'
    }).save();

    const res = await request(app)
      .delete(`/api/auth/usuarios/${admin._id}`)
      .expect(400);
    
    expect(res.body.mensaje).toMatch(/único administrador/i);
  });

  test('permite eliminar admin si hay más de uno', async () => {
    // Crear dos admins
    const admin1 = await new Usuario({
      nombre: 'Admin 1', usuario: 'admin1', email: 'a1@test.com',
      contraseña: '$2a$10$hash1', rol: 'admin'
    }).save();
    
    await new Usuario({
      nombre: 'Admin 2', usuario: 'admin2', email: 'a2@test.com',
      contraseña: '$2a$10$hash2', rol: 'admin'
    }).save();

    await request(app)
      .delete(`/api/auth/usuarios/${admin1._id}`)
      .expect(200);
    
    const remaining = await Usuario.find({ rol: 'admin' });
    expect(remaining.length).toBe(1);
  });

  test('no permite desactivar el último admin activo', async () => {
    const admin = await new Usuario({
      nombre: 'Admin Único',
      usuario: 'admin_solo',
      email: 'solo@test.com',
      contraseña: '$2a$10$hash',
      rol: 'admin',
      activo: true
    }).save();

    const res = await request(app)
      .patch(`/api/auth/usuarios/${admin._id}`)
      .send({ activo: false })
      .expect(400);
    
    expect(res.body.mensaje).toMatch(/al menos un administrador activo/i);
  });

  test('actualiza usuario sin cambiar contraseña', async () => {
    const user = await new Usuario({
      nombre: 'Usuario Test',
      usuario: 'usertest',
      email: 'user@test.com',
      contraseña: '$2a$10$originalhash',
      rol: 'compras'
    }).save();

    await request(app)
      .put(`/api/auth/usuarios/${user._id}`)
      .send({ 
        nombre: 'Usuario Actualizado',
        email: 'updated@test.com'
      })
      .expect(200);
    
    const updated = await Usuario.findById(user._id);
    expect(updated.nombre).toBe('Usuario Actualizado');
    expect(updated.contraseña).toBe('$2a$10$originalhash'); // No cambió
  });

  test('no permite cambiar rol de admin a otro rol', async () => {
    const admin = await new Usuario({
      nombre: 'Admin Fijo',
      usuario: 'admin_fijo',
      email: 'fijo@test.com',
      contraseña: '$2a$10$hash',
      rol: 'admin'
    }).save();

    const res = await request(app)
      .put(`/api/auth/usuarios/${admin._id}`)
      .send({ rol: 'compras' })
      .expect(400);
    
    expect(res.body.mensaje).toMatch(/rol del usuario administrador no puede cambiarse/i);
  });
});