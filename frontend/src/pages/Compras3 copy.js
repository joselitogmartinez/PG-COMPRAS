import React, { useState, useEffect } from 'react';
  import { useNavigate } from 'react-router-dom';
  import { FaSignOutAlt, FaPlus } from 'react-icons/fa';
  import 'bootstrap/dist/css/bootstrap.min.css';
  import axios from 'axios';
  import * as XLSX from 'xlsx';
  import { saveAs } from 'file-saver';
  import jsPDF from 'jspdf';
  import autoTable from 'jspdf-autotable';
  import logo from '../img/mspas.png';

  import { MODALIDADES, CAMPOS_MODALIDAD, COLUMNAS_TABLA } from '../utils/constantes';
  import Filtros from '../components/components_pag_compras/Filtros';
  import ModalExpediente from '../components/components_pag_compras/ModalExpediente';
  import ModalReporte from '../components/components_pag_compras/ModalReporte';
  import TablaExpedientes from '../components/components_pag_compras/TablaExpedientes';
  import ModalTraslado from '../components/ModalTraslado';

  const Compras = () => {
    const [modalidad, setModalidad] = useState('directa'); // <-- debe ser la key
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
    const [showTraslado, setShowTraslado] = useState(false);
    const [expedienteTraslado, setExpedienteTraslado] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
      const fetchExpedientes = async () => {
        try {
          const res = await axios.get('http://localhost:5000/api/expedientes');
          setRows(res.data); // Carga todos los expedientes
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
      if (
        editando &&
        name === 'finalizado' &&
        checked === true
      ) {
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
      try {
        if (editando && expedienteId) {
          await axios.put(`http://localhost:5000/api/expedientes/${expedienteId}`, {
            ...form,
            modalidad: MODALIDADES.find(m => m.key === modalidad).label
          });
          setMensaje('Expediente actualizado exitosamente');
          setShowModal(false);
          setEditando(false);
          setExpedienteId(null);
        } else {
          await axios.post('http://localhost:5000/api/expedientes', {
            ...form,
            modalidad: MODALIDADES.find(m => m.key === modalidad).label
          });
          setMensaje('Expediente registrado exitosamente. Puedes seguir agregando.');
          setTimeout(() => setMensaje(''), 1200);
        }
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
      setMensaje('');
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

    // Filtra por modalidad y otros filtros
    const rowsFiltrados = rows.filter(row => {
      if (row.modalidad !== MODALIDADES.find(m => m.key === modalidad).label) return false;

      const finalizadoFiltro = filtros.finalizado;

      if (modalidad === 'directa') { // <-- key, no label
        if (filtros.estado_evento && !row.estatus_evento?.toLowerCase().includes(filtros.estado_evento.toLowerCase())) return false;
        if (filtros.nit_adjudicado && !row.nit_adjudicado?.toLowerCase().includes(filtros.nit_adjudicado.toLowerCase())) return false;
        if (filtros.no_nog && !row.no_nog?.toLowerCase().includes(filtros.no_nog.toLowerCase())) return false;
        if (filtros.no_identificacion && !row.no_identificacion?.toLowerCase().includes(filtros.no_identificacion.toLowerCase())) return false;
        if (filtros.renglon && !row.renglon?.toLowerCase().includes(filtros.renglon.toLowerCase())) return false;
        if (filtros.areaActual && row.areaActual !== filtros.areaActual) return false;
        if (finalizadoFiltro !== undefined && finalizadoFiltro !== '') {
          const valorFinalizado = Boolean(row.finalizado);
          if (valorFinalizado !== (finalizadoFiltro === 'true')) return false;
        }
      }
      if (modalidad === 'abierto' || modalidad === 'baja') { // <-- key, no label
        if (filtros.nit_adjudicado && !row.nit_adjudicado?.toLowerCase().includes(filtros.nit_adjudicado.toLowerCase())) return false;
        if (filtros.no_nog && !row.no_nog?.toLowerCase().includes(filtros.no_nog.toLowerCase())) return false;
        if (filtros.renglon && !row.renglon?.toLowerCase().includes(filtros.renglon.toLowerCase())) return false;
        if (finalizadoFiltro !== undefined && finalizadoFiltro !== '') {
          const valorFinalizado = Boolean(row.finalizado);
          if (valorFinalizado !== (finalizadoFiltro === 'true')) return false;
        }
      }
      return true;
    });

    const camposTabla = COLUMNAS_TABLA[modalidad];

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

    // Exportar Excel y PDF  
    const handleExportExcel = () => {
      const campos = camposTabla.filter(c => camposReporte.includes(c.name));
      const data = rowsFiltrados.map(row =>
        campos.reduce((acc, campo) => {
          acc[campo.label] = row[campo.name];
          return acc;
        }, {})
      );

      const modalidadLabel = MODALIDADES.find(m => m.key === modalidad).label;
      const fechaReporte = new Date();
      const fechaStr = fechaReporte.toLocaleDateString();
      const horaStr = fechaReporte.toLocaleTimeString();

      const titulo = [`REPORTE DE ${modalidadLabel}`];
      const fecha = [`Generado el: ${fechaStr} ${horaStr}`];
      const headers = [campos.map(campo => campo.label)];
      const body = data.map(row => campos.map(campo => row[campo.label]));

      const hoja = [
        titulo,
        fecha,
        [],
        ...headers,
        ...body
      ];

      const ws = XLSX.utils.aoa_to_sheet(hoja);

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

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
      const nombreArchivo = `Reporte_${modalidadLabel.replace(/\s+/g, '_')}_${fechaReporte.toISOString().slice(0,10)}.xlsx`;
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), nombreArchivo);
    };
    
    const handleExportPDF = () => {
      const doc = new jsPDF('l');
      const modalidadLabel = MODALIDADES.find(m => m.key === modalidad).label;
      const fechaReporte = new Date();
      const fechaStr = fechaReporte.toLocaleDateString();
      const horaStr = fechaReporte.toLocaleTimeString();

      doc.setFontSize(16);
      doc.text(`REPORTE DE ${modalidadLabel}`, 14, 14);
      doc.setFontSize(10);
      doc.text(`Generado el: ${fechaStr} ${horaStr}`, 14, 22);

      const columnas = camposTabla.filter(c => camposReporte.includes(c.name)).map(c => c.label);
      const filas = rowsFiltrados.map(row =>
        camposReporte.map(campo => row[campo])
      );

      autoTable(doc, {
        head: [columnas],
        body: filas,
        startY: 28,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      });

      const nombreArchivo = `Reporte_${modalidadLabel.replace(/\s+/g, '_')}_${fechaReporte.toISOString().slice(0,10)}.pdf`;
      doc.save(nombreArchivo);
    };

    const handleTrasladar = async (area) => {
      if (!expedienteTraslado) return;
      try {
        const res = await axios.put(
          `http://localhost:5000/api/expedientes/trasladar/${expedienteTraslado._id}`,
          { area }
        );
        setRows(rows => rows.map(r => r._id === res.data._id ? res.data : r));
        setShowTraslado(false);
        setExpedienteTraslado(null);
      } catch (err) {
        alert('Error al trasladar expediente');
      }
    };

    const handleAbrirTraslado = (expediente) => {
      setExpedienteTraslado(expediente);
      setShowTraslado(true);
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
          <ModalTraslado
            show={showTraslado}
            onClose={() => setShowTraslado(false)}
            onTrasladar={handleTrasladar}
          />
        </div>

        {/* Botón Registrar y Reportes */}
        <div className="px-4 py-0 bg-white border-bottom d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <img
              src={logo}
              alt="Logo"
              style={{ height: '100px', width: 'auto', marginRight: 'px', objectFit: 'contain' }}
            />
            <h4 className="mb-0 fw-bold titulo-azul-marino">UNIDAD DE COMPRAS</h4>
          </div>
          <div>
            <button className="btn btn-primary fw-bold me-3 btn-lg px-4 py-1" onClick={handleRegistrar}>
              <FaPlus className="me-2" /> REGISTRAR
            </button>
            <button className="btn btn-secondary fw-bold btn-lg px-4 py-1" onClick={handleReporte}>
              📄 REPORTES
            </button>
          </div>
        </div>

        {/* Filtros */}
        <Filtros modalidad={modalidad} filtros={filtros} setFiltros={setFiltros} />

        {/* Modal de registro/edición */}
        <ModalExpediente
          show={showModal}
          onClose={handleCerrarModal}
          onSubmit={handleSubmit}
          form={form}
          setForm={setForm}
          modalidad={modalidad}
          editando={editando}
          mensaje={mensaje}
          handleChange={handleChange}
        />

        {/* Modal para seleccionar campos del reporte */}
        <ModalReporte
          show={showReporte}
          onClose={handleCerrarReporte}
          camposTabla={camposTabla}
          camposReporte={camposReporte}
          handleCampoReporteChange={handleCampoReporteChange}
          handleExportExcel={handleExportExcel}
          handleExportPDF={handleExportPDF}
        />

        {/* Tabla dinámica */}
        <TablaExpedientes
          camposTabla={camposTabla}
          rowsFiltrados={rowsFiltrados}
          hoveredRow={hoveredRow}
          setHoveredRow={setHoveredRow}
          handleModificar={handleModificar}
          handleEliminar={handleEliminar}
          handleAbrirTraslado={handleAbrirTraslado}
        />
      </div>
    );
  };

  export default Compras;