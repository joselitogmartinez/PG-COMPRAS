import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CAMPOS_MODALIDAD } from '../utils/constantes'; // Ajusta la ruta si es necesario

const AREAS = ['compras', 'presupuesto', 'contabilidad', 'tesoreria'];

const Dashboard = () => {
  const [expedientes, setExpedientes] = useState([]);
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState(null);

  useEffect(() => {
    const fetchExpedientes = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/expedientes');
        setExpedientes(res.data);
      } catch (err) {
        setExpedientes([]);
      }
    };
    fetchExpedientes();
  }, []);

  // Agrupa los expedientes por área actual
  const expedientesPorArea = AREAS.reduce((acc, area) => {
    acc[area] = expedientes.filter(e => e.areaActual === area);
    return acc;
  }, {});

  // Obtiene el key de modalidad (ajusta según tu estructura)
  const getModalidadKey = (exp) => {
    if (exp.modalidad_key) return exp.modalidad_key;
    if (!exp.modalidad) return 'directa';
    const modalidad = exp.modalidad.toLowerCase();
    if (modalidad.includes('directa')) return 'directa';
    if (modalidad.includes('abierto')) return 'abierto';
    if (modalidad.includes('baja')) return 'baja';
    return 'directa';
  };

  return (
    <section className="dashboard-content">
      <h2>EXPEDIENTES COMPRAS DDRISS JALAPA</h2>

      <div className="dashboard-columns-header">
        <div className="canvas-title">Compras</div>
        <div className="canvas-title">Presupuesto</div>
        <div className="canvas-title">Contabilidad</div>
        <div className="canvas-title">Tesorería</div>
      </div>

      <div className="dashboard-canvas">
        {AREAS.map(area => (
          <div className={`canvas-section ${area}`} key={area}>
            {expedientesPorArea[area] && expedientesPorArea[area].length > 0 ? (
              expedientesPorArea[area].map(exp => (
                <div
                  className="canvas-row"
                  key={exp._id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setExpedienteSeleccionado(exp)}
                >
                  <strong>No:</strong> {exp.no_identificacion} <br />
                  <strong>Descripción:</strong> {exp.descripcion_evento} <br />
                  <strong>Cantidad Total:</strong> {exp.cantidad_adjudicada}
                </div>
              ))
            ) : (
              <div className="canvas-row text-muted">Sin expedientes</div>
            )}
          </div>
        ))}
      </div>

      {/* Panel flotante checklist */}
      {expedienteSeleccionado && (
        <div
          style={{
            position: 'fixed',
            top: 60,
            right: 10,
            width: 260,
            background: '#fff',
            border: '1px solid #1976d2',
            borderRadius: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            zIndex: 1000,
            padding: 12,
            fontSize: '0.85rem',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-1">
            <strong style={{ fontSize: '1rem' }}>Checklist</strong>
            <button className="btn-close btn-sm" style={{ fontSize: '0.8rem' }} onClick={() => setExpedienteSeleccionado(null)} />
          </div>
          <div style={{ fontSize: '0.85rem', marginBottom: 6 }}>
            <strong>Modalidad:</strong> {expedienteSeleccionado.modalidad || 'N/A'}
          </div>
          {/* Checklist en dos columnas */}
          <div style={{ display: 'flex', gap: 8 }}>
            {(() => {
              const campos = CAMPOS_MODALIDAD[getModalidadKey(expedienteSeleccionado)] || [];
              const mitad = Math.ceil(campos.length / 2);
              const col1 = campos.slice(0, mitad);
              const col2 = campos.slice(mitad);
              return (
                <>
                  <ul className="list-unstyled mt-1 mb-0" style={{ flex: 1 }}>
                    {col1.map(campo => (
                      <li key={campo.name} className="mb-1" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>
                        {expedienteSeleccionado[campo.name]
                          ? <span style={{ color: 'green', fontSize: '1.1em' }}>✔</span>
                          : <span style={{ color: 'red', fontSize: '1.1em' }}>✘</span>
                        }
                        <span className="ms-2">{campo.label}</span>
                      </li>
                    ))}
                  </ul>
                  <ul className="list-unstyled mt-1 mb-0" style={{ flex: 1 }}>
                    {col2.map(campo => (
                      <li key={campo.name} className="mb-1" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>
                        {expedienteSeleccionado[campo.name]
                          ? <span style={{ color: 'green', fontSize: '1.1em' }}>✔</span>
                          : <span style={{ color: 'red', fontSize: '1.1em' }}>✘</span>
                        }
                        <span className="ms-2">{campo.label}</span>
                      </li>
                    ))}
                  </ul>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </section>
  );
};

export default Dashboard;