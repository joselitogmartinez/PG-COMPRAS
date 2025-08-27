import React from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { FaTrash, FaPaperPlane } from 'react-icons/fa';

const TablaExpedientes = ({
  camposTabla,
  rowsFiltrados,
  handleModificar,
  handleEliminar,
  handleAbrirTraslado
}) => {
  // Define columns for TanStack Table
  const columns = React.useMemo(() => [
    ...camposTabla.map(col => ({
      accessorKey: col.name,
      header: col.label,
      cell: info => col.type === 'checkbox'
        ? (info.getValue() ? '✔️' : (col.name === 'finalizado' ? '❌' : ''))
        : col.type === 'date'
          ? (info.getValue() ? new Date(info.getValue()).toLocaleDateString() : '')
          : info.getValue()
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
        if (row.areaActual === 'presupuesto') fecha = row.fecha_traslado_presupuesto;
        else if (row.areaActual === 'contabilidad') fecha = row.fecha_traslado_contabilidad;
        else if (row.areaActual === 'tesoreria') fecha = row.fecha_traslado_tesoreria;
        else if (row.areaActual === 'compras') fecha = row.fecha_traslado_compras;
        return fecha ? new Date(fecha).toLocaleDateString() : '';
      }
    },
    {
      accessorKey: 'acciones',
      header: 'Acciones',
      cell: info => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1976d2' }}
            onClick={() => handleAbrirTraslado(info.row.original)}
            title="Trasladar"
          >
            <FaPaperPlane size={18} />
          </button>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d32f2f' }}
            onClick={() => handleEliminar(info.row.original)}
            title="Eliminar"
          >
            <FaTrash size={18} />
          </button>
        </div>
      )
    }
  ], [camposTabla, handleAbrirTraslado, handleEliminar]);

  // Prepare data for TanStack Table
  const data = React.useMemo(
    () => rowsFiltrados.map((row, idx) => ({ ...row, id: row._id || idx })),
    [rowsFiltrados]
  );

  // Create table instance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div
      style={{
        width: '100%',
        height: 'calc(100vh - 260px)', // Aumenta el valor a 260px o más si es necesario
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        boxSizing: 'border-box',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        background: '#f5f5f5',
        marginTop: '1rem',
        overflow: 'hidden',
        maxHeight: 'calc(100vh - 260px)'
      }}
    >
      <div
        style={{
          width: '100%', // cambiado de 100vw a 100% para evitar overflow horizontal
          height: '100%',
          overflow: 'auto', // este div tendrá los scrolls
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          padding: '0rem',
          position: 'relative'
          // eliminado minHeight para que se ajuste automáticamente
        }}
      >
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          minWidth: '1200px', // aumenta el mínimo para más columnas
          marginLeft: '0',
          marginRight: '0'
        }}>
          <thead style={{ background: '#e3f2fd', position: 'sticky', top: 0, zIndex: 20 }}>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, idx) => (
                  <th
                    key={header.id}
                    style={{
                      padding: '8px',
                      borderBottom: '2px solid #90caf9',
                      textAlign: 'left',
                      background: '#e3f2fd',
                      zIndex: (idx === 0 || idx === headerGroup.headers.length - 1) ? 21 : 20,
                      minWidth: '120px',
                      position: (idx === 0) ? 'sticky' : (idx === headerGroup.headers.length - 1 ? 'sticky' : 'static'),
                      left: (idx === 0) ? 0 : undefined,
                      right: (idx === headerGroup.headers.length - 1 ? 0 : undefined),
                      boxShadow: (idx === 0) ? '2px 0 8px -2px #ccc' : (idx === headerGroup.headers.length - 1 ? '-2px 0 8px -2px #ccc' : undefined)
                    }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', color: '#888', padding: '16px' }}>
                  No hay expedientes registrados.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} style={{ cursor: 'pointer' }} onDoubleClick={() => handleModificar(row.original)}>
                  {row.getVisibleCells().map((cell, idx) => (
                    <td
                      key={cell.id}
                      style={{
                        padding: '8px',
                        borderBottom: '1px solid #eee',
                        background: '#fff',
                        zIndex: (idx === 0 || idx === row.getVisibleCells().length - 1) ? 9 : 0,
                        minWidth: '120px',
                        position: (idx === 0) ? 'sticky' : (idx === row.getVisibleCells().length - 1 ? 'sticky' : 'static'),
                        left: (idx === 0) ? 0 : undefined,
                        right: (idx === row.getVisibleCells().length - 1 ? 0 : undefined),
                        boxShadow: (idx === 0) ? '2px 0 8px -2px #ccc' : (idx === row.getVisibleCells().length - 1 ? '-2px 0 8px -2px #ccc' : undefined)
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablaExpedientes;