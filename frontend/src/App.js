
import './tabla-expedientes-compras.css';
import './tabla-expedientes-presupuesto.css';

import React from 'react';    
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import LayoutDashboard from './layouts/LayoutDashboard';
import Compras from './pages/Compras';
import Presupuesto from './pages/Presupuesto';
import Contabilidad from './pages/Contabilidad';
import Tesoreria from './pages/Tesoreria';
  
function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/compras" element={<Compras />} />
      <Route path="/presupuesto" element={<Presupuesto />} />
      <Route path="/contabilidad" element={<Contabilidad />} />
      <Route path="/tesoreria" element={<Tesoreria />} />

      {/* Rutas protegidas con layout compartido */}
      <Route element={<ProtectedRoute><LayoutDashboard /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/register" element={<Register />} />

      </Route>
    </Routes>
  );
}

export default App;