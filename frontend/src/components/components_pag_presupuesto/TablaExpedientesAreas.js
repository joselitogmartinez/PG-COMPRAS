import React, { useRef } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { FaPaperPlane } from 'react-icons/fa';
import '../../tabla-expedientes-presupuesto.css';

// Componente generalizado para cualquier área
const TablaExpedientesAreas = ({
  camposTabla,
  rowsFiltrados,
  handleModificar,
  handleEliminar,
  handleAbrirTraslado,
  handleAbrirCurModal,
  extraField, // { name: 'cur_devengado', label: 'CUR Devengado' }
  onRowDoubleClick
}) => {
  const contenedorRef = useRef();
  const columns = React.useMemo(() => {
    let baseCols = [...camposTabla];
    // Si estamos en Tesorería y extraField es cur_devengado, insertarlo antes de los campos de pago
    if (extraField && extraField.name === 'cur_devengado') {
      // Buscar el índice del primer campo de pago
      const pagoIdx = baseCols.findIndex(col => col.name === 'pagado');
      if (pagoIdx !== -1) {
        baseCols.splice(pagoIdx, 0, extraField);
      } else {
        baseCols.push(extraField);
      }
    } else if (extraField) {  
      baseCols.push(extraField);
    }
    return [
      ...baseCols.map(col => ({
        accessorKey: col.name,
        header: col.label,
        cell: info => {
          // Lógica especial para el campo "No" - detectar automáticamente cuál usar
          if (col.name === 'no_identificacion' && col.label === 'No') {
            const row = info.row.original;
            // Para COMPRA DIRECTA usar no_identificacion, para otros usar no
            if (row.modalidad === 'COMPRA DIRECTA') {
              return row.no_identificacion || '';
            } else {
              return row.no || '';
            }
          }
          if (col.name === 'pagado') {
            return info.getValue() ? 'Sí' : 'No';
          }
          if (col.name === 'tipo_pago') {
            // Mostrar el tipo de pago tal como está guardado (ya debe venir en mayúsculas y con número si es cheque)
            const val = info.getValue();
            if (!val) return '';
            return val.toString().toUpperCase();
          }
          if (col.name === 'fecha_pago') {
            const val = info.getValue();  
            if (!val) return '';
            const date = new Date(val);
            return !isNaN(date) ? date.toLocaleDateString() : '';
          }
          return info.getValue();
        }
      })),
      {
        accessorKey: 'acciones',
        header: 'Acciones',
        cell: info => {
          const row = info.row.original;
          const puedeEnviarTesoreria = row.areaActual === 'TESORERIA' && row.pagado === false;
          const puedeEnviarPresupuesto = row.areaActual === 'PRESUPUESTO' && !!row.cur_aprobado;
          const puedeEnviarContabilidad = row.areaActual === 'CONTABILIDAD' && !!row.cur_devengado;
          return (
            <div className="acciones-fila">
              {(puedeEnviarTesoreria || puedeEnviarPresupuesto || puedeEnviarContabilidad) && (
                <button
                  onClick={() => handleAbrirTraslado(row)}
                  title="Enviar"
                >
                  <FaPaperPlane size={25} />
                </button>
              )}
            </div>
          );
        }
      }
    ];
  }, [camposTabla, handleAbrirTraslado, extraField]);

  const data = React.useMemo(
    () => rowsFiltrados.map((row, idx) => ({ ...row, id: row._id || idx })),
    [rowsFiltrados]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="tabla-expedientes-presupuesto-externo" style={{ position: 'relative' }}>
      <div className="tabla-expedientes-presupuesto-contenedor" ref={contenedorRef}>
        <table className="tabla-expedientes-presupuesto">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center text-muted">No hay expedientes registrados.</td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => {
                const cells = row.getVisibleCells();
                return (
                  <tr
                    key={row.id}
                    onClick={e => {
                      const isButton = e.target.closest('button');
                      // Solo abrir CUR Devengado si NO estamos en Tesorería
                      if (!isButton && handleAbrirCurModal && row.original.areaActual !== 'TESORERIA') handleAbrirCurModal(row.original);
                    }}
                    onDoubleClick={e => {
                      const isButton = e.target.closest('button');
                      if (!isButton && typeof (onRowDoubleClick) === 'function') onRowDoubleClick(row.original);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {cells.map((cell, idx) => {
                      let extraClass = '';
                      if (idx === 0 && row.original.areaActual === 'TESORERIA') {
                        if (row.original.pagado === true) {
                          extraClass = 'celda-verde-cur';
                        } else if (row.original.pagado === false) {
                          extraClass = 'celda-roja-cur';
                        }
                      }
                      if (idx === 0 && row.original.areaActual === 'PRESUPUESTO') {
                        if (row.original.cur_aprobado && row.original.cur_aprobado !== '') {
                          extraClass = 'celda-verde-cur';
                        } else {
                          extraClass = 'celda-roja-cur';
                        }
                      }
                      return (
                        <td key={cell.id} className={extraClass}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablaExpedientesAreas;
