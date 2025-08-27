import React from 'react';
import { FaTrash, FaPaperPlane } from 'react-icons/fa'; // Cambia FaEdit por FaPaperPlane
import { formatoFecha } from '../../utils/constantes';

const TablaExpedientes = ({
  camposTabla,
  rowsFiltrados,
  hoveredRow,
  setHoveredRow,
  handleModificar,
  handleEliminar,
  handleAbrirTraslado
}) => {
  if (!camposTabla || camposTabla.length === 0) {
    return <div className="px-4 py-4">No hay columnas para mostrar.</div>;
  }

  return (
    <div className="px-4 py-4">
      <div
        className="table-responsive"
        style={{
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          maxHeight: '60vh',
          overflowY: 'auto'
        }}
      >
        <table className="table table-hover table-bordered">
          <thead className="table-primary">
            <tr>
              {camposTabla.map((col, idx) => (
                <th
                  key={col.name}
                  className={idx === 0 ? 'sticky-col-left' : 'text-nowrap'}
                >
                  {col.label}
                </th>
              ))}
              <th className="text-nowrap">Área Actual</th>
              <th className="text-nowrap">Fecha Traslado</th>
              <th className="text-nowrap sticky-col-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {rowsFiltrados && rowsFiltrados.length > 0 ? rowsFiltrados.map((row, idx) => {
              const rowKey = row._id || idx;
              const isHovered = hoveredRow === rowKey;

              // Calcula vacias correctamente aquí
              const vacias = camposTabla.filter(col => {
                const valor = row[col.name];
                return valor === undefined || valor === null || valor === '';
              }).length;

              let primeraCeldaClase = '';
              if (vacias >= 8) primeraCeldaClase = 'celda-roja';
              else if (vacias > 0) primeraCeldaClase = 'celda-amarilla';

              // Determina la fecha de traslado según el área actual
              let fechaTraslado = '';
              if (row.areaActual === 'presupuesto') fechaTraslado = row.fecha_traslado_presupuesto;
              else if (row.areaActual === 'contabilidad') fechaTraslado = row.fecha_traslado_contabilidad;
              else if (row.areaActual === 'tesoreria') fechaTraslado = row.fecha_traslado_tesoreria;
              else if (row.areaActual === 'compras') fechaTraslado = row.fecha_traslado_compras;

              return (
                <tr key={rowKey} style={{ cursor: 'pointer' }}>
                  {camposTabla.map((col, colIdx) => {
                    const valor = row[col.name];
                    return (
                      <td
                        key={col.name}
                        className={colIdx === 0 ? `sticky-col-left text-nowrap ${primeraCeldaClase}` : (valor === undefined || valor === null || valor === '' ? 'celda-vacia-roja' : '')}
                        onMouseMove={e => {
                          const rect = e.target.getBoundingClientRect();
                          const offsetY = e.clientY - rect.top;
                          // Si el mouse está en el 10% superior o inferior de la celda, NO hace nada (borde)
                          if (offsetY < rect.height * 0.1 || offsetY > rect.height * 0.9) {
                            setHoveredRow(null);
                            return;
                          }
                          setHoveredRow(rowKey);
                        }}
                        onMouseLeave={() => setHoveredRow(null)}
                        onDoubleClick={e => {
                          if (e.target.cellIndex === camposTabla.length + 2) return;
                          handleModificar(row);
                        }}
                        style={{
                          background: isHovered ? '#f2f2f2' : 'transparent',
                          fontWeight: isHovered ? 'bold' : 'normal'
                        }}
                      >
                        {col.type === 'checkbox'
                          ? (valor ? '✔️' : (col.name === 'finalizado' ? '❌' : ''))
                          : col.type === 'date'
                            ? formatoFecha(valor)
                            : valor}
                      </td>
                    );
                  })}
                  <td
                    className="text-nowrap"
                    onMouseMove={e => {
                      const rect = e.target.getBoundingClientRect();
                      const offsetY = e.clientY - rect.top;
                      if (offsetY < rect.height * 0.1 || offsetY > rect.height * 0.9) {
                        setHoveredRow(null);
                        return;
                      }
                      setHoveredRow(rowKey);
                    }}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      background: isHovered ? '#f2f2f2' : 'transparent',
                      fontWeight: isHovered ? 'bold' : 'normal'
                    }}
                  >
                    {row.areaActual || ''}
                  </td>
                  <td
                    className="text-nowrap"
                    onMouseMove={e => {
                      const rect = e.target.getBoundingClientRect();
                      const offsetY = e.clientY - rect.top;
                      if (offsetY < rect.height * 0.1 || offsetY > rect.height * 0.9) {
                        setHoveredRow(null);
                        return;
                      }
                      setHoveredRow(rowKey);
                    }}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      background: isHovered ? '#f2f2f2' : 'transparent',
                      fontWeight: isHovered ? 'bold' : 'normal'
                    }}
                  >
                    {fechaTraslado ? formatoFecha(fechaTraslado) : ''}
                  </td>
                  <td className="sticky-col-right"
                    onMouseMove={e => {
                      const rect = e.target.getBoundingClientRect();
                      const offsetY = e.clientY - rect.top;
                      if (offsetY < rect.height * 0.1 || offsetY > rect.height * 0.9) {
                        setHoveredRow(null);
                        return;
                      }
                      setHoveredRow(rowKey);
                    }}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      background: isHovered ? '#f2f2f2' : 'transparent'
                    }}
                  >
                    {isHovered && (
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={() => handleAbrirTraslado(row)}
                          title="Trasladar"
                        >
                          <FaPaperPlane size={18} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={() => handleEliminar(row)}
                          title="Eliminar"
                        >
                          <FaTrash size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={camposTabla.length + 3} className="text-center text-muted">No hay expedientes registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablaExpedientes;