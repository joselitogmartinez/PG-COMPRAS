
## 1. ¿Por qué pruebas unitarias primero?
El proyecto contiene lógica de negocio concentrada en:
- Rutas REST (`/api/auth`, `/api/expedientes`)
- Modelos Mongoose (`Usuario`, `Expediente`)
- Transformaciones simples (fechas, validaciones de unicidad, actualización de estado)

Las pruebas unitarias / de integración ligera sobre las rutas permiten:
- Validar flujos críticos: autenticación, CRUD de expedientes, reglas sobre usuario admin.
- Asegurar que cambios futuros (refactors) no rompan endpoints existentes.
- Servir como base para auditorías o anexos de calidad en documentación.

Pruebas de seguridad profundas (pentesting, fuzzing, SAST/DAST) requieren más tiempo, herramientas externas y definición formal de amenazas. Se pueden añadir después, apoyándose en esta base.

## 2. Cómo Funcionan los Tests

### 2.1 Arquitectura de Testing

#### **Base de Datos en Memoria**
```javascript
// setupTestDB.js
const mongoServer = await MongoMemoryServer.create();
const uri = mongoServer.getUri();
await connectDB(uri);
```

**¿Por qué?**
- **Aislamiento**: Cada test inicia con BD limpia
- **Velocidad**: No hay latencia de red ni dependencias externas
- **Determinismo**: Resultados consistentes en cualquier entorno
- **Limpieza**: Base temporal que se destruye al finalizar

#### **Estructura de un Test Típico**
```javascript
describe('Módulo a probar', () => {
  test('debe hacer algo específico', async () => {
    // 1. ARRANGE - Preparar datos
    const payload = { campo: 'valor' };
    
    // 2. ACT - Ejecutar acción  
    const res = await request(app)
      .post('/api/endpoint')
      .send(payload)
      .expect(200);
    
    // 3. ASSERT - Verificar resultado
    expect(res.body.campo).toBe('valor');
  });
});
```

### 2.2 Herramientas Utilizadas

#### **Jest** (Test Runner)
- Ejecuta y organiza las pruebas
- Proporciona `describe()`, `test()`, `expect()`
- Genera reportes de cobertura
- Maneja setup/teardown automático

#### **Supertest** (HTTP Testing)
- Simula peticiones HTTP sin levantar servidor real
- Permite probar endpoints como si fuera un cliente
- Valida códigos de estado, headers, body
- Integra perfectamente con Express

  #### **MongoDB Memory Server** (Base de Datos)
  - Instancia temporal de MongoDB en memoria RAM
  - Compatible 100% con Mongoose
  - Se crea/destruye automáticamente por test suite

### 2.3 Flujo de Ejecución

```
1. Jest inicia → setupTestDB.js
2. Se crea MongoDB en memoria  
3. Se conecta app.js (sin servidor HTTP)
4. Para cada test:
   a) Limpia colecciones
   b) Ejecuta test individual  
   c) Valida resultados
5. Al finalizar: destruye BD temporal
```

## 3. Tipos de Tests Implementados

### 3.1 **Tests de Autenticación** (`auth.test.js`)

#### **Registro de Usuario**
```javascript
test('registra y luego permite login', async () => {
  // Simula registro via API
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({ nombre: 'Admin', usuario: 'admin1', contraseña: 'Pass1234', rol: 'admin' })
    .expect(201);
  
  // Verifica que se puede hacer login después
  const loginRes = await request(app)
    .post('/api/auth/login')  
    .send({ usuario: 'admin1', contraseña: 'Pass1234' })
    .expect(200);
    
  expect(loginRes.body.token).toBeDefined(); // JWT generado
});
```

**¿Qué valida?**
- Hash correcto de contraseña con bcrypt
- Generación de token JWT válido
- Flujo completo registro → login

#### **Validación de Credenciales**
```javascript
test('impide login con password incorrecto', async () => {
  await crearUsuario(); // Helper para preparar data
  
  const badLogin = await request(app)
    .post('/api/auth/login')
    .send({ usuario: 'user1', contraseña: 'MalaClave' })
    .expect(400); // Error esperado
    
  expect(badLogin.body.mensaje).toMatch(/contraseña/i);
});
```

