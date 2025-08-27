import React from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { formatoFecha } from '../../utils/constantes';

const TablaExpedientesPresupuesto = ({
  camposTabla,
  rowsFiltrados,
  hoveredRow,
  setHoveredRow,
  handleModificar,
  handleEliminar,
  handleAbrirTraslado,
  handleAbrirCurModal
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
              const isHovered = hoveredRow === (row._id || idx);
              const vacias = camposTabla.filter(col => {
                const valor = row[col.name];
                return valor === undefined || valor === null || valor === '';
              }).length;

              // Si cur_aprobado está vacío, la primer celda debe ser roja
              const curAprobadoVacio = !row.cur_aprobado || row.cur_aprobado === '';
              let primeraCeldaClase = '';
              if (curAprobadoVacio) {
                primeraCeldaClase = 'celda-roja';
              } else if (vacias >= 8) {
                primeraCeldaClase = 'celda-roja';
              } else if (vacias > 0) {
                primeraCeldaClase = 'celda-amarilla';
              }

              // Determina la fecha de traslado según el área actual
              let fechaTraslado = '';
              if (row.areaActual === 'presupuesto') fechaTraslado = row.fecha_traslado_presupuesto;
              else if (row.areaActual === 'contabilidad') fechaTraslado = row.fecha_traslado_contabilidad;
              else if (row.areaActual === 'tesoreria') fechaTraslado = row.fecha_traslado_tesoreria;

              return (
                <tr
                  key={row._id || idx}
                  onMouseEnter={() => setHoveredRow(row._id || idx)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{ cursor: 'pointer' }}
                  onClick={e => {
                    const isButton = e.target.closest('button');
                    if (!isButton) handleAbrirCurModal(row);
                  }}
                >
                  {camposTabla.map((col, colIdx) => {
                    const valor = row[col.name];
                    if (col.name === 'cur_aprobado') {
                      return (
                        <td
                          key={col.name}
                          className={(!valor ? 'celda-roja ' : '') + 'text-nowrap'}
                        >
                          {valor}
                        </td>
                      );
                    }
                    if (colIdx === 0) {
                      return (
                        <td
                          key={col.name}
                          className={`sticky-col-left text-nowrap ${primeraCeldaClase}`}
                        >
                          {col.type === 'checkbox'
                            ? (valor ? '✔️' : (col.name === 'finalizado' ? '❌' : ''))
                            : col.type === 'date'
                              ? formatoFecha(valor)
                              : valor}
                        </td>
                      );
                    }
                    return (
                      <td
                        key={col.name}
                        className={valor === undefined || valor === null || valor === '' ? 'celda-vacia-roja' : ''}
                      >
                        {col.type === 'checkbox'
                          ? (valor ? '✔️' : (col.name === 'finalizado' ? '❌' : ''))
                          : col.type === 'date'
                            ? formatoFecha(valor)
                            : valor}
                      </td>
                    );
                  })}
                  <td className="text-nowrap">{row.areaActual || ''}</td>
                  <td className="text-nowrap">
                    {fechaTraslado ? formatoFecha(fechaTraslado) : ''}
                  </td>
                  <td className="sticky-col-right">
                    {isHovered && (
                      <>
                        <button
                          className="btn btn-sm btn-outline-primary d-flex align-items-center w-100 mb-2"
                          onClick={e => {
                            e.stopPropagation();
                            handleAbrirTraslado(row);
                          }}
                        >
                          <FaEdit className="me-2" /> TRASLADAR
                        </button>
                        {handleEliminar &&
                          <button
                            className="btn btn-sm btn-outline-danger d-flex align-items-center w-100"
                            onClick={e => {
                              e.stopPropagation();
                              handleEliminar(row);
                            }}
                          >
                            <FaTrash className="me-2" /> Eliminar
                          </button>
                        }
                      </>
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

export default TablaExpedientesPresupuesto;