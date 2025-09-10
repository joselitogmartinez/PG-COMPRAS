import React, { useState } from 'react';
import '../StylesLayoutDashboard.css'; 
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  FaUsers,
  FaTachometerAlt,
  FaChevronLeft,
  FaChevronRight,
  FaSignOutAlt
} from 'react-icons/fa';
import mspastrans from '../img/mspastrans.png';

const menuItems = [
  { key: 'dashboard', label: 'Dashboard', icon: <FaTachometerAlt />, path: '/dashboard' },
  { key: 'usuarios', label: 'Usuarios', icon: <FaUsers />, path: '/register' },
];

const LayoutDashboard = () => {
  // Por defecto colapsado
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    navigate('/');
  };

  return (
    <div className={`dashboard-main${menuOpen ? '' : ' sidebar-collapsed'}`}>
      {/* Menú lateral */}
      <aside
        className={`dashboard-sidebar ${menuOpen ? 'open' : 'collapsed'}`}
        onMouseEnter={() => setMenuOpen(true)}
        onMouseLeave={() => setMenuOpen(false)}
      >
        <div className="sidebar-img">
          <img src={mspastrans} alt="Logo MSPAS" />
        </div>
        <nav className="sidebar-menu">
          {menuItems.map(item => (
            <div
              key={item.key}
              className={`sidebar-item${location.pathname === item.path ? ' active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {menuOpen && <span className="sidebar-label">{item.label}</span>}
            </div>
          ))}
        </nav>
        {/* Botón cerrar sesión */}
        <div
          className="sidebar-item sidebar-logout"
          onClick={handleLogout}
          style={{ cursor: 'pointer', marginTop: 'auto', color: 'rgba(242, 237, 237, 1)', fontWeight: 'bold' }}
        >
          <span className="sidebar-icon"><FaSignOutAlt /></span>
          {menuOpen && <span className="sidebar-label">Cerrar Sesión</span>}
        </div>
        <div className="sidebar-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FaChevronLeft /> : <FaChevronRight />}
        </div>
      </aside>
      {/* Contenido principal */}
      <section className="dashboard-content">
        <Outlet />
      </section>
    </div>
  );
};


export default LayoutDashboard;