**¿Qué valida?**
- Comparación segura con bcrypt.compare()
- Respuesta apropiada ante credenciales inválidas
- Mensajes de error informativos

### 3.2 **Tests de CRUD** (`expedientes.test.js`)

#### **Creación de Expedientes**
```javascript
test('crea expediente y lo devuelve', async () => {
  const payload = {
    modalidad: 'COMPRA DIRECTA',
    areaActual: 'COMPRAS',
    no_identificacion: 'EXP-001',
    descripcion_evento: 'Compra de insumos médicos',
    monto_total: 1500.75
  };
  
  const res = await request(app)
    .post('/api/expedientes')
    .send(payload)
    .expect(201);
    
  expect(res.body._id).toBeDefined(); // MongoDB asigna ID
  expect(res.body.no_identificacion).toBe('EXP-001');
});
```

**¿Qué valida?**
- Modelo Mongoose procesa datos correctamente
- Validaciones de schema funcionan
- Respuesta incluye ID generado por BD

### 3.3 **Tests de Lógica de Negocio** (`traslados.test.js`)

#### **Traslado Entre Áreas**
```javascript
test('traslada expediente de COMPRAS a PRESUPUESTO', async () => {
  const exp = await new Expediente(basePayload()).save();
  
  const res = await request(app)
    .put(`/api/expedientes/trasladar/${exp._id}`)
    .send({ area: 'PRESUPUESTO' })
    .expect(200);
  
  expect(res.body.areaActual).toBe('PRESUPUESTO');
  expect(res.body.fecha_traslado_presupuesto).toBeDefined();
});
```

**¿Qué valida?**
- Actualización correcta del área
- Registro automático de timestamp
- Integridad del flujo de trabajo

### 3.4 **Tests de Validación** (`validaciones.test.js`)

#### **Campos Requeridos**
```javascript
test('rechaza expediente sin modalidad requerida', async () => {
  const invalidPayload = {
    areaActual: 'COMPRAS',
    // modalidad faltante (campo required)
    descripcion_evento: 'Sin modalidad'
  };

  const res = await request(app)
    .post('/api/expedientes')
    .send(invalidPayload)
    .expect(400); // Error de validación
    
  expect(res.body.message).toBeDefined();
});
```

#### **Conversión de Fechas**
```javascript
test('convierte fechas correctamente en POST', async () => {
  const payload = {
    modalidad: 'COMPRA DIRECTA',
    fecha_adjudicacion: '2024-12-15', // String
    // ... otros campos
  };

  const res = await request(app).post('/api/expedientes').send(payload);
  
  const fecha = new Date(res.body.fecha_adjudicacion);
  expect(fecha.getFullYear()).toBe(2024);
  expect(fecha.getMonth()).toBe(11); // Diciembre (0-indexed)
});
```

**¿Qué valida?**
- Transformación automática String → Date
- Zona horaria local correcta  
- Persistencia en formato MongoDB

### 3.5 **Tests de Seguridad** (`usuarios.test.js`)

#### **Protección de Administrador**
```javascript
test('no permite eliminar el último administrador', async () => {
  const admin = await crearUnicoAdmin();
  
  const res = await request(app)
    .delete(`/api/auth/usuarios/${admin._id}`)
    .expect(400);
    
  expect(res.body.mensaje).toMatch(/único administrador/i);
});
```

**¿Qué valida?**
- Reglas de negocio críticas
- Prevención de estados inconsistentes
- Mensajes informativos al usuario

## 4. Patrones de Testing Utilizados

### 4.1 **AAA Pattern** (Arrange-Act-Assert)
```javascript
test('ejemplo AAA', async () => {
  // ARRANGE - Preparar condiciones
  const usuario = await crearUsuario();
  const payload = { campo: 'nuevo_valor' };
  
  // ACT - Ejecutar acción a probar
  const res = await request(app)
    .put(`/usuarios/${usuario._id}`)
    .send(payload);
  
  // ASSERT - Verificar resultado
  expect(res.status).toBe(200);
  expect(res.body.campo).toBe('nuevo_valor');
});
```

