# ✅ Solución al Error de CORS

## Problema identificado:
El frontend se ejecutaba en el puerto 3001, pero el backend solo tenía configurado CORS para los puertos 3000 y 5173.

## Soluciones aplicadas:

### 1. **Configuración de CORS en el Backend**
- ✅ **Archivo modificado:** `backend/server.js`
- ✅ **Cambio realizado:** Agregado el puerto 3001 a la lista de orígenes permitidos
```javascript
const defaultOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];
```

### 2. **URLs centralizadas en el Frontend**
- ✅ **Archivos modificados:** `pages/Login.js` y `pages/Compras.js`
- ✅ **Cambio realizado:** Usar `API_URL` de config.js en lugar de URLs hardcodeadas

**Antes:**
```javascript
axios.post('http://localhost:5000/api/auth/login', formulario)
```

**Después:**
```javascript
import { API_URL } from '../config';
axios.post(`${API_URL}/api/auth/login`, formulario)
```

### 3. **Estado de los servidores:**
- ✅ **Backend:** Ejecutándose en puerto 5000 con MongoDB conectado
- ✅ **Frontend:** Ejecutándose en puerto 3001
- ✅ **CORS:** Configurado para permitir comunicación entre ambos puertos

## Verificación:
El error de CORS debería estar completamente resuelto. Puedes probar:
1. Abrir el navegador en `http://localhost:3001`
2. Intentar hacer login
3. Usar la funcionalidad de importar Excel

## Próximos pasos sugeridos:
- Actualizar el resto de archivos para usar `API_URL` centralizada
- Probar todas las funcionalidades
- Verificar que la importación de Excel funciona correctamente
