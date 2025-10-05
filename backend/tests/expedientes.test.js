const request = require('supertest');
const app = require('../app');
require('./setupTestDB');
const Expediente = require('../models/Expediente');

const basePayload = () => ({
  modalidad: 'COMPRA DIRECTA',
  areaActual: 'COMPRAS',
  no_identificacion: 'EXP-001',
  descripcion_evento: 'Compra de insumos médicos',
  monto_total: 1500.75,
  estatus_evento: 'EN PROCESO'
});

describe('Expedientes API', () => {
  test('crea expediente y lo devuelve', async () => {
    const res = await request(app)
      .post('/api/expedientes')
      .send(basePayload())
      .expect(201);
    expect(res.body._id).toBeDefined();
    expect(res.body.no_identificacion).toBe('EXP-001');
  });

  test('lista expedientes', async () => {
    await new Expediente(basePayload()).save();
    const res = await request(app)
      .get('/api/expedientes')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  test('actualiza expediente', async () => {
    const exp = await new Expediente(basePayload()).save();
    const res = await request(app)
      .put(`/api/expedientes/${exp._id}`)
      .send({ descripcion_evento: 'Compra actualizada' })
      .expect(200);
    expect(res.body.descripcion_evento).toBe('Compra actualizada');
  });

  test('elimina expediente', async () => {
    const exp = await new Expediente(basePayload()).save();
    await request(app)
      .delete(`/api/expedientes/${exp._id}`)
      .expect(200);
    const remaining = await Expediente.find();
    expect(remaining.length).toBe(0);
  });
});