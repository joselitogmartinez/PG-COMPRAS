import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AREAS = ['compras', 'presupuesto', 'contabilidad', 'tesoreria'];

const Dashboard = () => {
  const [expedientes, setExpedientes] = useState([]);

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
                <div className="canvas-row" key={exp._id}>
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
    </section>
  );
};

export default Dashboard;