import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { MODALIDADES, COLUMNAS_TABLA } from '../utils/constantes';
import ModalReporte from '../components/components_pag_compras/ModalReporte';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useLocation, useNavigate } from 'react-router-dom';
import '../dashboard.css';
import '../styles/modalExpediente.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AREAS = ['compras', 'presupuesto', 'contabilidad', 'tesoreria'];

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expedientes, setExpedientes] = useState([]);
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState(null);
  const [filtroModalidad, setFiltroModalidad] = useState('directa');
  const [filtroEstatus, setFiltroEstatus] = useState(''); // 'EN PROCESO', 'ADJUDICADO', 'NO ADJUDICADO', 'PRESCINDIDO', 'DESIERTO' o ''
  const [tipoBusqueda, setTipoBusqueda] = useState('nog');
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [filtroPago, setFiltroPago] = useState(''); // 'pagados', 'no_pagados', o ''
  const [showReporte, setShowReporte] = useState(false);
  const [camposReporte, setCamposReporte] = useState([]);

  // Función helper para obtener la clave de modalidad
  const getModalidadKey = (exp) => {
    if (exp.modalidad_key) return exp.modalidad_key;
    if (!exp.modalidad) return 'directa';
    const modalidad = exp.modalidad.toLowerCase();
    if (modalidad.includes('directa')) return 'directa';
    if (modalidad.includes('abierto')) return 'abierto';
    if (modalidad.includes('baja')) return 'baja';
    return 'directa';
  };

  useEffect(() => {
    let mounted = true;
  const fetchExpedientes = async () => {
      try {
  const res = await axios.get('http://localhost:5000/api/expedientes');
        if (mounted) setExpedientes(res.data);
      } catch (err) {
        if (mounted) setExpedientes([]);
      }
    };
    // carga inicial
    fetchExpedientes();
    // polling cada 10s
    const intervalId = setInterval(fetchExpedientes, 10000);
    return () => { mounted = false; clearInterval(intervalId); };
  }, []);

  // Filtrar expedientes
  const expedientesFiltrados = useMemo(() => {
    let filtrados = [...expedientes];

    // Filtro por modalidad
    if (filtroModalidad) {
      filtrados = filtrados.filter(exp => {
        const modalidadKey = getModalidadKey(exp);
        return modalidadKey === filtroModalidad;
      });
    }

    // Filtro por estatus del expediente
    if (filtroEstatus) {
      filtrados = filtrados.filter(exp => {
        const estado = (exp.estatus_evento || '').toUpperCase();
        return estado === filtroEstatus.toUpperCase();
      });
    }

    // Filtro por estado de pago
    if (filtroPago) {
      filtrados = filtrados.filter(exp => {
        const areaActual = exp.areaActual?.toLowerCase();
        
        if (filtroPago === 'en_proceso') {
          // En proceso: los que están en compras, presupuesto o contabilidad
          return areaActual === 'compras' || areaActual === 'presupuesto' || areaActual === 'contabilidad';
        } else if (filtroPago === 'pagados') {
          // Pagados: solo los que están en tesorería con pagado = true
          return areaActual === 'tesoreria' && exp.pagado === true;
        } else if (filtroPago === 'no_pagados') {
          // No pagados: los que están en tesorería con pagado = false
          return areaActual === 'tesoreria' && exp.pagado === false;
        }
        
        return true;
      });
    }

    // Filtro por búsqueda
    if (terminoBusqueda.trim()) {
      filtrados = filtrados.filter(exp => {
        const termino = terminoBusqueda.toLowerCase();
        switch (tipoBusqueda) {
          case 'nog':
            return exp.no_nog && exp.no_nog.toLowerCase().includes(termino);
          case 'solicitud':
            return exp.solicitud && exp.solicitud.toLowerCase().includes(termino);
          case 'orden_compra':
            return exp.no_oc && exp.no_oc.toLowerCase().includes(termino);
          case 'descripcion':
            return exp.descripcion_evento && exp.descripcion_evento.toLowerCase().includes(termino);
          default:
            return true;
        }
      });
    }

    return filtrados;
  }, [expedientes, filtroModalidad, filtroEstatus, filtroPago, terminoBusqueda, tipoBusqueda]);

  const camposTablaReporte = useMemo(() => {
    const key = filtroModalidad || 'directa';
    return COLUMNAS_TABLA[key] || [];
  }, [filtroModalidad]);

  // Abrir modal de Reportes cuando se navega desde el menú lateral
  useEffect(() => {
    if (location.state && location.state.openReport) {
  // Asegurar modalidad por defecto 'directa' si no hay filtro activo
  setFiltroModalidad(prev => prev || 'directa');
      const cols = [
        ...camposTablaReporte.map(c => c.name),
        'cur_aprobado',
        'cur_compromiso',
        'pagado'
      ];
      setCamposReporte(cols);
      setShowReporte(true);
      // limpiar el state para evitar re-apertura al navegar
      navigate('/dashboard', { replace: true, state: {} });
    }
  }, [location.state, camposTablaReporte, navigate]);

  const extraCampos = useMemo(() => ([
    { name: 'cur_aprobado', label: 'CUR Aprobado', type: 'text' },
    { name: 'cur_compromiso', label: 'CUR Compromiso', type: 'text' },
    { name: 'pagado', label: 'Pagado', type: 'checkbox' }
  ]), []);

  const allSelected = camposReporte.length > 0 && [...camposTablaReporte, ...extraCampos].every(c => camposReporte.includes(c.name));

  const handleReporteClose = () => setShowReporte(false);
  const handleCampoReporteChange = (campo) => {
    setCamposReporte(prev => prev.includes(campo) ? prev.filter(c => c !== campo) : [...prev, campo]);
  };
  const handleToggleSeleccionTodos = () => {
    if (allSelected) setCamposReporte([]);
    else setCamposReporte([...camposTablaReporte, ...extraCampos].map(c => c.name));
  };
  const onModalidadFiltroChange = (key) => {
    setFiltroModalidad(key);
    setShowReporte(false);
    setTimeout(() => {
      const cols = COLUMNAS_TABLA[key] || [];
      setCamposReporte([
        ...cols.map(c => c.name),
        'cur_aprobado', 'cur_compromiso', 'pagado'
      ]);
      setShowReporte(true);
    }, 0);
  };

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

  const handleExportPDF = () => {
    if (!camposReporte.length) return alert('Selecciona al menos un campo.');
    const campos = [...camposTablaReporte, ...extraCampos].filter(c => camposReporte.includes(c.name));
    const format = guessPdfFormat(campos.length);
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format });
    const modalidadLabel = filtroModalidad ? MODALIDADES.find(m => m.key === filtroModalidad)?.label : 'TODAS';
    const fecha = new Date();
    doc.setFontSize(16);
    doc.text(`REPORTE DE ${modalidadLabel}`, 40, 36);
    doc.setFontSize(10);
    doc.text(`Generado el: ${fmtFecha(fecha)}`, 40, 54);
    const columnas = campos.map(c => ({ header: c.label, dataKey: c.name }));
    const filas = expedientesFiltrados.map(row => {
      const obj = {};
      campos.forEach(c => {
        const raw = row[c.name];
        if (typeof raw === 'boolean' || c.type === 'checkbox' || /pagado|finalizado/i.test(c.name)) {
          obj[c.name] = raw === true ? 'SI' : raw === false ? 'NO' : '';
        } else if (c.type === 'date' || /fecha|_oc$|_ingreso/i.test(c.name)) {
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
      }
    });
    const nombreArchivo = `Reporte_${modalidadLabel.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(nombreArchivo);
  };

  // Distribución de expedientes por área según filtros aplicados
  const expedientesPorArea = AREAS.reduce((acc, area) => {
    // Caso 1: Filtro de pagados - todos van a tesorería
    if (filtroPago === 'pagados') {
      if (area === 'tesoreria') {
        // Solo mostrar en tesorería los expedientes que están en tesorería Y están pagados
        acc[area] = expedientesFiltrados.filter(e => 
          e.areaActual && 
          e.areaActual.trim().toLowerCase() === 'tesoreria' &&
          e.pagado === true
        );
      } else {
        acc[area] = []; // Otras áreas quedan vacías
      }
    } 
    // Caso 2: Filtro de no pagados - todos van a tesorería
    else if (filtroPago === 'no_pagados') {
      if (area === 'tesoreria') {
        // Solo mostrar en tesorería los expedientes que están en tesorería Y no están pagados
        acc[area] = expedientesFiltrados.filter(e => 
          e.areaActual && 
          e.areaActual.trim().toLowerCase() === 'tesoreria' &&
          e.pagado === false
        );
      } else {
        acc[area] = []; // Otras áreas quedan vacías
      }
    } 
    // Caso 3: Filtro de en proceso - se distribuyen entre compras, presupuesto y contabilidad
    else if (filtroPago === 'en_proceso') {
      if (area === 'tesoreria') {
        acc[area] = []; // Tesorería queda vacía
      } else {
        // Mostrar en cada área los expedientes que corresponden a esa área
        acc[area] = expedientesFiltrados.filter(e => 
          e.areaActual && 
          e.areaActual.trim().toLowerCase() === area.toLowerCase()
        );
      }
    } 
    // Caso 4: Sin filtro de pago - distribución normal por área
    else {
      acc[area] = expedientesFiltrados.filter(e => 
        e.areaActual && 
        e.areaActual.trim().toLowerCase() === area.toLowerCase()
      );
    }
    return acc;
  }, {});

  // Estadísticas por modalidad con pagados/no pagados
  const estadisticasPorModalidad = useMemo(() => {
    const stats = MODALIDADES.map(modalidad => {
      const expedientesModalidad = expedientes.filter(exp => getModalidadKey(exp) === modalidad.key);
      
      // Separar expedientes según nueva lógica
      const expedientesEnProceso = expedientesModalidad.filter(exp => {
        const areaActual = exp.areaActual?.toLowerCase();
        return areaActual === 'compras' || areaActual === 'presupuesto' || areaActual === 'contabilidad';
      });
      
      const expedientesPagados = expedientesModalidad.filter(exp => {
        const areaActual = exp.areaActual?.toLowerCase();
        return areaActual === 'tesoreria' && exp.pagado === true;
      });
      
      const expedientesNoPagados = expedientesModalidad.filter(exp => {
        const areaActual = exp.areaActual?.toLowerCase();
        return areaActual === 'tesoreria' && exp.pagado === false;
      });
      
      const montoEnProceso = expedientesEnProceso.reduce((sum, exp) => {
        return sum + (parseFloat(exp.monto_total) || 0);
      }, 0);
      
      const montoPagado = expedientesPagados.reduce((sum, exp) => {
        return sum + (parseFloat(exp.monto_total) || 0);
      }, 0);
      
      const montoNoPagado = expedientesNoPagados.reduce((sum, exp) => {
        return sum + (parseFloat(exp.monto_total) || 0);
      }, 0);

      return {
        ...modalidad,
        totalExpedientes: expedientesModalidad.length || 0,
        expedientesEnProceso: expedientesEnProceso.length || 0,
        expedientesPagados: expedientesPagados.length || 0,
        expedientesNoPagados: expedientesNoPagados.length || 0,
        montoEnProceso: montoEnProceso || 0,
        montoPagado: montoPagado || 0,
        montoNoPagado: montoNoPagado || 0,
        montoTotal: (montoEnProceso || 0) + (montoPagado || 0) + (montoNoPagado || 0)
      };
    });

    // Agregar cuadro de totales con nueva lógica
    const totalExpedientes = expedientes.length;
    
    // En proceso: Compras + Presupuesto + Contabilidad
    const totalEnProceso = expedientes.filter(exp => {
      const areaActual = exp.areaActual?.toLowerCase();
      return areaActual === 'compras' || areaActual === 'presupuesto' || areaActual === 'contabilidad';
    }).length;
    
    // Pagados: Solo Tesorería con pagado = true
    const totalPagados = expedientes.filter(exp => {
      const areaActual = exp.areaActual?.toLowerCase();
      return areaActual === 'tesoreria' && exp.pagado === true;
    }).length;
    
    // No pagados: Solo Tesorería con pagado = false
    const totalNoPagados = expedientes.filter(exp => {
      const areaActual = exp.areaActual?.toLowerCase();
      return areaActual === 'tesoreria' && exp.pagado === false;
    }).length;
    
    const montoTotalEnProceso = expedientes
      .filter(exp => {
        const areaActual = exp.areaActual?.toLowerCase();
        return areaActual === 'compras' || areaActual === 'presupuesto' || areaActual === 'contabilidad';
      })
      .reduce((sum, exp) => sum + (parseFloat(exp.monto_total) || 0), 0);
    
    const montoTotalPagado = expedientes
      .filter(exp => {
        const areaActual = exp.areaActual?.toLowerCase();
        return areaActual === 'tesoreria' && exp.pagado === true;
      })
      .reduce((sum, exp) => sum + (parseFloat(exp.monto_total) || 0), 0);
    
    const montoTotalNoPagado = expedientes
      .filter(exp => {
        const areaActual = exp.areaActual?.toLowerCase();
        return areaActual === 'tesoreria' && exp.pagado === false;
      })
      .reduce((sum, exp) => sum + (parseFloat(exp.monto_total) || 0), 0);

    stats.push({
      key: 'total',
      label: 'TOTAL GENERAL',
      totalExpedientes: totalExpedientes || 0,
      expedientesEnProceso: totalEnProceso || 0,
      expedientesPagados: totalPagados || 0,
      expedientesNoPagados: totalNoPagados || 0,
      montoEnProceso: montoTotalEnProceso || 0,
      montoPagado: montoTotalPagado || 0,
      montoNoPagado: montoTotalNoPagado || 0,
      montoTotal: (montoTotalEnProceso || 0) + (montoTotalPagado || 0) + (montoTotalNoPagado || 0)
    });

    return stats;
  }, [expedientes]);

  // Función para manejar clic en tarjetas de pago
  const handleFiltrarPorPago = (modalidad, tipoPago) => {
    // Si ya está filtrado por el mismo criterio, limpiarlo
    const isCurrentFilter = modalidad === 'total' 
      ? (filtroModalidad === '' && filtroPago === tipoPago)
      : (filtroModalidad === modalidad && filtroPago === tipoPago);
      
    if (isCurrentFilter) {
      setFiltroModalidad('');
      setFiltroPago('');
    } else {
      // Si la modalidad es 'total', no filtrar por modalidad específica
      if (modalidad === 'total') {
        setFiltroModalidad('');
      } else {
        setFiltroModalidad(modalidad);
      }
      setFiltroPago(tipoPago);
    }
    // Limpiar búsqueda de texto
    setTerminoBusqueda('');
  };

  // Datos para la gráfica por mes
  const datosPorMes = useMemo(() => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const contadorMeses = new Array(12).fill(0);

    expedientes.forEach(exp => {
      const modalidadKey = getModalidadKey(exp);
      let fechaStr = null;
      if (modalidadKey === 'baja') {
        // Baja Cuantía: usar Fecha OC exclusivamente
        fechaStr = exp.fecha_oc || null;
      } else if (modalidadKey === 'directa') {
        // Compra Directa: usar Fecha Adjudicación exclusivamente
        fechaStr = exp.fecha_adjudicacion || null;
      } else if (modalidadKey === 'abierto') {
        // Contrato Abierto: priorizar Adjudicación; usar OC sólo como respaldo
        fechaStr = exp.fecha_adjudicacion || exp.fecha_oc || null;
      }
      if (fechaStr) {
        const fecha = new Date(fechaStr);
        if (!isNaN(fecha.getTime())) {
          contadorMeses[fecha.getMonth()]++;
        }
      }
    });

    return {
      labels: meses,
      datasets: [{
        label: 'Compras por Mes',
        data: contadorMeses,
        backgroundColor: 'rgba(37, 99, 235, 0.6)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 1
      }]
    };
  }, [expedientes]);



  // Aplicar clase al body o contenedor principal cuando se abra el modal
  React.useEffect(() => {
    if (expedienteSeleccionado) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    // Cleanup al desmontar el componente
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [expedienteSeleccionado]);

  return (
    <section className="dashboard-section">
      <div className="dashboard-top-section">
        {/* Título y Filtros en la misma línea */}
        <div className="dashboard-header-row">
          <h2 className="dashboard-title-inline">
            EXPEDIENTES COMPRAS DDRISS JALAPA
          </h2>
          
          <div className="dashboard-filters">
        <select 
          value={filtroModalidad} 
          onChange={(e) => setFiltroModalidad(e.target.value)}
          className="dashboard-select-compact"
        >
          <option value="">Todas las modalidades</option>
          {MODALIDADES.map(modalidad => (
            <option key={modalidad.key} value={modalidad.key}>
              {modalidad.label}
            </option>
          ))}
        </select>

        <select
          value={filtroEstatus}
          onChange={(e) => setFiltroEstatus(e.target.value)}
          className="dashboard-select-compact"
        >
          <option value="">Todos los estatus</option>
          <option value="EN PROCESO">EN PROCESO</option>
          <option value="ADJUDICADO">ADJUDICADO</option>
          <option value="NO ADJUDICADO">NO ADJUDICADO</option>
          <option value="PRESCINDIDO">PRESCINDIDO</option>
          <option value="DESIERTO">DESIERTO</option>
        </select>

        <select 
          value={tipoBusqueda} 
          onChange={(e) => setTipoBusqueda(e.target.value)}
          className="dashboard-select-compact"
        >
          <option value="nog">NOG</option>
          <option value="solicitud">Solicitud</option>
          <option value="orden_compra">Orden de Compra</option>
          <option value="descripcion">Descripción</option>
        </select>

        <input
          type="text"
          placeholder={`Buscar...`}
          value={terminoBusqueda}
          onChange={(e) => setTerminoBusqueda(e.target.value)}
          className="dashboard-input-compact"
        />

        <button 
          onClick={() => {
            setFiltroModalidad('');
            setFiltroEstatus('');
            setFiltroPago('');
            setTerminoBusqueda('');
            setTipoBusqueda('nog');
          }}
          className="dashboard-clear-btn-compact"
        >
          Limpiar
        </button>
          </div>
          
        </div>

      <div className="dashboard-areas-header">
        {AREAS.map(area => (
          <div key={area} className="dashboard-area-header-item">
            <div className="dashboard-area-title-box">
              <div className="dashboard-area-title">{area}</div>
              <div className="dashboard-area-count">
                {expedientesPorArea[area]?.length || 0}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid-container">
        <div className="dashboard-areas-content">
        {AREAS.map(area => (
          <div key={area} className="dashboard-area-box">
            {expedientesPorArea[area] && expedientesPorArea[area].length > 0 ? (
              expedientesPorArea[area].map(exp => (
                <div
                  key={exp._id}
                  className={`dashboard-expediente-item ${(() => {
                    const estado = (exp.estatus_evento || '').toUpperCase();
                    return (estado === 'DESIERTO' || estado === 'NO ADJUDICADO' || estado === 'PRESCINDIDO')
                      ? 'dashboard-expediente-item-danger'
                      : '';
                  })()}`}
                  onClick={() => setExpedienteSeleccionado(exp)}
                >
                  <div className="dashboard-expediente-no"><strong>No:</strong> {exp.no_identificacion}</div>
                  <div className="dashboard-expediente-desc">
                    <strong>Descripción:</strong> 
                    <span className="dashboard-expediente-desc-text">{exp.descripcion_evento}</span>
                  </div>
                  <div className="dashboard-expediente-monto">
                    <strong>Monto:</strong> 
                    <span className="dashboard-expediente-monto-value">
                      Q. {(parseFloat(exp.monto_total) || 0).toLocaleString('es-GT', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="dashboard-expediente-empty">Sin expedientes</div>
            )}
          </div>
        ))}
        </div>
      </div>
      {/* Modal Reporte */}
      <ModalReporte
        show={showReporte}
        onClose={handleReporteClose}
        camposTabla={camposTablaReporte}
        camposReporte={camposReporte}
        handleCampoReporteChange={handleCampoReporteChange}
        handleToggleSeleccionTodos={handleToggleSeleccionTodos}
        allSelected={allSelected}
        modalidad={filtroModalidad || 'directa'}
        onModalidadFiltroChange={onModalidadFiltroChange}
        extraCampos={extraCampos}
        handleExportExcel={async () => {
          if (!camposReporte || camposReporte.length === 0) {
            alert('Selecciona al menos un campo para exportar.');
            return;
          }
          const ExcelJSImport = await import('exceljs/dist/exceljs.min.js');
          const ExcelJS = ExcelJSImport?.default || ExcelJSImport;
          const fileSaverMod = await import('file-saver');
          const saveAs = (fileSaverMod && (fileSaverMod.saveAs || fileSaverMod.default)) ? (fileSaverMod.saveAs || fileSaverMod.default) : null;
          if (!saveAs) {
            alert('No se pudo cargar el módulo de guardado de archivos.');
            return;
          }
          const campos = [...camposTablaReporte, ...extraCampos].filter(c => camposReporte.includes(c.name));
          const modalidadLabel = filtroModalidad ? (MODALIDADES.find(m => m.key === filtroModalidad)?.label || 'TODAS') : 'TODAS';
          const fechaReporte = new Date();
          const fechaStr = fechaReporte.toLocaleDateString();
          const horaStr = fechaReporte.toLocaleTimeString();
  
          const workbook = new ExcelJS.Workbook();
          const ws = workbook.addWorksheet('Reporte');
  
          ws.mergeCells('A1', String.fromCharCode(65 + campos.length - 1) + '1');
          ws.getCell('A1').value = `REPORTE DE ${modalidadLabel}`;
          ws.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF0D47A1' } };
          ws.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' };
  
          ws.mergeCells('A2', String.fromCharCode(65 + campos.length - 1) + '2');
          ws.getCell('A2').value = `Generado el: ${fechaStr} ${horaStr}`;
          ws.getCell('A2').font = { size: 10, color: { argb: 'FF374151' } };
  
          ws.addRow([]);
          const headerRow = ws.addRow(campos.map(c => c.label));
          headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          headerRow.height = 22;
          headerRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E88E5' } };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          });
  
          expedientesFiltrados.forEach(row => {
            const values = campos.map(c => {
              const raw = row[c.name];
              if (typeof raw === 'boolean' || c.type === 'checkbox' || /pagado|finalizado/i.test(c.name)) {
                return raw === true ? 'SI' : raw === false ? 'NO' : '';
              }
              if (c.type === 'date' || /fecha|fecha_|_fecha|_oc$|_ingreso/i.test(c.name)) {
                return fmtFecha(raw);
              }
              return raw ?? '';
            });
            const dataRow = ws.addRow(values);
            dataRow.alignment = { vertical: 'top' };
            dataRow.eachCell((cell) => {
              cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
              if (typeof cell.value === 'string' && cell.value.length > 60) {
                cell.alignment = { wrapText: true };
              }
              // Asegurar celdas vacías con bordes visibles
              if (cell.value === null || cell.value === undefined || cell.value === '') {
                cell.value = '';
              }
            });
          });
  
          campos.forEach((c, i) => {
            const maxLen = Math.max(
              c.label.length,
              ...expedientesFiltrados.map(r => (r[c.name] ? String(r[c.name]).length : 0))
            );
            ws.getColumn(i + 1).width = Math.min(Math.max(maxLen + 4, 12), 60);
          });
  
          const nombreArchivo = `Reporte_${modalidadLabel.replace(/\s+/g, '_')}_${fechaReporte.toISOString().slice(0,10)}.xlsx`;
          const buffer = await workbook.xlsx.writeBuffer();
          saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nombreArchivo);
        }}
        handleExportPDF={handleExportPDF}
      />
      </div> {/* Fin dashboard-top-section */}
      
      {/* Cajón inferior: Estadísticas y Gráfica */}
      <div className="dashboard-bottom-section">
        <div className="dashboard-bottom-handle" title="Coloque el mouse aquí para ver estadísticas y gráfica">
          ▴ Estadísticas y gráfica
        </div>
        <div className="dashboard-bottom-content">
        {/* Estadísticas por Modalidad */}
        <div className="dashboard-statistics">
          <div className="dashboard-statistics-cards">
            {estadisticasPorModalidad.map(stat => (
              <div key={stat.key} className={`dashboard-stat-card ${stat.key === 'total' ? 'dashboard-stat-card-total' : ''}`}>
                <h4 className="dashboard-stat-title">{stat.label}</h4>
                
                {/* Tarjeta de Expedientes Totales */}
                <div className="dashboard-stat-mini-card dashboard-stat-mini-card-total">
                  <div className="dashboard-stat-mini-item">
                    <span className="dashboard-stat-mini-label">Expedientes:</span>
                    <span className="dashboard-stat-mini-value">{stat.totalExpedientes}</span>
                  </div>
                  <div className="dashboard-stat-mini-item">
                    <span className="dashboard-stat-mini-label">Monto:</span>
                    <span className="dashboard-stat-mini-value">
                      Q. {(stat.montoTotal || 0).toLocaleString('es-GT', { 
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}
                    </span>
                  </div>
                </div>

                {/* Tarjeta de Expedientes En Proceso */}
                <div 
                  className={`dashboard-stat-mini-card dashboard-stat-mini-card-process ${
                    (stat.key === 'total' ? (filtroModalidad === '' && filtroPago === 'en_proceso') : 
                    (filtroModalidad === stat.key && filtroPago === 'en_proceso')) ? 'dashboard-stat-mini-card-active' : ''
                  }`}
                  onClick={() => handleFiltrarPorPago(stat.key, 'en_proceso')}
                  title="Click para filtrar expedientes en proceso"
                >
                  <div className="dashboard-stat-mini-item">
                    <span className="dashboard-stat-mini-label">⏳ Expedientes En Proceso:</span>
                    <span className="dashboard-stat-mini-value dashboard-stat-mini-value-process">
                      {stat.expedientesEnProceso}
                    </span>
                  </div>
                  <div className="dashboard-stat-mini-item">
                    <span className="dashboard-stat-mini-label">Monto:</span>
                    <span className="dashboard-stat-mini-value dashboard-stat-mini-value-process">
                      Q. {(stat.montoEnProceso || 0).toLocaleString('es-GT', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                </div>

                {/* Tarjeta de Expedientes Pagados */}
                <div 
                  className={`dashboard-stat-mini-card dashboard-stat-mini-card-paid ${
                    (stat.key === 'total' ? (filtroModalidad === '' && filtroPago === 'pagados') : 
                    (filtroModalidad === stat.key && filtroPago === 'pagados')) ? 'dashboard-stat-mini-card-active' : ''
                  }`}
                  onClick={() => handleFiltrarPorPago(stat.key, 'pagados')}
                  title="Click para filtrar expedientes pagados"
                >
                  <div className="dashboard-stat-mini-item">
                    <span className="dashboard-stat-mini-label">✓ Expedientes Pagados:</span>
                    <span className="dashboard-stat-mini-value dashboard-stat-mini-value-paid">
                      {stat.expedientesPagados}
                    </span>
                  </div>
                  <div className="dashboard-stat-mini-item">
                    <span className="dashboard-stat-mini-label">Monto:</span>
                    <span className="dashboard-stat-mini-value dashboard-stat-mini-value-paid">
                      Q. {(stat.montoPagado || 0).toLocaleString('es-GT', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                </div>

                {/* Tarjeta de Expedientes Pendiente pago */}
                <div 
                  className={`dashboard-stat-mini-card dashboard-stat-mini-card-unpaid ${
                    (stat.key === 'total' ? (filtroModalidad === '' && filtroPago === 'no_pagados') : 
                    (filtroModalidad === stat.key && filtroPago === 'no_pagados')) ? 'dashboard-stat-mini-card-active' : ''
                  }`}
                  onClick={() => handleFiltrarPorPago(stat.key, 'no_pagados')}
                  title="Click para filtrar expedientes pendiente pago"
                >
                  <div className="dashboard-stat-mini-item">
                    <span className="dashboard-stat-mini-label">✗ Expedientes Pendiente pago:</span>
                    <span className="dashboard-stat-mini-value dashboard-stat-mini-value-unpaid">
                      {stat.expedientesNoPagados}
                    </span>
                  </div>
                  <div className="dashboard-stat-mini-item">
                    <span className="dashboard-stat-mini-label">Monto:</span>
                    <span className="dashboard-stat-mini-value dashboard-stat-mini-value-unpaid">
                      Q. {(stat.montoNoPagado || 0).toLocaleString('es-GT', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
  </div>

  {/* Gráfica de Compras por Mes */}
  <div className="dashboard-chart-container">
          <h3 className="dashboard-chart-title">Compras por Mes</h3>
          <div className="dashboard-chart">
            <Bar 
              data={datosPorMes}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  },
                  title: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1
                    }
                  }
                }
              }}
            />
          </div>
        </div>
        </div>
      </div>

      {expedienteSeleccionado && (
        <div className="dashboard-modal-overlay" onClick={() => setExpedienteSeleccionado(null)} />
      )}

      {expedienteSeleccionado && (
        <div className="dashboard-modal">
          <div className="dashboard-modal-header">
            <strong className="dashboard-modal-title">Detalle del Expediente</strong>
            <button
              className="dashboard-modal-close"
              onClick={() => setExpedienteSeleccionado(null)}
              title="Cerrar detalles"
            >×</button>
          </div>
          
          <div className="dashboard-modal-info">
            <div className="dashboard-modal-field dashboard-modal-field-id">
              <strong>No. Identificación:</strong> {
                (() => {
                  const modalidadKey = getModalidadKey(expedienteSeleccionado);
                  if (modalidadKey === 'directa') {
                    return expedienteSeleccionado.no_identificacion || 'No especificado';
                  } else if (modalidadKey === 'abierto') {
                    return expedienteSeleccionado.no || 'No especificado';
                  } else if (modalidadKey === 'baja') {
                    return expedienteSeleccionado.no || 'No especificado';
                  }
                  return expedienteSeleccionado.no_identificacion || 'No especificado';
                })()
              }
            </div>

            <div className="dashboard-modal-field dashboard-modal-field-nog">
              <strong>{
                (() => {
                  const modalidadKey = getModalidadKey(expedienteSeleccionado);
                  return modalidadKey === 'baja' ? 'NPG:' : 'NOG:';
                })()
              }</strong> {
                (() => {
                  const modalidadKey = getModalidadKey(expedienteSeleccionado);
                  if (modalidadKey === 'baja') {
                    return expedienteSeleccionado.npg || 'No especificado';
                  } else {
                    return expedienteSeleccionado.no_nog || 'No especificado';
                  }
                })()
              }
            </div>
            
            <div className="dashboard-modal-field dashboard-modal-field-desc">
              <strong>Descripción del Evento:</strong> 
              <span className="modal-value">{expedienteSeleccionado.descripcion_evento}</span>
            </div>
            
            <div className="dashboard-modal-field">
              <strong>Solicitud de Pedido:</strong> 
              <span className="modal-value">{expedienteSeleccionado.solicitud || 'No especificado'}</span>
            </div>
            
            <div className="dashboard-modal-field">
              <strong>Descripción del Producto:</strong> 
              <span className="modal-value">{expedienteSeleccionado.descripcion_producto || expedienteSeleccionado.descripcion_evento}</span>
            </div>
            
            <div className="dashboard-modal-field">
              <strong>Cantidad Adjudicada:</strong> 
              <span className="modal-value-quantity">{expedienteSeleccionado.cantidad_adjudicada || '0'}</span>
            </div>
            
            <div className="dashboard-modal-field">
              <strong>Monto:</strong> 
              <span className="modal-value-monto">
                Q. {(parseFloat(expedienteSeleccionado.monto_total) || 0).toLocaleString('es-GT', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </div>
            
            {expedienteSeleccionado.areaActual?.toLowerCase() !== 'tesoreria' && (
              <div className="dashboard-modal-field">
                <strong>Estado:</strong> 
                <span className={`modal-value-estado ${
                  (() => {
                    const estado = expedienteSeleccionado.estatus_evento;
                    if (estado === 'ADJUDICADO') return 'estado-adjudicado';
                    if (estado === 'NO ADJUDICADO') return 'estado-no-adjudicado';
                    if (estado === 'EN PROCESO') return 'estado-proceso';
                    if (estado === 'PRESCINDIDO') return 'estado-prescindido';
                    if (estado === 'DESIERTO') return 'estado-desierto';
                    return 'estado-proceso';
                  })()
                }`}>
                  {(() => {
                    const estado = expedienteSeleccionado.estatus_evento || 'EN PROCESO';
                    const iconos = {
                      'ADJUDICADO': '✅',
                      'NO ADJUDICADO': '❌',
                      'EN PROCESO': '🔄',
                      'PRESCINDIDO': '⚠️',
                      'DESIERTO': '�'
                    };
                    return `${iconos[estado] || '🔄'} ${estado}`;
                  })()}
                </span>
              </div>
            )}

            {/* Estado de Pago (solo en Tesorería) */}
            {expedienteSeleccionado.areaActual?.toLowerCase() === 'tesoreria' && (
              <div className="dashboard-modal-field">
                <strong>Estado de Pago:</strong>
                <span
                  className={`modal-value-estado ${
                    expedienteSeleccionado.pagado === true
                      ? 'estado-pagado'
                      : expedienteSeleccionado.pagado === false
                      ? 'estado-pendiente'
                      : 'estado-proceso'
                  }`}
                >
                  {expedienteSeleccionado.pagado === true ? '✓ Pagado' : '✗ Pendiente pago'}
                </span>
              </div>
            )}
            
            <div className="dashboard-modal-field dashboard-modal-field-modalidad">
              <strong>Modalidad:</strong> 
              <span className="modal-value-modalidad">{expedienteSeleccionado.modalidad || 'COMPRA DIRECTA'}</span>
            </div>
          </div>
          
          <div className="dashboard-modal-checklist-title">
            <h3>Estado de Documentos</h3>
          </div>
          <div className="dashboard-modal-checklist">
            {(() => {
              // Campos solicitados, con etiquetas ajustadas
              const camposDeseados = [
                { name: 'no_nog', label: 'NOG' },
                { name: 'no_oc', label: 'No. O.C' },
                { name: 'proveedor', label: 'Nombre Proveedor' },
                { name: 'renglon', label: 'Renglón' },
                { name: 'precio', label: 'Precio Unitario' },
                { name: 'cantidad_adjudicada', label: 'Cantidad Adjudicada' },
                { name: 'monto_total', label: 'Monto Total' },
                { name: 'factura_numero', label: 'No. Factura' },
                { name: 'almacen_no_ingreso', label: 'No. Ingreso Almacén' },
                { name: 'cur_numero', label: 'CUR Solicitado' },
                { name: 'cur_devengado', label: 'CUR Devengado' },
                { name: 'cur_aprobado', label: 'CUR Aprobado' },
                { name: 'pagado', label: 'Pagado' },
                { name: 'finalizado', label: 'Finalizado' },
              ];

              // Orden sugerido: repartimos en dos columnas
              const mitad = Math.ceil(camposDeseados.length / 2);
              const col1 = camposDeseados.slice(0, mitad);
              const col2 = camposDeseados.slice(mitad);

              const renderItem = (campo) => {
                const valor = expedienteSeleccionado[campo.name];
                const checked = (() => {
                  if (typeof valor === 'boolean') return valor;
                  if (valor === 0) return true; // permitir 0 como válido para montos
                  return !!valor;
                })();
                return (
                  <li key={campo.name} className="dashboard-modal-checklist-item">
                    {checked ? <span className="dashboard-check-ok">✔</span> : <span className="dashboard-check-fail">✘</span>}
                    <span>{campo.label}</span>
                  </li>
                );
              };

              return (
                <>
                  <ul className="dashboard-modal-checklist-col">
                    {col1.map(renderItem)}
                  </ul>
                  <ul className="dashboard-modal-checklist-col">
                    {col2.map(renderItem)}
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