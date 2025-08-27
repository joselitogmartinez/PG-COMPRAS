import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  FaUsers,
  FaTachometerAlt,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import '../styleMenu.css';
import mspastrans from '../img/mspastrans.png';

const menuItems = [
  { key: 'dashboard', label: 'Dashboard', icon: <FaTachometerAlt />, path: '/dashboard' },
  { key: 'usuarios', label: 'Usuarios', icon: <FaUsers />, path: '/register' },
];

const LayoutDashboard = () => {
  const [menuOpen, setMenuOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

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