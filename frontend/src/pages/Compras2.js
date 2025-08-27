import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MODALIDADES = [
  { key: 'directa', label: 'COMPRA DIRECTA' },
  { key: 'abierto', label: 'CONTRATO ABIERTO' },
  { key: 'baja', label: 'BAJA CUANTÍA' }
];

const CAMPOS_MODALIDAD = {
  directa: [
    { name: 'no_identificacion', label: 'No', type: 'text' },
    { name: 'modalidad', label: 'Modalidad', type: 'text', disabled: true },
    { name: 'no_nog', label: 'NOG', type: 'text' },
    { name: 'fecha_publicacion', label: 'Fecha Publicación', type: 'date' },
    { name: 'estatus_evento', label: 'Estatus Evento', type: 'text' },
    { name: 'descripcion_evento', label: 'Descripción Evento', type: 'text' },
    { name: 'fecha_adjudicacion', label: 'Fecha Adjudicación', type: 'date' },
    { name: 'solicitud', label: 'No. Solicitud', type: 'text' },
    { name: 'no_oc', label: 'No. O.C', type: 'text' },
    { name: 'fecha_oc', label: 'Fecha O.C', type: 'date' },
    { name: 'nit_adjudicado', label: 'NIT Proveedor', type: 'text' },
    { name: 'proveedor', label: 'Nombre Proveedor', type: 'text' },
    { name: 'renglon', label: 'Renglón', type: 'text' },
    { name: 'codigo_insumo', label: 'Código Insumo', type: 'text' },
    { name: 'producto', label: 'Descripcion del Producto', type: 'text' },
    { name: 'presentacion_unidad', label: 'Presentación/Unidad', type: 'text' },
    { name: 'precio', label: 'Precio Unitario', type: 'number' },
    { name: 'cantidad_adjudicada', label: 'Cantidad Adjudicada', type: 'number' },
    { name: 'monto_total', label: 'Monto Total', type: 'number' },
    { name: 'factura_numero', label: 'No. Factura', type: 'text' },
    { name: 'factura_fecha', label: 'Fecha Factura', type: 'date' },
    { name: 'almacen_no_ingreso', label: 'No. Ingreso Almacén', type: 'text' },
    { name: 'almacen_fecha_ingreso', label: 'Fecha Ingreso Almacén', type: 'date' },
    { name: 'cur_numero', label: 'No. CUR', type: 'text' },
    { name: 'cur_fecha', label: 'Fecha CUR', type: 'date' },
    { name: 'registro_sanitario', label: 'Registro Sanitario', type: 'text' },
    { name: 'distrito', label: 'Distrito', type: 'text' },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea' },
    { name: 'finalizado', label: 'Finalizado', type: 'checkbox' }
  ],
  abierto: [
    { name: 'no', label: 'No', type: 'text' },
    { name: 'modalidad', label: 'Modalidad', type: 'text', disabled: true },
    { name: 'rubro', label: 'Rubro', type: 'text' },
    { name: 'no_nog', label: 'NOG', type: 'text' },
    { name: 'fecha_inicio', label: 'Fecha Inicio', type: 'date' },
    { name: 'fecha_vencimiento', label: 'Fecha Vencimiento', type: 'date' },
    { name: 'descripcion_evento', label: 'Descripción Evento', type: 'text' },
    { name: 'solicitud', label: 'Solicitud', type: 'text' },
    { name: 'no_oc', label: 'Orden de Compra', type: 'text' },
    { name: 'fecha_oc', label: 'Fecha OC', type: 'date' },
    { name: 'nit_adjudicado', label: 'NIT Adjudicado', type: 'text' },
    { name: 'proveedor', label: 'Nombre Proveedor', type: 'text' },
    { name: 'renglon', label: 'Renglón', type: 'text' },
    { name: 'codigo_insumo', label: 'Código Insumo', type: 'text' },
    { name: 'producto', label: 'Descripcion del Producto', type: 'text' },
    { name: 'presentacion_unidad', label: 'Presentación/Unidad', type: 'text' },
    { name: 'unidad_medida', label: 'Unidad de Medida', type: 'text' },
    { name: 'precio', label: 'Precio Unitario', type: 'number' },
    { name: 'cantidad_adjudicada', label: 'Cantidad Adjudicada', type: 'number' },
    { name: 'monto_total', label: 'Monto Total', type: 'number' },
    { name: 'factura_numero', label: 'No. Factura', type: 'text' },
    { name: 'factura_fecha', label: 'Fecha Factura', type: 'date' },
    { name: 'almacen_no_ingreso', label: 'No. Ingreso Almacén', type: 'text' },
    { name: 'almacen_fecha_ingreso', label: 'Fecha Ingreso Almacén', type: 'date' },
    { name: 'cur_numero', label: 'No. CUR', type: 'text' },
    { name: 'cur_fecha', label: 'Fecha CUR', type: 'date' },
    { name: 'realizado_por', label: 'Realizado Por', type: 'text' },
    { name: 'estado', label: 'Estado', type: 'text' },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea' },
    { name: 'finalizado', label: 'Finalizado', type: 'checkbox' }
  ],
  baja: [
    { name: 'no', label: 'No', type: 'text' },
    { name: 'modalidad', label: 'Modalidad', type: 'text', disabled: true },
    { name: 'npg', label: 'NPG', type: 'text' },
    { name: 'fecha_publicacion', label: 'Fecha Publicación', type: 'date' },
    { name: 'descripcion_evento', label: 'Descripción Evento', type: 'text' },
    { name: 'solicitud', label: 'Solicitud', type: 'text' },
    { name: 'no_oc', label: 'Orden de Compra', type: 'text' },
    { name: 'fecha_oc', label: 'Fecha OC', type: 'date' },
    { name: 'nit_adjudicado', label: 'NIT Proveedor', type: 'text' },
    { name: 'proveedor', label: 'Nombre Proveedor', type: 'text' },
    { name: 'renglon', label: 'Renglón', type: 'text' },
    { name: 'codigo_insumo', label: 'Código Insumo', type: 'text' },
    { name: 'producto', label: 'Descripcion del Producto', type: 'text' },
    { name: 'presentacion_unidad', label: 'Presentación/Unidad', type: 'text' },
    { name: 'precio', label: 'Precio Unitario', type: 'number' },
    { name: 'cantidad_adjudicada', label: 'Cantidad Adjudicada', type: 'number' },
    { name: 'monto_total', label: 'Monto Total', type: 'number' },
    { name: 'factura_numero', label: 'No. Factura', type: 'text' },
    { name: 'factura_fecha', label: 'Fecha Factura', type: 'date' },
    { name: 'almacen_no_ingreso', label: 'No. Ingreso Almacén', type: 'text' },
    { name: 'almacen_fecha_ingreso', label: 'Fecha Ingreso Almacén', type: 'date' },
    { name: 'cur_numero', label: 'No. CUR', type: 'text' },
    { name: 'cur_fecha', label: 'Fecha CUR', type: 'date' },
    { name: 'realizado_por', label: 'Realizado Por', type: 'text' },
    { name: 'no_acta', label: 'No. Acta', type: 'text' },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea' },
    { name: 'finalizado', label: 'Finalizado', type: 'checkbox' }
  ]
};