### 4.2 **Helper Functions**
```javascript
const baseExpediente = () => ({
  modalidad: 'COMPRA DIRECTA',
  areaActual: 'COMPRAS',
  no_identificacion: 'TEST-001',
  descripcion_evento: 'Test',
  monto_total: 1000
});

// Reutilizable en múltiples tests
test('test 1', async () => {
  const exp = await new Expediente(baseExpediente()).save();
  // ... resto del test
});
```

### 4.3 **beforeEach/afterEach Hooks**
```javascript
describe('Suite de Tests', () => {
  beforeEach(async () => {
    // Ejecuta antes de cada test individual
    await prepararDatosPrueba();
  });
  
  afterEach(async () => {
    // Limpia después de cada test
    await limpiarDatos();
  });
});
```

## 5. Ejecución de Tests

### 5.1 **Suite Completa**
```bash
npm test                    # Todos los tests
npm run test:coverage      # Con reporte de cobertura
npm run test:watch         # Modo interactivo
```

### 5.2 **Tests Individuales**  
```bash
npm test auth.test.js              # Solo autenticación
npm test expedientes.test.js       # Solo CRUD expedientes
npm test traslados.test.js         # Solo lógica de traslados
npm test usuarios.test.js          # Solo gestión usuarios
npm test validaciones.test.js      # Solo validaciones
```

### 5.3 **Filtros Específicos**
```bash
# Por nombre de test
npm test -- --testNamePattern="traslada expediente"

# Por patrón de archivo  
npm test -- --testPathPattern="auth"

# Solo tests fallidos
npm test -- --onlyFailures
```

## 6. Interpretación de Resultados

### 6.1 **Salida Exitosa**
```
✅ Auth API
  ✅ registra y luego permite login (283 ms)
  ✅ impide login con password incorrecto (184 ms)

Test Suites: 5 passed, 5 total
Tests: 21 passed, 21 total  
Time: 9.585 s
```

### 6.2 **Salida con Errores**
```
❌ Auth API › registra usuario
  expect(received).toBe(expected)
  
  Expected: 201
  Received: 400
  
  at Object.toBe (auth.test.js:15:29)
```

### 6.3 **Reporte de Cobertura**
```
File                 | % Stmts | % Branch | % Funcs | % Lines
---------------------|---------|----------|---------|--------
All files            |   79.9  |   64.86  |   84    |  83.07
routes/auth.js       |   74.68 |   68.57  |  83.33  |  79.16
models/Expediente.js |    100  |    100   |   100   |   100
```

## 7. Beneficios Obtenidos

### 7.1 **Calidad de Código**
- **Detección temprana** de errores
- **Refactoring seguro** con red de seguridad
- **Documentación ejecutable** del comportamiento esperado

### 7.2 **Confiabilidad**
- **Regresiones prevenidas** en despliegues
- **Comportamiento consistente** entre entornos
- **Validación automática** de reglas de negocio

### 7.3 **Productividad**  
- **Debugging más rápido** con tests que fallan específicamente
- **Onboarding facilitado** para nuevos desarrolladores
- **Iteración rápida** en nuevas funcionalidades

## 8. Métricas Actuales

- **21 tests** ejecutándose en ~10 segundos
- **5 módulos** cubiertos (auth, expedientes, traslados, usuarios, validaciones)  
- **83% cobertura** de líneas de código
- **100% tasa de éxito** en suite completa
- **0 dependencias externas** (BD en memoria)

---

Esta implementación proporciona una base sólida de testing que puede escalar conforme crezca el proyecto, sirviendo como evidencia de control de calidad para auditorías técnicas y certificaciones.

## 9. Tests End-to-End (E2E) con Selenium

Además de las pruebas unitarias del backend, el proyecto incluye **tests E2E** que validan la integración completa frontend-backend simulando usuarios reales.

### 9.1 **Ubicación y Configuración**
```
tests/
└── selenium/
    └── flows_adapted.test.js    # Test principal E2E
```

**Dependencias:**
- `selenium-webdriver`: Automatización del navegador
- `chromedriver`: Driver para Google Chrome  
- `mocha`: Test runner para E2E
- `chai`: Librería de aserciones

