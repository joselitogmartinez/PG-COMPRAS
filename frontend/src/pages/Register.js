import React, { useState, useEffect } from 'react';
import '../StylesRegistroUsuarios.css';
import axios from 'axios';
import { FaUserPlus, FaEdit, FaTrash } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';

const Register = () => {
  const [formulario, setFormulario] = useState({
    nombre: '',
    usuario: '',
    contraseña: '',
    rol: 'compras'
  });

  const [mensaje, setMensaje] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  // ...

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  const obtenerUsuarios = async () => {
    try {
  const respuesta = await axios.get('http://localhost:5000/api/auth/usuarios');
      setUsuarios(respuesta.data);
    } catch (error) {
      console.error('Error al obtener usuarios', error);
    }
  };

  const handleChange = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    try {
      if (editando && usuarioSeleccionado) {
  await axios.put(`http://localhost:5000/api/auth/usuarios/${usuarioSeleccionado._id}`, {
          nombre: formulario.nombre,
          usuario: formulario.usuario,
          contraseña: formulario.contraseña ? formulario.contraseña : undefined,
          // Si el seleccionado es admin, no enviar cambio de rol para bloquear modificación
          ...(usuarioSeleccionado.rol === 'admin' ? {} : { rol: formulario.rol })
        });
        setMensaje('Usuario actualizado correctamente');
      } else {
  await axios.post('http://localhost:5000/api/auth/register', formulario);
        setMensaje('Usuario registrado correctamente');
      }
  setFormulario({ nombre: '', usuario: '', contraseña: '', rol: 'compras' });
      setShowModal(false);
      setEditando(false);
      setUsuarioSeleccionado(null);
      obtenerUsuarios();
    } catch (error) {
      setMensaje(error.response?.data?.mensaje || 'Error al procesar');
    }
  };

  const handleToggleActivo = async (usuario) => {
    try {
  await axios.patch(`http://localhost:5000/api/auth/usuarios/${usuario._id}`, {
        activo: !usuario.activo
      });
      obtenerUsuarios();
    } catch (error) {
      setMensaje('Error al cambiar el estado');
    }
  };

  const handleEditarUsuario = (usuario) => {
    setFormulario({
      nombre: usuario.nombre,
      usuario: usuario.usuario,
      contraseña: '', // Por seguridad, no mostrar la contraseña
      rol: usuario.rol
    });
    setUsuarioSeleccionado(usuario);
    setEditando(true);
    setShowModal(true);
  };

  const handleEliminarUsuario = async (usuario) => {
    // Verifica si es admin y si es el único admin
    if (usuario.rol === 'admin') {
      const admins = usuarios.filter(u => u.rol === 'admin');
      if (admins.length === 1) {
        setMensaje('No se puede eliminar el único usuario administrador.');
        return;
      }
    }
    if (window.confirm('¿Está seguro que desea eliminar este usuario?')) {
      try {
  await axios.delete(`http://localhost:5000/api/auth/usuarios/${usuario._id}`);
        obtenerUsuarios();
      } catch (error) {
        setMensaje('Error al eliminar usuario');
      }
    }
  };

  return (
    <div className="bg-light min-vh-100">
      {/* Encabezado */}
      <div className="d-flex align-items-center justify-content-center px-4 py-3">
        <h3 className="fw-bold mb-0" style={{ color: '#1a237e' }}>Usuarios</h3>
      </div>

      {/* Botón Registrar */}
      <div className="container mt-4" style={{ maxWidth: 900 }}>
        <div className="d-flex justify-content-end mb-2">
          <button
            className="btn btn-primary d-flex align-items-center"
            onClick={() => {
              setFormulario({ nombre: '', email: '', contraseña: '', rol: 'compras' });
              setEditando(false);
              setUsuarioSeleccionado(null);
              setShowModal(true);
            }}
          >
            <FaUserPlus className="me-2" /> Registrar
          </button>
        </div>

        {/* Tabla de usuarios */}
        <div className="card shadow-sm">
          <div className="card-body">
            <table className="table table-bordered align-middle">
              <thead className="table-primary">
                <tr>
                  <th>Nombre</th>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario._id}>
                    <td>{usuario.nombre}</td>
                    <td>{usuario.usuario || usuario.email}</td>
                    <td>{usuario.rol}</td>
                    <td>
                      <label className="switch-ios">
                        <input
                          type="checkbox"
                          checked={usuario.activo}
                          onChange={() => handleToggleActivo(usuario)}
                        />
                        <span className="slider-ios"></span>
                      </label>
                      <FaEdit
                        className="ms-2"
                        style={{ color: '#1976d2', cursor: 'pointer', fontSize: '1.3rem', verticalAlign: 'middle' }}
                        title="Modificar"
                        onClick={() => handleEditarUsuario(usuario)}
                      />
                      <FaTrash
                        className="ms-2"
                        style={{ color: '#d32f2f', cursor: 'pointer', fontSize: '1.3rem', verticalAlign: 'middle' }}
                        title="Eliminar"
                        onClick={() => handleEliminarUsuario(usuario)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {usuarios.length === 0 && (
              <div className="text-center text-muted py-3">No hay usuarios registrados.</div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para registrar usuario */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">{editando ? 'Editar Usuario' : 'Registrar Usuario'}</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
                </div>
        <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nombre:</label>
                    <input type="text" name="nombre" className="form-control" value={formulario.nombre} onChange={handleChange} required />
                  </div>
                  <div className="mb-3">
          <label className="form-label">Usuario:</label>
          <input type="text" name="usuario" className="form-control" value={formulario.usuario} onChange={handleChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Contraseña:</label>
                    <input
                      type="password"
                      name="contraseña"
                      className="form-control"
                      value={formulario.contraseña}
                      onChange={handleChange}
                      required={!editando} // Solo requerido si NO estás editando
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Rol:</label>
          <select name="rol" className="form-select" value={formulario.rol} onChange={handleChange} disabled={editando && usuarioSeleccionado?.rol === 'admin'}>
                      <option value="admin">Administrador</option>
                      <option value="compras">Compras</option>
                      <option value="presupuesto">Presupuesto</option>
                      <option value="contabilidad">Contabilidad</option>
                      <option value="tesoreria">Tesorería</option>
                    </select>
                    {editando && usuarioSeleccionado?.rol === 'admin' && (
                      <div className="form-text">El rol del usuario administrador no puede cambiarse.</div>
                    )}
                  </div>
                  {mensaje && <div className="alert alert-info mt-2">{mensaje}</div>}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">{editando ? 'Guardar Cambios' : 'Registrar'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
