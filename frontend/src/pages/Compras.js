import React, { useState, useEffect } from 'react';
  import { useNavigate } from 'react-router-dom';
  import { FaSignOutAlt, FaPlus, FaSearch } from 'react-icons/fa';
  import 'bootstrap/dist/css/bootstrap.min.css';
  import axios from 'axios';
  // XLSX no longer used; Excel export via exceljs with dynamic import
  import jsPDF from 'jspdf';
  import autoTable from 'jspdf-autotable';
  import logo from '../img/mspas.png';
  import '../compras.css';
  

  import { MODALIDADES, CAMPOS_MODALIDAD, COLUMNAS_TABLA } from '../utils/constantes';
  import Filtros from '../components/components_pag_compras/Filtros';
  import ModalExpediente from '../components/components_pag_compras/ModalExpediente';
  import ModalReporte from '../components/components_pag_compras/ModalReporte';
  import TablaExpedientes from '../components/components_pag_compras/TablaExpedientes';
  import ModalTraslado from '../components/ModalTraslado';

  const Compras = () => {
  const navigate = useNavigate();

  // Protección por rol
  useEffect(() => {
    const rol = localStorage.getItem('rol');
    if (rol !== 'compras') {
      navigate('/'); // Redirige al login si no es el rol de compras
    }
  }, [navigate]);

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
  const allSelected = camposReporte.length > 0 && COLUMNAS_TABLA[modalidad]?.every(c => camposReporte.includes(c.name));
    const [showTraslado, setShowTraslado] = useState(false);
    const [showMensaje, setShowMensaje] = useState(false);
    const [expedienteTraslado, setExpedienteTraslado] = useState(null);
  // Buscador general
  const [busqueda, setBusqueda] = useState("");

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
          setShowMensaje(true); 
          setShowModal(false);
          setEditando(false);
          setExpedienteId(null);
        } else {
          await axios.post('http://localhost:5000/api/expedientes', {
            ...form,
            modalidad: MODALIDADES.find(m => m.key === modalidad).label
          });
          setMensaje('¡Expediente Guardado! Puedes seguir agregando.');
          setShowMensaje(true);
          
          // Limpiar todos los campos del formulario después de guardar
          const formLimpio = {};
          CAMPOS_MODALIDAD[modalidad].forEach(campo => {
            if (campo.type === 'checkbox') {
              formLimpio[campo.name] = false;
            } else if (campo.type === 'number') {
              formLimpio[campo.name] = '';
            } else {
              formLimpio[campo.name] = '';
            }
          });
          // Mantener la modalidad seleccionada
          formLimpio.modalidad = MODALIDADES.find(m => m.key === modalidad).label;
          setForm(formLimpio);
        }
      } catch (err) {
        setMensaje('Error al guardar expediente');
        setShowMensaje(true); 
        if (err.response && err.response.data) {
          console.error('Respuesta del backend:', err.response.data);
        }
        console.error(err);
      }
    };

    const handleModificar = (row) => {
      // Suponiendo que expediente es el objeto a editar
      const expedienteEdit = { ...row };
      Object.keys(expedienteEdit).forEach(key => {
        if (key.includes('fecha') && expedienteEdit[key]) {
          expedienteEdit[key] = expedienteEdit[key].slice(0, 10);
        }
      });
      setForm(expedienteEdit);
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

    // Filtra por modalidad, filtros y búsqueda solo en descripción del producto
    const rowsFiltrados = rows.filter(row => {
      if (row.modalidad !== MODALIDADES.find(m => m.key === modalidad).label) return false;
      const finalizadoFiltro = filtros.finalizado;
      // Filtros específicos
      if (modalidad === 'directa') { 
        if (filtros.estado_evento && !row.estatus_evento?.toLowerCase().includes(filtros.estado_evento.toLowerCase())) return false;
        if (filtros.nit_adjudicado && !row.nit_adjudicado?.toLowerCase().includes(filtros.nit_adjudicado.toLowerCase())) return false;
        if (filtros.no_nog && !row.no_nog?.toLowerCase().includes(filtros.no_nog.toLowerCase())) return false;
        if (filtros.no_identificacion && !row.no_identificacion?.toLowerCase().includes(filtros.no_identificacion.toLowerCase())) return false;
        if (filtros.renglon && !row.renglon?.toLowerCase().includes(filtros.renglon.toLowerCase())) return false;
        if (filtros.solicitud && !row.solicitud?.toLowerCase().includes(filtros.solicitud.toLowerCase())) return false;
        if (filtros.no_oc && !row.no_oc?.toLowerCase().includes(filtros.no_oc.toLowerCase())) return false;
        if (filtros.areaActual && row.areaActual && row.areaActual !== filtros.areaActual) return false;
        if (finalizadoFiltro !== undefined && finalizadoFiltro !== '') {
          const valorFinalizado = Boolean(row.finalizado);
          if (valorFinalizado !== (finalizadoFiltro === 'true')) return false;
        }
      }
      if (modalidad === 'abierto') {
        if (filtros.nit_adjudicado && !row.nit_adjudicado?.toLowerCase().includes(filtros.nit_adjudicado.toLowerCase())) return false;
        if (filtros.no_nog && !row.no_nog?.toLowerCase().includes(filtros.no_nog.toLowerCase())) return false;
        if (filtros.renglon && !row.renglon?.toLowerCase().includes(filtros.renglon.toLowerCase())) return false;
        if (filtros.solicitud && !row.solicitud?.toLowerCase().includes(filtros.solicitud.toLowerCase())) return false;
        if (filtros.no_oc && !row.no_oc?.toLowerCase().includes(filtros.no_oc.toLowerCase())) return false;
        if (filtros.areaActual && row.areaActual && row.areaActual !== filtros.areaActual) return false;
        if (finalizadoFiltro !== undefined && finalizadoFiltro !== '') {
          const valorFinalizado = Boolean(row.finalizado);
          if (valorFinalizado !== (finalizadoFiltro === 'true')) return false;
        }
      }
      if (modalidad === 'baja') {
        if (filtros.nit_adjudicado && !row.nit_adjudicado?.toLowerCase().includes(filtros.nit_adjudicado.toLowerCase())) return false;
        if (filtros.npg && !row.npg?.toLowerCase().includes(filtros.npg.toLowerCase())) return false;
        if (filtros.renglon && !row.renglon?.toLowerCase().includes(filtros.renglon.toLowerCase())) return false;
        if (filtros.solicitud && !row.solicitud?.toLowerCase().includes(filtros.solicitud.toLowerCase())) return false;
        if (filtros.no_oc && !row.no_oc?.toLowerCase().includes(filtros.no_oc.toLowerCase())) return false;
        if (filtros.areaActual && row.areaActual && row.areaActual !== filtros.areaActual) return false;
        if (finalizadoFiltro !== undefined && finalizadoFiltro !== '') {
          const valorFinalizado = Boolean(row.finalizado);
          if (valorFinalizado !== (finalizadoFiltro === 'true')) return false;
        }
      }
      // Búsqueda solo en descripción del producto (campo 'producto')
      if (busqueda.trim() !== "") {
        const texto = busqueda.trim().toLowerCase();
        if (!(row['producto'] || "").toString().toLowerCase().includes(texto)) return false;
      }
      return true;
    });

    const camposTabla = COLUMNAS_TABLA[modalidad];

    // Helper: formatea fecha ISO/Date a dd/mm/yyyy
    const fmtFecha = (val) => {
      if (!val) return '';
      const d = new Date(val);
      if (isNaN(d.getTime())) return val;
      const dd = String(d.getDate()).padStart(2,'0');
      const mm = String(d.getMonth()+1).padStart(2,'0');
      const yy = d.getFullYear();
      return `${dd}/${mm}/${yy}`;
    };

    const guessPdfFormat = (colCount) => {
      if (colCount > 18) return 'a2';
      if (colCount > 13) return 'a3';
      return 'a4';
    };

    const getColumnStyles = (campos) => {
      const styles = {};
      campos.forEach(c => {
        const n = c.name.toLowerCase();
        const lbl = (c.label || '').toLowerCase();
        const base = { cellWidth: 'wrap' };
        if (/descripcion|descripción/.test(n) || /descripcion|descripción/.test(lbl)) styles[c.name] = { ...base, minCellWidth: 140 };
        else if (/proveedor|nombre/.test(n) || /proveedor|nombre/.test(lbl)) styles[c.name] = { ...base, minCellWidth: 120 };
        else if (/renglon|renglón|codigo|insumo/.test(n)) styles[c.name] = { ...base, minCellWidth: 70 };
        else if (/modalidad/.test(n)) styles[c.name] = { ...base, minCellWidth: 90 };
        else if (/distrito/.test(n)) styles[c.name] = { ...base, minCellWidth: 60 };
        else if (/precio|monto|cantidad/.test(n)) styles[c.name] = { ...base, minCellWidth: 70, halign: 'right' };
        else if (/fecha|_oc$|_ingreso/.test(n)) styles[c.name] = { ...base, minCellWidth: 75 };
        else if (/cur|pagado|finalizado/.test(n)) styles[c.name] = { ...base, minCellWidth: 60 };
        else if (/nog|npg|no_|^no$/.test(n)) styles[c.name] = { ...base, minCellWidth: 70, halign: 'center' };
        else styles[c.name] = { ...base, minCellWidth: 80 };
      });
      return styles;
    };

    const abbreviateHeader = (text) => {
      let t = String(text || '');
      t = t.replace(/Número/gi, 'No.');
      t = t.replace(/Descripción/gi, 'Desc.');
      t = t.replace(/Proveedor/gi, 'Prov.');
      t = t.replace(/Cantidad/gi, 'Cant.');
      t = t.replace(/Unidad/gi, 'Und.');
      t = t.replace(/Precio Unitario/gi, 'Precio U.');
      t = t.replace(/Monto Total/gi, 'Monto');
      t = t.replace(/Ingreso Almacén/gi, 'Ing. Almacén');
      t = t.replace(/Fecha/gi, 'F.');
      return t;
    };

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

    const handleToggleSeleccionTodos = () => {
      if (allSelected) {
        setCamposReporte([]);
      } else {
        setCamposReporte(camposTabla.map(c => c.name));
      }
    };

    const onModalidadFiltroChange = (key) => {
      // Cambia la modalidad del reporte (reutiliza tabs actuales)
      setCamposReporte([]);
      setShowReporte(false);
      // Cambiamos modalidad de la página también, para mantener consistencia
      setModalidad(key);
      // Reabrimos luego de un tick con campos por defecto
      setTimeout(() => {
        setCamposReporte(COLUMNAS_TABLA[key].map(c => c.name));
        setShowReporte(true);
      }, 0);
    };

    // Exportar Excel y PDF  
    const handleExportExcel = async () => {
      if (!camposReporte || camposReporte.length === 0) {
        alert('Selecciona al menos un campo para exportar.');
        return;
      }
      // Usaremos exceljs (build de navegador) para mejor estilo
      const ExcelJSImport = await import('exceljs/dist/exceljs.min.js');
      const ExcelJS = ExcelJSImport?.default || ExcelJSImport;
      const fileSaverMod = await import('file-saver');
      const saveAs = (fileSaverMod && (fileSaverMod.saveAs || fileSaverMod.default)) ? (fileSaverMod.saveAs || fileSaverMod.default) : null;
      if (!saveAs) {
        alert('No se pudo cargar el módulo de guardado de archivos.');
        return;
      }
      const campos = camposTabla.filter(c => camposReporte.includes(c.name));
      const modalidadLabel = MODALIDADES.find(m => m.key === modalidad).label;
      const fechaReporte = new Date();
      const fechaStr = fechaReporte.toLocaleDateString();
      const horaStr = fechaReporte.toLocaleTimeString();

      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Reporte');

      // Título
      ws.mergeCells('A1', String.fromCharCode(65 + campos.length - 1) + '1');
      ws.getCell('A1').value = `REPORTE DE ${modalidadLabel}`;
      ws.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF0D47A1' } };
      ws.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' };

      ws.mergeCells('A2', String.fromCharCode(65 + campos.length - 1) + '2');
      ws.getCell('A2').value = `Generado el: ${fechaStr} ${horaStr}`;
      ws.getCell('A2').font = { size: 10, color: { argb: 'FF374151' } };

      // Encabezados
      ws.addRow([]);
      const headerRow = ws.addRow(campos.map(c => c.label));
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      headerRow.height = 22;
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E88E5' } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });

      // Datos
      rowsFiltrados.forEach(row => {
        const values = campos.map(c => {
          const raw = row[c.name];
          // Booleanos como SI/NO
          if (typeof raw === 'boolean' || c.type === 'checkbox' || /pagado|finalizado/i.test(c.name)) {
            return raw === true ? 'SI' : raw === false ? 'NO' : '';
          }
          // Si el campo en constantes es de tipo fecha, o si el nombre sugiere fecha, formatear
          if (c.type === 'date' || /fecha|fecha_|_fecha|_oc$|_ingreso/i.test(c.name)) {
            return fmtFecha(raw);
          }
          return raw ?? '';
        });
        const dataRow = ws.addRow(values);
        dataRow.alignment = { vertical: 'top' };
        dataRow.eachCell((cell, colNumber) => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          if (typeof cell.value === 'string' && cell.value.length > 60) {
            cell.alignment = { wrapText: true };
          }
          if (cell.value === null || cell.value === undefined) {
            cell.value = '';
          }
        });
      });

      // Anchos automáticos
      campos.forEach((c, i) => {
        const maxLen = Math.max(
          c.label.length,
          ...rowsFiltrados.map(r => (r[c.name] ? String(r[c.name]).length : 0))
        );
        ws.getColumn(i + 1).width = Math.min(Math.max(maxLen + 4, 12), 60);
      });

      const nombreArchivo = `Reporte_${modalidadLabel.replace(/\s+/g, '_')}_${fechaReporte.toISOString().slice(0,10)}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nombreArchivo);
    };
    
    const handleExportPDF = () => {
      if (!camposReporte || camposReporte.length === 0) {
        alert('Selecciona al menos un campo para exportar.');
        return;
      }
    const campos = camposTabla.filter(c => camposReporte.includes(c.name));
    const format = guessPdfFormat(campos.length);
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format });
      const modalidadLabel = MODALIDADES.find(m => m.key === modalidad).label;
      const fechaReporte = new Date();
      const fechaStr = fechaReporte.toLocaleDateString();
      const horaStr = fechaReporte.toLocaleTimeString();

      doc.setFontSize(16);
      doc.text(`REPORTE DE ${modalidadLabel}`, 40, 36);
      doc.setFontSize(10);
      doc.text(`Generado el: ${fechaStr} ${horaStr}`, 40, 54);

      const columnas = campos.map(c => ({ header: c.label, dataKey: c.name }));
      const filas = rowsFiltrados.map(row => {
        const obj = {};
        campos.forEach(c => {
          const raw = row[c.name];
          if (typeof raw === 'boolean' || c.type === 'checkbox' || /pagado|finalizado/i.test(c.name)) {
            obj[c.name] = raw === true ? 'SI' : raw === false ? 'NO' : '';
          } else if (c.type === 'date' || /fecha|fecha_|_fecha|_oc$|_ingreso/i.test(c.name)) {
            obj[c.name] = fmtFecha(raw);
          } else {
            obj[c.name] = raw ?? '';
          }
        });
        return obj;
      });

      autoTable(doc, {
        columns: columnas,
        body: filas,
        startY: 70,
  styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak', valign: 'top' },
        headStyles: { fillColor: [30, 136, 229], textColor: 255, fontSize: 8, valign: 'middle' },
        columnStyles: getColumnStyles(campos),
        alternateRowStyles: { fillColor: [245, 247, 250] },
  tableWidth: 'auto',
  margin: { left: 40, right: 40 },
        didParseCell: (data) => {
          if (data.section === 'head') {
            data.cell.text = [abbreviateHeader(data.cell.raw)];
          }
        },
        didDrawPage: (data) => {
          // Pie de página con número de página
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(9);
          doc.text(`Página ${data.pageNumber} de ${pageCount}`, doc.internal.pageSize.getWidth() - 80, doc.internal.pageSize.getHeight() - 20);
        },
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
        <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom compras-header">
          <ul className="nav nav-tabs border-0">
            {MODALIDADES.map(m => (
              <li className="nav-item" key={m.key}>
                <button
                  className={`nav-link text-uppercase fw-bold compras-header ${modalidad === m.key ? 'active text-primary bg-white' : 'text-white compras-header'}`}
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
            <h4 className="mb-0 fw-bold titulo-azul-marino me-3">UNIDAD DE COMPRAS</h4>
            <div className="input-group" style={{ width: 320 }}>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar producto"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{ borderRight: 0 }}
              />
              <span className="input-group-text bg-white" style={{ borderLeft: 0 }}>
                <FaSearch />
              </span>
            </div>
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
          showMensaje={showMensaje}
          setShowMensaje={setShowMensaje}
          handleChange={handleChange}
        />

        {/* Modal para seleccionar campos del reporte */}
        <ModalReporte
          show={showReporte}
          onClose={handleCerrarReporte}
          camposTabla={camposTabla}
          camposReporte={camposReporte}
          handleCampoReporteChange={handleCampoReporteChange}
          handleToggleSeleccionTodos={handleToggleSeleccionTodos}
          allSelected={allSelected}
          modalidad={modalidad}
          onModalidadFiltroChange={onModalidadFiltroChange}
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
          modalidad={modalidad}
        />
      </div>
    );
  };

  export default Compras;