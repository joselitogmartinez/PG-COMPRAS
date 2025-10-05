const request = require('supertest');
const app = require('../app');
require('./setupTestDB');
const Usuario = require('../models/Usuario');

describe('Auth API', () => {
  test('registra y luego permite login', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Admin', usuario: 'admin1', email: 'a@a.com', contraseña: 'Pass1234', rol: 'admin' })
      .expect(201);
    expect(registerRes.body.mensaje).toMatch(/registrado/i);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin1', contraseña: 'Pass1234' })
      .expect(200);
    expect(loginRes.body.token).toBeDefined();
    expect(loginRes.body.usuario.rol).toBe('admin');
  });

  test('impide login con password incorrecto', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'User', usuario: 'user1', email: 'u@u.com', contraseña: 'Secret1', rol: 'compras' })
      .expect(201);

    const badLogin = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'user1', contraseña: 'MalaClave' })
      .expect(400);
    expect(badLogin.body.mensaje).toMatch(/contraseña/i);
  });

  test('no permite dos usuarios con mismo usuario', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'User', usuario: 'repetido', email: 'r@r.com', contraseña: 'Secret1', rol: 'compras' })
      .expect(201);
    const second = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'User2', usuario: 'repetido', email: 'r2@r.com', contraseña: 'Secret1', rol: 'compras' });
    expect(second.status).toBe(400);
  });
});
