const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function createTestUsers() {
  console.log('🔄 Creando usuarios de prueba...');

  const testUsers = [
    {
      nombre: 'Administrador Test',
      usuario: 'admin',
      email: 'admin@test.com',
      contraseña: 'admin123',
      rol: 'admin'
    },
    {
      nombre: 'Usuario Compras E2E',
      usuario: 'comprase2e',
      email: 'comprase2e@test.com',
      contraseña: 'compras123',
      rol: 'compras'
    },
    {
      nombre: 'Usuario Presupuesto E2E',
      usuario: 'presupuestoe2e',
      email: 'presupuestoe2e@test.com',
      contraseña: 'presupuesto123',
      rol: 'presupuesto'
    },
    {
      nombre: 'Usuario Contabilidad E2E',
      usuario: 'contabilidade2e',
      email: 'contabilidade2e@test.com',
      contraseña: 'contabilidad123',
      rol: 'contabilidad'
    },
    {
      nombre: 'Usuario Tesorería E2E',
      usuario: 'tesoreriae2e',
      email: 'tesoreriae2e@test.com',
      contraseña: 'tesoreria123',
      rol: 'tesoreria'
    }
  ];

  for (const user of testUsers) {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, user);
      console.log(`✅ Usuario creado: ${user.usuario} (${user.rol})`);
    } catch (error) {
      if (error.response?.data?.mensaje?.includes('ya existe')) {
        console.log(`⚠️  Usuario ya existe: ${user.usuario}`);
      } else {
        console.error(`❌ Error creando ${user.usuario}:`, error.response?.data?.mensaje || error.message);
      }
    }
  }

  // Verificar que el admin puede hacer login
  try {
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      usuario: 'admin',
      contraseña: 'admin123'
    });
    console.log('✅ Login de admin verificado exitosamente');
    console.log('🎯 Usuarios de prueba listos para E2E tests');
  } catch (error) {
    console.error('❌ Error verificando login de admin:', error.response?.data?.mensaje || error.message);
  }
}

createTestUsers().catch(console.error);