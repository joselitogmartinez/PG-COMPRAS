// Centraliza la URL base del backend
// En Render define REACT_APP_API_URL=https://<tu-servicio-backend>.onrender.com
// En local, crea .env.local con REACT_APP_API_URL=http://localhost:5000
export const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const apiUrl = (path = '') => {
  // Asegura una sola barra
  const base = API_BASE_URL.replace(/\/$/, '');
  const p = String(path || '').replace(/^\//, '');
  return `${base}/${p}`;
};