### 9.2 **Flujo de Prueba Implementado**

#### **Test: "Flujo adaptado: login → crear → trasladar → eliminar"**

1. **Setup inicial:**
   ```javascript
   // Configura navegador Chrome (headless opcional)
   // Navega a http://localhost:3000
   // Simula autenticación via localStorage
   ```

2. **Crear expediente:**
   ```javascript
   // Hace clic en botón "Registrar"
   // Rellena modal con referencia única (TEST-timestamp)  
   // Guarda y verifica aparición en tabla
   ```

3. **Trasladar expediente:**
   ```javascript
   // Localiza fila del expediente creado
   // Hace clic en botón "Trasladar"
   // Selecciona "Contabilidad" en modal
   // Verifica cambio de área en la tabla
   ```

4. **Eliminar expediente:**
   ```javascript
   // Localiza fila del expediente
   // Hace clic en botón "Eliminar" 
   // Confirma eliminación (alert o modal)
   // Verifica desaparición de la tabla
   ```

### 9.3 **Ejecución de Tests E2E**

#### **Preparación del entorno:**
```bash
# Terminal 1: Frontend
cd frontend && npm start    # Puerto 3000

# Terminal 2: Backend  
cd backend && npm start     # Puerto 5000

# Terminal 3: Tests E2E
npm run test:selenium       # Desde raíz del proyecto
```

#### **Opciones avanzadas:**
```bash
# Modo headless (sin ventana del navegador)
HEADLESS=true npm run test:selenium

# URL personalizada
BASE_URL=http://localhost:3001 npm run test:selenium
```

### 9.4 **Estrategias de Robustez**

#### **Manejo de elementos dinámicos:**
```javascript
// Espera inteligente hasta que elemento sea localizable
await driver.wait(
  until.elementLocated(By.xpath("//button[contains(., 'REGISTRAR')]")),
  timeout
);

// Función helper para encontrar filas por texto
async function findRowByText(text) {
  const rows = await driver.findElements(By.css('table tbody tr'));
  for (const row of rows) {
    const t = await row.getText();
    if (t.includes(text)) return row;
  }
  return null;
}
```

#### **Reintentos automáticos:**
```javascript
// Reintenta operaciones ante errores temporales
while ((Date.now() - start) < timeout) {
  try {
    // Operación que puede fallar temporalmente
    await elemento.click();
    break;
  } catch (err) {
    if (err.name === 'StaleElementReferenceError') {
      await driver.sleep(500);
      continue; // Reintenta
    }
    throw err; // Error no recuperable
  }
}
```

### 9.5 **Validaciones Cubiertas**

- **Integración Frontend-Backend**: Flujo completo de datos
- **Interfaz de Usuario**: Elementos interactivos funcionando
- **Estado de Aplicación**: Cambios reflejados en tiempo real
- **Navegación**: Transiciones entre estados
- **Persistencia**: Datos guardados y recuperados correctamente

### 9.6 **Beneficios del Testing E2E**

- **Confianza en Producción**: Simula experiencia real del usuario
- **Detección de Problemas de Integración**: Encuentra bugs que tests unitarios no detectan
- **Validación de UI/UX**: Verifica que la interfaz funciona como se diseñó
- **Regresión Visual**: Detecta cambios no intencionados en la interfaz

### 9.7 **Limitaciones y Consideraciones**

- **Tiempo de Ejecución**: Más lento que tests unitarios (~10-15 segundos)
- **Fragilidad**: Sensible a cambios en la UI
- **Dependencias**: Requiere frontend y backend funcionando
- **Recursos**: Consume más CPU/memoria (navegador real)

### 9.8 **Estrategia de Testing Completa**

```
Pirámide de Testing:
├── E2E Tests (Selenium)          ← Pocos, críticos, lentos
├── Integration Tests (Supertest) ← Moderados, API, rápidos  
└── Unit Tests (Jest)             ← Muchos, específicos, muy rápidos
```

**Recomendación de uso:**
- **Tests Unitarios**: Desarrollo diario, CI/CD
- **Tests de Integración**: Pre-deployment, validación API
- **Tests E2E**: Releases, validación UX crítica

