# PG-COMPRAS — Guía de Despliegue en Render

Este proyecto está preparado para desplegarse en Render usando un Blueprint (render.yaml) con dos servicios:
- Backend (Node + Express + MongoDB)
- Frontend (sitio estático de React)

## 1) Requisitos
- Repositorio en GitHub/GitLab con este código (ya incluye render.yaml).
- Una base de datos MongoDB (p. ej., MongoDB Atlas).

## 2) Despliegue con Blueprint
1. Entra a render.com → New → Blueprint
2. Conecta tu repositorio PG-COMPRAS y selecciona la rama master.
3. Render detectará render.yaml y propondrá 2 servicios:
   - pg-compras-backend (Web Service, Node)
   - pg-compras-frontend (Static Site)
4. Configura las variables y haz Deploy.

## 3) Variables de entorno
### Backend (pg-compras-backend)
Obligatorias:
- MONGO_URI: cadena de conexión de MongoDB (Atlas).
- JWT_SECRET: una cadena secreta segura.

Opcionales/ya definidas en render.yaml:
- NODE_ENV=production
- PORT=5000
- NODE_VERSION=18
- CORS_ORIGIN: URL pública del frontend (ej.: https://pg-compras-frontend.onrender.com)

### Frontend (pg-compras-frontend)
- REACT_APP_API_URL: URL pública del backend (ej.: https://pg-compras-backend.onrender.com)

Nota: en sitios estáticos, las variables REACT_APP_* se inyectan en build. Si las cambias, usa “Clear cache & deploy” para reconstruir.

## 4) Archivos clave
- render.yaml: define ambos servicios (backend y frontend) y una regla de rewrite para SPA.
- frontend/src/utils/api.js: centraliza la URL del backend; usa REACT_APP_API_URL.
- backend/server.js: CORS configurable mediante CORS_ORIGIN.

## 5) Desarrollo local
Opción A (con variable):
- Backend: cd backend, npm install, npm start → expone http://localhost:5000
- Frontend: crear frontend/.env.local con:
  REACT_APP_API_URL=http://localhost:5000
  Luego: cd frontend, npm start

Opción B (proxy):
- Ya existe proxy en frontend/package.json → puedes omitir REACT_APP_API_URL y llamar rutas /api/... si lo prefieres. El código actual usa REACT_APP_API_URL vía apiUrl(), por lo que la Opción A es la recomendada.

## 6) Problemas comunes
- CORS bloqueado: asegúrate de definir CORS_ORIGIN en el backend con la URL exacta del frontend.
- 404 al refrescar en el frontend: render.yaml incluye rewrite /* -> /index.html.
- El frontend no “ve” el backend en producción: revisa REACT_APP_API_URL y vuelve a desplegar con “Clear cache & deploy”.
- Cambié una variable del frontend y no se refleja: en sitios estáticos, los cambios requieren rebuild (Clear cache & deploy).

## 7) Estructura
- backend/ → API REST (Express, Mongoose)
- frontend/ → React (CRA), build en frontend/build/
- render.yaml → configuración de Render

---
Cualquier ajuste adicional (p. ej., dominios personalizados o planes de Render) se hace desde el panel de Render por servicio.