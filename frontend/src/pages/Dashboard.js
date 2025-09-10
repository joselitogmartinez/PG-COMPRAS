import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { CAMPOS_MODALIDAD, MODALIDADES } from '../utils/constantes';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import '../dashboard.css';
import '../styles/modalExpediente.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AREAS = ['compras', 'presupuesto', 'contabilidad', 'tesoreria'];

const Dashboard = () => {
  const [expedientes, setExpedientes] = useState([]);
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState(null);
  const [filtroModalidad, setFiltroModalidad] = useState('');
  const [tipoBusqueda, setTipoBusqueda] = useState('nog');
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [filtroPago, setFiltroPago] = useState(''); // 'pagados', 'no_pagados', o ''

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
  }, [expedientes, filtroModalidad, filtroPago, terminoBusqueda, tipoBusqueda]);

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
      if (exp.fecha_oc || exp.fecha_adjudicacion) {
        const fecha = new Date(exp.fecha_oc || exp.fecha_adjudicacion);
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
                  className="dashboard-expediente-item"
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
      </div> {/* Fin dashboard-top-section */}
      
      {/* Estadísticas y Gráfica */}
      <div className="dashboard-bottom-section">
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

                {/* Tarjeta de Expedientes No Pagados */}
                <div 
                  className={`dashboard-stat-mini-card dashboard-stat-mini-card-unpaid ${
                    (stat.key === 'total' ? (filtroModalidad === '' && filtroPago === 'no_pagados') : 
                    (filtroModalidad === stat.key && filtroPago === 'no_pagados')) ? 'dashboard-stat-mini-card-active' : ''
                  }`}
                  onClick={() => handleFiltrarPorPago(stat.key, 'no_pagados')}
                  title="Click para filtrar expedientes no pagados"
                >
                  <div className="dashboard-stat-mini-item">
                    <span className="dashboard-stat-mini-label">✗ Expedientes No Pagados:</span>
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
              const campos = CAMPOS_MODALIDAD[getModalidadKey(expedienteSeleccionado)] || [];
              const mitad = Math.ceil(campos.length / 2);
              const col1 = campos.slice(0, mitad);
              const col2 = campos.slice(mitad);
              return (
                <>
                  <ul className="dashboard-modal-checklist-col">
                    {col1.map(campo => (
                      <li key={campo.name} className="dashboard-modal-checklist-item">
                        {expedienteSeleccionado[campo.name]
                          ? <span className="dashboard-check-ok">✔</span>
                          : <span className="dashboard-check-fail">✘</span>
                        }
                        <span>{campo.label}</span>
                      </li>
                    ))}
                  </ul>
                  <ul className="dashboard-modal-checklist-col">
                    {col2.map(campo => (
                      <li key={campo.name} className="dashboard-modal-checklist-item">
                        {expedienteSeleccionado[campo.name]
                          ? <span className="dashboard-check-ok">✔</span>
                          : <span className="dashboard-check-fail">✘</span>
                        }
                        <span>{campo.label}</span>
                      </li>
                    ))}
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