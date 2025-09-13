import React, { useRef, useState } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { FaTrash, FaPaperPlane } from 'react-icons/fa';
import '../../tabla-expedientes-compras.css';

const TablaExpedientes = ({
  camposTabla,
  rowsFiltrados,
  handleModificar,
  handleEliminar,
  handleAbrirTraslado,
  modalidad
}) => {
  const contenedorRef = useRef();
  const [panelInfo, setPanelInfo] = useState(null);

  const columns = React.useMemo(() => [
    ...camposTabla.map(col => ({
      accessorKey: col.name,
      header: col.label,
      cell: info => {
        // Formato quetzales para precio y monto total
        if (col.name === 'precio' || col.name === 'monto_total') {
          const value = parseFloat(info.getValue());
          if (!isNaN(value)) {
            return `Q ${value.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          }
          return '';
        }
        // Otros formatos existentes
        return col.type === 'checkbox'
          ? (info.getValue() ? '✔️' : (col.name === 'finalizado' ? '❌' : ''))
          : col.type === 'date'
            ? (info.getValue() ? new Date(info.getValue()).toLocaleDateString() : '')
            : info.getValue();
      }
    })),
    {
      accessorKey: 'areaActual',
      header: 'Área Actual',
      cell: info => info.getValue()
    },
    {
      accessorKey: 'fechaTraslado',
      header: 'Fecha Traslado',
      cell: info => {
        const row = info.row.original;
        let fecha = '';
        if (row.areaActual === 'PRESUPUESTO') fecha = row.fecha_traslado_presupuesto;
        else if (row.areaActual === 'CONTABILIDAD') fecha = row.fecha_traslado_contabilidad;
        else if (row.areaActual === 'TESORERIA') fecha = row.fecha_traslado_tesoreria;
        else if (row.areaActual === 'COMPRAS') fecha = row.fecha_traslado_compras;
        return fecha ? new Date(fecha).toLocaleDateString() : '';
      }
    },
    {
      accessorKey: 'acciones',
      header: 'Acciones',
      cell: info => {
        const row = info.row.original;
        
        // Determinar qué modalidad aplica
        const esBajaCuantia = modalidad === 'baja' || row.modalidad === 'BAJA CUANTÍA';
        const esCompraDirecta = modalidad === 'directa' || row.modalidad === 'COMPRA DIRECTA';
        
        return (
          <div className="acciones-fila">
            {/* Reglas para BAJA CUANTÍA */}
            {esBajaCuantia && (
              <>
                {/* Regla 1: Si está finalizado, mostrar solo botón enviar */}
                {row.finalizado === true && (
                  <button
                    onClick={() => handleAbrirTraslado(row)}
                    title="Trasladar"
                  >
                    <FaPaperPlane size={25} />
                  </button>
                )}
                {/* Regla 1: Si NO está finalizado, mostrar solo botón borrar */}
                {row.finalizado !== true && row.areaActual === 'COMPRAS' && (
                  <button
                    onClick={() => handleEliminar(row)}
                    title="Eliminar"
                  >
                    <FaTrash size={25} />
                  </button>
                )}
              </>
            )}
            
            {/* Reglas para COMPRA DIRECTA */}
            {esCompraDirecta && (
              <>
                {/* Solo mostrar botón enviar si el status es ADJUDICADO */}
                {row.finalizado === true && row.estatus_evento === 'ADJUDICADO' && (
                  <button
                    onClick={() => handleAbrirTraslado(row)}
                    title="Trasladar"
                  >
                    <FaPaperPlane size={25} />
                  </button>
                )}
                {row.areaActual === 'COMPRAS' && (
                  <button
                    onClick={() => handleEliminar(row)}
                    title="Eliminar"
                  >
                    <FaTrash size={25} />
                  </button>
                )}
              </>
            )}
            
            {/* Reglas para CONTRATO ABIERTO (mantener comportamiento similar a BAJA CUANTÍA) */}
            {!esBajaCuantia && !esCompraDirecta && (
              <>
                {row.finalizado === true && (
                  <button
                    onClick={() => handleAbrirTraslado(row)}
                    title="Trasladar"
                  >
                    <FaPaperPlane size={25} />
                  </button>
                )}
                {row.areaActual === 'COMPRAS' && (
                  <button
                    onClick={() => handleEliminar(row)}
                    title="Eliminar"
                  >
                    <FaTrash size={25} />
                  </button>
                )}
              </>
            )}
          </div>
        );
      }
    }
  ], [camposTabla, handleAbrirTraslado, handleEliminar, modalidad]);

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
    <div
      className="tabla-expedientes-externo"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        minHeight: 400
      }}
    >
      <div
        className="tabla-expedientes-contenedor"
        ref={contenedorRef}
        style={{
          flex: 1,
          transition: 'margin-right 0.3s',
          minWidth: 0
        }}
      >
        <table className="tabla-expedientes">
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
                <td colSpan={columns.length} className="tabla-expedientes-vacio">
                  No hay expedientes registrados.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => {
                const cells = row.getVisibleCells();
                let emptyCount = 0;
                cells.forEach(cell => {
                  if (cell.column.id !== 'acciones') {
                    const value = cell.getValue();
                    if (value === '' || value === null || value === undefined) emptyCount++;
                  }
                });
                let rowClass = '';
                if (row.original.finalizado === true) {
                  rowClass = 'fila-verde';
                } else if (emptyCount > 8) {
                  rowClass = 'fila-roja';
                } else if (emptyCount > 0 && emptyCount <= 8) {
                  rowClass = 'celda-amarilla';
                }
                // Doble click: solo funciona si NO es la primer columna
                const handleRowDoubleClick = (e) => {
                  // Si el doble click fue en la primer columna, no hacer nada
                  const cell = e.target.closest('td');
                  if (!cell) return;
                  const cellIndex = Array.from(cell.parentNode.children).indexOf(cell);
                  if (cellIndex === 0) return;
                  if (e.target.closest('.acciones-fila')) return;
                  if (handleModificar) handleModificar(row.original);
                };
                return (
                  <tr
                    key={row.id}
                    onDoubleClick={handleRowDoubleClick}
                    style={{ cursor: 'pointer' }}
                    onMouseLeave={() => setPanelInfo(null)}
                  >
                    {cells.map((cell, idx) => (
                      <td
                        key={cell.id}
                        className={idx === 0 ? rowClass : ''}
                        onClick={idx === 0 ? (e => {
                          e.stopPropagation();
                          setPanelInfo(row.original);
                        }) : undefined}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {/* Panel a la derecha, NO flotante */}
      {panelInfo && (
        <div
          style={{
            width: 'max(340px, 28vw)', // ancho flexible mínimo 340px, crece según pantalla
            minWidth: 340,
            maxWidth: 600,
            height: contenedorRef.current
              ? `${contenedorRef.current.offsetHeight}px`
              : 'auto', // igual al alto de la tabla
            background: '#fff',
            border: '2px solid #0a84fe',
            borderRadius: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            padding: 20,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            position: 'fixed',
            top: contenedorRef.current
              ? `${contenedorRef.current.getBoundingClientRect().top}px`
              : 20,
            right: 20,
            overflowY: 'auto',
            transition: 'right 0.3s'
          }}
          onMouseLeave={() => setPanelInfo(null)}
        >
          <div style={{ wordBreak: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }}>
            <b>Descripción del evento:</b> <br />{panelInfo.descripcion_evento || ''}
          </div>
          <div style={{ borderBottom: '1px solid #ccc', margin: '8px 0' }} />
          <div style={{ wordBreak: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }}>
            <b>Proveedor:</b> <br />{panelInfo.proveedor || ''}
          </div>
          <div style={{ borderBottom: '1px solid #ccc', margin: '8px 0' }} />
          <div><b>Renglón:</b> <br />{panelInfo.renglon || ''}</div>
          <div style={{ borderBottom: '1px solid #ccc', margin: '8px 0' }} />
          <div>
            <b>Monto Total:</b> <br />
            {panelInfo.monto_total && !isNaN(parseFloat(panelInfo.monto_total))
              ? `Q ${parseFloat(panelInfo.monto_total).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : ''}
          </div>
          <div style={{ borderBottom: '1px solid #ccc', margin: '8px 0' }} />
          <div><b>Área Actual:</b> <br />{panelInfo.areaActual || ''}</div>
        </div>
      )}
    </div>
  );
};

export default TablaExpedientes;