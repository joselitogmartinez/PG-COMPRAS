import { useNavigate } from 'react-router-dom';
  import React, { useState } from 'react';
  import axios from 'axios';
  import { apiUrl } from '../utils/api';
  import lago from '../img/lago.png'; // Asegúrate de que la ruta sea correcta
  import mspastrans from '../img/mspastrans.png'; // Asegúrate de que la ruta sea correcta
  import '../stylesLogin.css';
  
  const Login = () => {
    const [formulario, setFormulario] = useState({
      usuario: '',
      contraseña: ''
    });
    const [mensaje, setMensaje] = useState('');

    const handleChange = (e) => {
      setFormulario({
        ...formulario,
        [e.target.name]: e.target.value
      });
    };

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
      e.preventDefault();
      setMensaje('');
      try {
  const res = await axios.post(apiUrl('/api/auth/login'), formulario);
        setMensaje('Login exitoso');
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('rol', res.data.usuario.rol);
        if (res.data.usuario.rol === 'compras') {
          navigate('/compras');
        } else if (res.data.usuario.rol === 'presupuesto') {
          navigate('/presupuesto');
        } else if (res.data.usuario.rol === 'contabilidad') {
          navigate('/contabilidad');
        } else if (res.data.usuario.rol === 'tesoreria') {
          navigate('/tesoreria');
        } else {
          navigate('/dashboard');
        }
      } catch (error) {
        setMensaje(error.response?.data?.mensaje || 'Error al iniciar sesión');
      }
    };

    return (
      <div className="login-bg">
        <img src={lago} alt="Fondo" className="login-bg-img" />
        <div className="login-container-custom">
          <form className="login-form-custom" onSubmit={handleSubmit}>
            <h2 className="login-title-custom">Iniciar Sesión</h2>
            <h2 className="login-title-custom-DDRISS">DDRISS JALAPA</h2>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 1rem 0' }}>
              <img
                src={mspastrans}
                alt="MSPAS"
                className='login-mspas-img'
              />
            </div>
            <div className="login-field-custom">
              <label htmlFor="usuario" className="login-label-custom">Usuario</label>
              <input
                type="text"
                id="usuario"
                name="usuario"
                value={formulario.usuario}
                onChange={handleChange}
                required
                autoComplete="username"
                className="login-input-custom"
              />
            </div>
            <div className="login-field-custom">
              <label htmlFor="contraseña" className="login-label-custom">Contraseña</label>
              <input
                type="password"
                id="contraseña"
                name="contraseña"
                value={formulario.contraseña}
                onChange={handleChange}
                required
                autoComplete="current-password"
                className="login-input-custom"
              />
            </div>
            <button className="login-btn-custom" type="submit">Ingresar</button>
            {mensaje && <div className="login-message-custom">{mensaje}</div>}
          </form>
        </div>
      </div>
    );
  };

  export default Login;