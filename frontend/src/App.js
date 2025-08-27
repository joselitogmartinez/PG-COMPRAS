import './styles.css';
import './stylesLogin.css';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import LayoutDashboard from './layouts/LayoutDashboard';
import Compras from './pages/Compras';
import Presupuesto from './pages/Presupuesto';


function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/compras" element={<Compras />} />
      <Route path="/presupuesto" element={<Presupuesto />} />

      {/* Rutas protegidas con layout compartido */}
      <Route element={<ProtectedRoute><LayoutDashboard /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/register" element={<Register />} />

      </Route>
    </Routes>
  );
}

export default App;