const COLUMNAS_TABLA = {
  directa: [
    ...CAMPOS_MODALIDAD.directa.filter(c => c.name !== 'observaciones'),
  ],
  abierto: [
    ...CAMPOS_MODALIDAD.abierto.filter(c => c.name !== 'no_acta' && c.name !== 'observaciones'),
  ],
  baja: [
    ...CAMPOS_MODALIDAD.baja.filter(c => c.name !== 'no_acta' && c.name !== 'observaciones'),
  ]
};

// Función para mostrar fechas como DD/MM/YYYY
function formatoFecha(fecha) {
  if (!fecha) return '';
  // Si ya viene como YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(fecha)) {
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }
  // Si viene como fecha ISO completa
  const d = new Date(fecha);
  if (!isNaN(d)) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return fecha;
}

const Compras = () => {
  const [modalidad, setModalidad] = useState('directa');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [rows, setRows] = useState([]);
  const [editando, setEditando] = useState(false);
  const [expedienteId, setExpedienteId] = useState(null);
  const [filtros, setFiltros] = useState({});
  const [hoveredRow, setHoveredRow] = useState(null);
  const [showReporte, setShowReporte] = useState(false);
  const [camposReporte, setCamposReporte] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExpedientes = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/expedientes');
        setRows(res.data.filter(exp => exp.modalidad === MODALIDADES.find(m => m.key === modalidad).label));
      } catch (err) {
        setRows([]);
      }
    };
    fetchExpedientes();
    setFiltros({});
  }, [modalidad, showModal]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    navigate('/');
  };

  const handleRegistrar = () => {
    setForm({});
    setMensaje('');
    setEditando(false);
    setExpedienteId(null);
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Si se está editando, el campo es "finalizado" y se marca como true
    if (
      editando &&
      name === 'finalizado' &&
      checked === true
    ) {
      // Llenar todos los campos vacíos (excepto finalizado y checkboxes) con "N/A"
      const nuevosCampos = { ...form };
      CAMPOS_MODALIDAD[modalidad].forEach(campo => {
        if (
          campo.name !== 'finalizado' &&
          campo.type !== 'checkbox' &&
          (nuevosCampos[campo.name] === undefined || nuevosCampos[campo.name] === null || nuevosCampos[campo.name] === '')
        ) {
          nuevosCampos[campo.name] = 'N/A';
        }
      });
      setForm({
        ...nuevosCampos,
        finalizado: true
      });
      return;
    }

    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');

    const camposRequeridos = CAMPOS_MODALIDAD[modalidad]
      .filter(campo => !campo.disabled && campo.type !== 'checkbox' && campo.type !== 'textarea');

    const formConVacio = { ...form };
    camposRequeridos.forEach(campo => {
      if (
        (campo.type === 'number' && (formConVacio[campo.name] === undefined || formConVacio[campo.name] === '')) ||
        (campo.type !== 'number' && (!formConVacio[campo.name] || formConVacio[campo.name].toString().trim() === ''))
      ) {
        formConVacio[campo.name] = campo.type === 'number' ? 0 : '';
      }
    });

    try {
      if (editando && expedienteId) {
        await axios.put(`http://localhost:5000/api/expedientes/${expedienteId}`, {
          ...formConVacio,
          modalidad: MODALIDADES.find(m => m.key === modalidad).label
        });
        setMensaje('Expediente actualizado exitosamente');
      } else {
        await axios.post('http://localhost:5000/api/expedientes', {
          ...formConVacio,
          modalidad: MODALIDADES.find(m => m.key === modalidad).label
        });
        setMensaje('Expediente registrado exitosamente');
      }
      setShowModal(false);
      setEditando(false);
      setExpedienteId(null);
    } catch (err) {
      setMensaje('Error al guardar expediente');
      if (err.response && err.response.data) {
        console.error('Respuesta del backend:', err.response.data);
      }
      console.error(err);
    }
  };

  const handleModificar = (row) => {
    setForm(row);
    setEditando(true);
    setExpedienteId(row._id);
    setShowModal(true);
  };

  const handleEliminar = async (row) => {
    if (window.confirm('¿Está seguro que desea eliminar este expediente?')) {
      try {
        await axios.delete(`http://localhost:5000/api/expedientes/${row._id}`);
        setRows(prevRows => prevRows.filter(r => r._id !== row._id));
      } catch (err) {
        alert('Error al eliminar el expediente');
        console.error(err);
      }
    }
  };

  const handleCerrarModal = () => {
    setShowModal(false);
    setEditando(false);
    setExpedienteId(null);
    setForm({});
  };

  const renderFiltros = () => (
    <div className="px-4 py-3 bg-light border-bottom">
      {modalidad === 'directa' && (
        <div className="row g-2">
          <div className="col">
            <input className="form-control" placeholder="Estado del Evento" value={filtros.estado_evento || ''} onChange={e => setFiltros(f => ({ ...f, estado_evento: e.target.value }))} />
          </div>
          <div className="col">
            <input className="form-control" placeholder="NIT Proveedor" value={filtros.nit_adjudicado || ''} onChange={e => setFiltros(f => ({ ...f, nit_adjudicado: e.target.value }))} />
          </div>
          <div className="col">
            <input className="form-control" placeholder="No. NOG" value={filtros.no_nog || ''} onChange={e => setFiltros(f => ({ ...f, no_nog: e.target.value }))} />
          </div>
          <div className="col">
            <input className="form-control" placeholder="No. Identificación" value={filtros.no_identificacion || ''} onChange={e => setFiltros(f => ({ ...f, no_identificacion: e.target.value }))} />
          </div>
          <div className="col">
            <input className="form-control" placeholder="Renglón" value={filtros.renglon || ''} onChange={e => setFiltros(f => ({ ...f, renglon: e.target.value }))} />
          </div>
          <div className="col">
            <select className="form-select" value={filtros.finalizado || ''} onChange={e => setFiltros(f => ({ ...f, finalizado: e.target.value }))}>
              <option value="">Finalizado?</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>
      )}
      {(modalidad === 'abierto' || modalidad === 'baja') && (
        <div className="row g-2">
          <div className="col">
            <input className="form-control" placeholder="NIT Proveedor" value={filtros.nit_adjudicado || ''} onChange={e => setFiltros(f => ({ ...f, nit_adjudicado: e.target.value }))} />
          </div>
          <div className="col">
            <input className="form-control" placeholder="No. NOG" value={filtros.no_nog || ''} onChange={e => setFiltros(f => ({ ...f, no_nog: e.target.value }))} />
          </div>
          <div className="col">
            <input className="form-control" placeholder="Renglón" value={filtros.renglon || ''} onChange={e => setFiltros(f => ({ ...f, renglon: e.target.value }))} />
          </div>
          <div className="col">
            <select className="form-select" value={filtros.finalizado || ''} onChange={e => setFiltros(f => ({ ...f, finalizado: e.target.value }))}>
              <option value="">Finalido</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );

  const rowsFiltrados = rows.filter(row => {
    if (modalidad === 'directa') {
      if (filtros.estado_evento && !row.estatus_evento?.toLowerCase().includes(filtros.estado_evento.toLowerCase())) return false;
      if (filtros.nit_adjudicado && !row.nit_adjudicado?.toLowerCase().includes(filtros.nit_adjudicado.toLowerCase())) return false;
      if (filtros.no_nog && !row.no_nog?.toLowerCase().includes(filtros.no_nog.toLowerCase())) return false;
      if (filtros.no_identificacion && !row.no_identificacion?.toLowerCase().includes(filtros.no_identificacion.toLowerCase())) return false;
      if (filtros.renglon && !row.renglon?.toLowerCase().includes(filtros.renglon.toLowerCase())) return false;
      if (filtros.finalizado !== undefined && filtros.finalizado !== '' && String(row.finalizado) !== filtros.finalizado) return false;
    }
    if (modalidad === 'abierto' || modalidad === 'baja') {
      if (filtros.nit_adjudicado && !row.nit_adjudicado?.toLowerCase().includes(filtros.nit_adjudicado.toLowerCase())) return false;
      if (filtros.no_nog && !row.no_nog?.toLowerCase().includes(filtros.no_nog.toLowerCase())) return false;
      if (filtros.renglon && !row.renglon?.toLowerCase().includes(filtros.renglon.toLowerCase())) return false;
      if (filtros.finalizado !== undefined && filtros.finalizado !== '' && String(row.finalizado) !== filtros.finalizado) return false;
    }
    return true;
  });

  const camposTabla = COLUMNAS_TABLA[modalidad];

  // Abre el modal de reporte con todos los campos seleccionados por defecto
  const handleReporte = () => {
    setCamposReporte(camposTabla.map(c => c.name));
    setShowReporte(true);
  };

  const handleCampoReporteChange = (campo) => {
    setCamposReporte(prev =>
      prev.includes(campo)
        ? prev.filter(c => c !== campo)
        : [...prev, campo]
    );
  };

  const handleCerrarReporte = () => setShowReporte(false);

  const handleGenerarReporte = () => {
    // Aquí puedes generar el reporte con los campos seleccionados
    // Por ahora solo cierra el modal
    setShowReporte(false);
    // Puedes agregar lógica para exportar aquí
  };

  const handleExportExcel = () => {
    const campos = camposTabla.filter(c => camposReporte.includes(c.name));
    const modalidadLabel = MODALIDADES.find(m => m.key === modalidad).label;
    const fechaReporte = new Date();
    const fechaStr = fechaReporte.toLocaleDateString('es-ES');
    const horaStr = fechaReporte.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    // Datos de la tabla
    const data = rowsFiltrados.map(row =>
      Object.fromEntries(
        campos.map(campo => [
          campo.label,
          campo.type === 'date'
            ? formatoFecha(row[campo.name])
            : campo.type === 'checkbox'
                ? (row[campo.name] ? '✔️' : (campo.name === 'finalizado' ? '❌' : ''))
              : row[campo.name]
        ])
      )
    );

    // Título y fecha en la primera fila
    const titulo = [`REPORTE DE ${modalidadLabel}`];
    const fecha = [`Generado el: ${fechaStr} ${horaStr}`];
    const headers = [campos.map(campo => campo.label)];
    const body = data.map(row => campos.map(campo => row[campo.label]));

    // Construir la hoja con título, fecha y tabla
    const hoja = [
      titulo,
      fecha,
      [],
      ...headers,
      ...body
    ];

    const ws = XLSX.utils.aoa_to_sheet(hoja);

    // Ajustar ancho de columnas: 50 para las descripciones, auto para el resto
    ws['!cols'] = campos.map(campo => {
      if (
        campo.label.toLowerCase().includes('descripción evento') ||
        campo.label.toLowerCase().includes('descripcion del producto')
      ) {
        return { wch: 50 };
      }
      return {
        wch: Math.max(
          campo.label.length + 2,
          ...body.map(row => (row[campos.findIndex(c => c.label === campo.label)] || '').toString().length + 2)
        )
      };
    });

    // Opcional: poner bordes a la tabla (solo celdas de la tabla, no título/fecha)
    const startRow = 3; // la tabla empieza en la fila 4 (índice 3)
    for (let r = startRow; r < hoja.length; r++) {
      for (let c = 0; c < campos.length; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        if (!ws[cellRef]) continue;
        ws[cellRef].s = {
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');

    // Nombre del archivo con modalidad y fecha
    const nombreArchivo = `Reporte_${modalidadLabel.replace(/\s+/g, '_')}_${fechaReporte.toISOString().slice(0,10)}.xlsx`;

    // Para aplicar estilos necesitas XLSX-style o SheetJS Pro, pero el ajuste de ancho sí funciona con la versión gratuita.
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), nombreArchivo);
  };

  const handleExportPDF = () => {
    const campos = camposTabla.filter(c => camposReporte.includes(c.name));
    const modalidadLabel = MODALIDADES.find(m => m.key === modalidad).label;
    const fechaReporte = new Date();
    const fechaStr = fechaReporte.toLocaleDateString('es-ES');
    const horaStr = fechaReporte.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    const doc = new jsPDF('l', 'pt', 'a4');
    // Título
    doc.setFontSize(16);
    doc.text(`REPORTE DE ${modalidadLabel}`, 40, 40);
    doc.setFontSize(10);
    doc.text(`Generado el: ${fechaStr} ${horaStr}`, 40, 60);

    const columns = campos.map(campo => ({ header: campo.label, dataKey: campo.name }));
    const data = rowsFiltrados.map(row => {
      const obj = {};
      campos.forEach(campo => {
        obj[campo.name] =
          campo.type === 'date'
            ? formatoFecha(row[campo.name])
            : campo.type === 'checkbox'
              ? (row[campo.name] ? '✔️' : (campo.name === 'finalizado' ? '❌' : ''))
              : row[campo.name];
      });
      return obj;
    });
    autoTable(doc, {
      columns,
      body: data,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [40, 40, 40] },
      margin: { top: 80, left: 20, right: 20 }
    });

    // Nombre del archivo con modalidad y fecha
    const nombreArchivo = `Reporte_${modalidadLabel.replace(/\s+/g, '_')}_${fechaReporte.toISOString().slice(0,10)}.pdf`;
    doc.save(nombreArchivo);
  };

  return (
    <div className="bg-white min-vh-100">
      {/* Encabezado con pestañas y cerrar sesión */}
      <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom bg-primary">
        <ul className="nav nav-tabs border-0">
          {MODALIDADES.map(m => (
            <li className="nav-item" key={m.key}>
              <button
                className={`nav-link text-uppercase fw-bold ${modalidad === m.key ? 'active text-primary bg-white' : 'text-white bg-primary'}`}
                style={{ border: 'none', borderRadius: '0.5rem 0.5rem 0 0' }}
                onClick={() => setModalidad(m.key)}
              >
                {m.label}
              </button>
            </li>
          ))}
        </ul>
        <button className="btn btn-outline-light d-flex align-items-center" onClick={handleLogout}>
          <FaSignOutAlt className="me-2" /> Cerrar Sesión
        </button>
      </div>

      {/* Botón Registrar */}
      <div className="px-4 py-3 bg-white border-bottom">
        <button className="btn btn-primary fw-bold me-2" onClick={handleRegistrar}>
          <FaPlus className="me-2" /> REGISTRAR
        </button>
        <button className="btn btn-secondary fw-bold" onClick={handleReporte}>
          📄 REPORTES
        </button>
      </div>

      {/* Filtros */}
      {renderFiltros()}

      {/* Modal de registro/edición */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">
                    {editando ? 'Editar Expediente' : 'Registrar Expediente'} ({MODALIDADES.find(m => m.key === modalidad).label})
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={handleCerrarModal}></button>
                </div>
                <div className="modal-body">
                  {CAMPOS_MODALIDAD[modalidad].map(campo => {
                    const camposGrandes = ['descripcion_evento', 'proveedor', 'producto', 'distrito'];
                    const esGrande = camposGrandes.includes(campo.name);
                    const valorCampo = form[campo.name] || '';
                    const claseVacio = editando && campo.type !== 'checkbox' && campo.type !== 'textarea' && valorCampo === '' ? 'input-vacio' : '';

                    return (
                      <div className="mb-3" key={campo.name}>
                        <label className="form-label">{campo.label}</label>
                        {campo.type === 'textarea' ? (
                          <textarea
                            className={esGrande ? `form-control ${claseVacio}` : `form-control form-control-sm ${claseVacio}`}
                            name={campo.name}
                            value={valorCampo}
                            onChange={handleChange}
                            disabled={campo.disabled}
                          />
                        ) : campo.type === 'checkbox' ? (
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              name={campo.name}
                              checked={!!form[campo.name]}
                              onChange={handleChange}
                              disabled={campo.disabled}
                            />
                            <label className="form-check-label">{campo.label}</label>
                          </div>
                        ) : (
                          <input
                            className={esGrande ? `form-control ${claseVacio}` : `form-control form-control-sm ${claseVacio}`}
                            type={campo.type}
                            name={campo.name}
                            value={valorCampo}
                            onChange={handleChange}
                            disabled={campo.disabled}
                          />
                        )}
                      </div>
                    );
                  })}
                  {mensaje && <div className="alert alert-info">{mensaje}</div>}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCerrarModal}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para seleccionar campos del reporte */}
      {showReporte && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <form onSubmit={e => { e.preventDefault(); handleGenerarReporte(); }}>
                <div className="modal-header bg-secondary text-white">
                  <h5 className="modal-title">Selecciona los campos para el reporte</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={handleCerrarReporte}></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    {[0, 1, 2].map(colIdx => (
                      <div className="col" key={colIdx}>
                        {camposTabla
                          .filter((_, idx) => idx % 3 === colIdx)
                          .map(campo => (
                            <div className="form-check" key={campo.name}>
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`campo-reporte-${campo.name}`}
                                checked={camposReporte.includes(campo.name)}
                                onChange={() => handleCampoReporteChange(campo.name)}
                              />
                              <label className="form-check-label" htmlFor={`campo-reporte-${campo.name}`}>
                                {campo.label}
                              </label>
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                  <div className="modal-footer justify-content-end gap-2">
                    <button type="button" className="btn btn-success" onClick={handleExportExcel}>
                        Exportar Excel
                    </button>
                    <button type="button" className="btn btn-danger" onClick={handleExportPDF}>
                        Exportar PDF
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={handleCerrarReporte}>
                        Cancelar
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tabla dinámica */}
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
                {/* Primera columna sticky */}
                <th className="text-nowrap sticky-col-left">
                  {camposTabla[0].label}
                </th>
                {/* Columnas intermedias */}
                {camposTabla.slice(1).map((col) => (
                  <th key={col.name} className="text-nowrap">
                    {col.label}
                  </th>
                ))}
                {/* Última columna sticky */}
                <th className="text-nowrap sticky-col-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {rowsFiltrados && rowsFiltrados.length > 0 ? rowsFiltrados.map((row, idx) => {
                const isHovered = hoveredRow === (row._id || idx);
                // Cuenta cuántas celdas vacías hay (excepto la primera y la última)
                const vacias = camposTabla.slice(1, -1).filter(col => {
                  const valor = row[col.name];
                  return valor === undefined || valor === null || valor === '';
                }).length;
                let colorColumna = '';
                if (vacias >= 8) colorColumna = 'columna-roja';
                else if (vacias > 0) colorColumna = 'columna-amarilla';

                return (
                  <tr
                    key={row._id || idx}
                    onMouseEnter={() => setHoveredRow(row._id || idx)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    {/* Primera columna sticky, aplica clase según cantidad de vacías */}
                    <td className={`text-nowrap sticky-col-left ${colorColumna}`}>
                      {camposTabla[0].type === 'checkbox'
                        ? (row[camposTabla[0].name] ? '✔️' : '')
                        : row[camposTabla[0].name]}
                    </td>
                    {/* Columnas intermedias y finalizado */}
                    {camposTabla.slice(1).map((col, colIdx) => {
                      const valor = row[col.name];
                      const vacio = (valor === undefined || valor === null || valor === '');
                      const isFirst = colIdx === 0;
                      const isLast = colIdx === camposTabla.slice(1).length - 1;
                      return (
                        <td
                          key={col.name}
                          className={`text-nowrap${(!isFirst && !isLast && vacio) ? ' celda-vacia' : ''}${col.name === 'finalizado' ? '' : ''}`}
                          style={col.name === 'finalizado' && !valor ? { color: '#d32f2f', fontWeight: 'bold', fontSize: '1em', textAlign: 'left' } : {}}
                        >
                          {col.type === 'checkbox'
                            ? (valor ? '✔️' : (col.name === 'finalizado' ? '❌' : ''))
                            : col.type === 'date'
                              ? formatoFecha(valor)
                              : valor}
                        </td>
                      );
                    })}
                    {/* Última columna sticky */}
                    <td className="sticky-col-right">
                      {isHovered && (
                        <>
                          <button
                            className="btn btn-sm btn-outline-primary d-flex align-items-center w-100 mb-2"
                            onClick={() => handleModificar(row)}
                          >
                            <FaEdit className="me-2" /> Modificar
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger d-flex align-items-center w-100"
                            onClick={() => handleEliminar(row)}
                          >
                            <FaTrash className="me-2" /> Eliminar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={camposTabla.length + 1} className="text-center text-muted">No hay expedientes registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Compras;