## 10. Resumen de Testing Integral

El proyecto ahora cuenta con **testing multicapa**:

- **21 tests unitarios** (backend) en ~10 segundos
- **3 tests E2E** (full-stack) en ~15 segundos  
- **Cobertura combinada**: Lógica + UI + Integración
- **Ejecución flexible**: Individual o suite completa
- **Documentación ejecutable**: Tests como especificación viva

Esta implementación proporciona evidencia robusta de calidad de software para cualquier auditoría o certificación técnica.

## 2. Alcance Actual de Pruebas
Se implementaron pruebas de API (nivel request-response) usando:
- Jest (runner de pruebas)
- Supertest (simulación HTTP sin levantar servidor real)
- MongoDB Memory Server (base de datos efímera para aislamiento)

Esto cubre:
- Registro y login (incluye hashing de contraseña y validaciones básicas)
- Restricción de duplicados (usuario único)
- CRUD básico de expedientes
- Actualización y eliminación de expedientes

## 3. Tecnologías Añadidas
```
jest
supertest
mongodb-memory-server
cross-env
```
Junto con un refactor no invasivo: separación de `app.js` (instancia Express) y `server.js` (bootstrap real) para habilitar inyección de base y entorno de test.

## 4. Estructura de Archivos de Test
```
backend/
  app.js              # App Express exportable
  server.js           # Punto de entrada producción
  config/db.js        # Conexión reutilizable (ahora admite URI de prueba)
  tests/
    setupTestDB.js    # Arranque Mongo en memoria y limpieza
    auth.test.js      # Casos de autenticación
    expedientes.test.js  # Casos CRUD de expedientes
```

## 5. Cómo Ejecutar las Pruebas
Desde la carpeta `backend`:
```
npm install
npm test
```
Otros scripts útiles:
```
npm run test:watch     # Modo interactivo
npm run test:coverage  # Reporte de cobertura
```

## 6. Ejemplos de Casos Cubiertos
- Registro exitoso de usuario admin
- Login válido produce token JWT
- Login fallido por contraseña incorrecta
- Bloqueo de usuario duplicado
- Creación de expediente con campos mínimos
- Listado, actualización y eliminación

## 7. Próximas Extensiones (Recomendadas)
1. Añadir pruebas sobre `trasladar/:id` (cambio de área y sellado de fecha).
2. Validar reglas de negocio futuras (restricciones por rol en endpoints sensibles).
3. Seguridad:
   - Integrar librería de análisis estático (por ejemplo `npm audit`, `semgrep`).
   - Añadir tests para expiración de tokens y rutas protegidas (middleware de auth si se implementa).
   - Simular intentos básicos de inyección (payloads con caracteres especiales) en campos texto.
4. Cobertura de chatbot (mock de consultas a la base de datos).
5. Pruebas end-to-end (E2E) con Selenium/Playwright reutilizando datos semilla.

## 8. Justificación para Documentación Oficial
La introducción de esta suite de pruebas:
- Reduce riesgo de regresiones.
- Facilita incorporación de nuevas funcionalidades con confianza.
- Provee evidencia objetiva de control de calidad.
- Sirve como base para futuras certificaciones o auditorías (ISO 25010, etc.).

## 9. Métricas Iniciales Sugeridas
Tras ejecutar `npm run test:coverage` (cuando se ejecute en tu entorno) documentar:
- % Statements
- % Branches
- % Functions
- % Lines

(La cobertura exacta depende del entorno, por eso no se captura aquí numéricamente.)

## 10. Buenas Prácticas Adoptadas
- Aislamiento: cada test inicia con BD limpia.
- Determinismo: no uso de fechas dinámicas en aserciones salvo lógica directa.
- Rapidez: Mongo en memoria evita dependencias externas.
- Escalabilidad: Patrón app/server permite añadir frameworks (e.g. supertest, pact) sin tocar lógica.

---
Para futuras auditorías de seguridad se puede anexar un documento adicional con resultados de: `npm audit --production`, pruebas de cabeceras HTTP (helmet), revisión de dependencias críticas y pruebas de autorización.
