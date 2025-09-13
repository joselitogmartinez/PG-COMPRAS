import React, { useState, useEffect } from 'react';
    import { useNavigate } from 'react-router-dom';
    import 'bootstrap/dist/css/bootstrap.min.css';
    import axios from 'axios';
    import { apiUrl } from '../utils/api';
    import logo from '../img/mspas.png';
    import TablaExpedientesAreas from '../components/components_pag_presupuesto/TablaExpedientesAreas';
    import ModalPagado from '../components/components_pag_presupuesto/ModalPagado';
    import ModalTraslado from '../components/ModalTraslado';
    import ModalAreas from '../components/components_pag_presupuesto/ModalAreas';

    const COLUMNAS_TESORERIA = [
    { name: 'no_identificacion', label: 'No' },
    { name: 'modalidad', label: 'Modalidad' },
    { name: 'descripcion_evento', label: 'Descripción Evento' },
    { name: 'no_oc', label: 'No. O.C' },
    { name: 'nit_adjudicado', label: 'NIT Adjudicado' },
    { name: 'proveedor', label: 'Proveedor' },
    { name: 'producto', label: 'Producto' },
    { name: 'renglon', label: 'Renglón' },
    { name: 'cantidad_adjudicada', label: 'Cantidad Adjudicada' },
    { name: 'monto_total', label: 'Monto Total' },
    { name: 'factura_numero', label: 'No. Factura' },
    // El campo cur_devengado se agrega como extraField en el componente
    { name: 'pagado', label: 'Pagado' },
    { name: 'tipo_pago', label: 'Tipo de Pago' },
    { name: 'fecha_pago', label: 'Fecha de Pago' },
    ];

    const EXTRA_FIELD_TESORERIA = { name: 'cur_devengado', label: 'CUR Devengado' };

    const Tesoreria = () => {
    const [rows, setRows] = useState([]);
    const [filtros, setFiltros] = useState({
        modalidad: '',
        no_oc: '',
        nit_adjudicado: '',
        renglon: '',
        pagado: '' // 'SI', 'NO' o ''
    });
    const [hoveredRow, setHoveredRow] = useState(null);
    const [showTraslado, setShowTraslado] = useState(false);
    const [expedienteTraslado, setExpedienteTraslado] = useState(null);
    const [showCurModal, setShowCurModal] = useState(false);
    const [expedienteCur, setExpedienteCur] = useState(null);
    const [showPagadoModal, setShowPagadoModal] = useState(false);
    const [expedientePagado, setExpedientePagado] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchExpedientes = async () => {
        try {
            const res = await axios.get(apiUrl('/api/expedientes'));
            setRows(res.data);
        } catch (err) {
            setRows([]);
        }
        };
        fetchExpedientes();
    }, []);

    // Protección por rol
    useEffect(() => {
        const rol = localStorage.getItem('rol');
        if (rol !== 'tesoreria') {
        navigate('/'); // Redirige al login si no es rol tesoreria
        }
    }, [navigate]);

    // Filtros: No. O.C, NIT Adjudicado, Renglón, Pagado
    const rowsFiltrados = rows.filter(row => {
        if (row.areaActual !== 'TESORERIA') return false;
        if (filtros.modalidad && row.modalidad !== filtros.modalidad) return false;
        if (filtros.no_oc && !row.no_oc?.toLowerCase().includes(filtros.no_oc.toLowerCase())) return false;
        if (filtros.nit_adjudicado && !row.nit_adjudicado?.toLowerCase().includes(filtros.nit_adjudicado.toLowerCase())) return false;
        if (filtros.renglon && !row.renglon?.toLowerCase().includes(filtros.renglon.toLowerCase())) return false;
        if (filtros.pagado === 'SI' && !row.pagado) return false;
        if (filtros.pagado === 'NO' && row.pagado) return false;
        return true;
    }); 

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('rol');
        navigate('/');
    };

    const handleAbrirTraslado = (expediente) => {
        setExpedienteTraslado(expediente);
        setShowTraslado(true);
    };

    const handleTrasladar = async (area) => {
        if (!expedienteTraslado) return;
        try {
        const res = await axios.put(
            apiUrl(`/api/expedientes/trasladar/${expedienteTraslado._id}`),
            { area }
        );
        setRows(rows => rows.map(r => r._id === res.data._id ? res.data : r));
        setShowTraslado(false);
        setExpedienteTraslado(null);
        } catch (err) {
        alert('Error al trasladar expediente');
        }
    };

    const handleAbrirCurModal = (expediente) => {
        setExpedienteCur(expediente);
        setShowCurModal(true);
    };

    return (
        <div className="bg-white min-vh-100">
        {/* Segundo encabezado (sin botones de reportes ni registrar) */}
        <div className="px-4 py-0 bg-white border-bottom d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
            <img
                src={logo}
                alt="Logo"
                style={{ height: '100px', width: 'auto', objectFit: 'contain' }}
            />
            <h4 className="mb-0 fw-bold titulo-azul-marino">UNIDAD DE TESORERÍA</h4>
            </div>
            <button className="btn btn-outline-primary d-flex align-items-center" onClick={handleLogout}>
            Cerrar Sesión
            </button>
        </div>

        {/* Filtros */}
        <div className="px-4 py-3 d-flex gap-3">
            <select
            className="form-select"
            value={filtros.modalidad}
            onChange={e => setFiltros({ ...filtros, modalidad: e.target.value })}
            style={{ maxWidth: 200 }}
            >
            <option value="">Todas las Modalidades</option>
            <option value="COMPRA DIRECTA">COMPRA DIRECTA</option>
            <option value="CONTRATO ABIERTO">CONTRATO ABIERTO</option>
            <option value="BAJA CUANTÍA">BAJA CUANTÍA</option>
            </select>
            <input
            type="text"
            className="form-control"
            placeholder="No. O.C"
            value={filtros.no_oc}
            onChange={e => setFiltros({ ...filtros, no_oc: e.target.value })}
            style={{ maxWidth: 200 }}
            />
            <input
            type="text"
            className="form-control"
            placeholder="NIT Proveedor"
            value={filtros.nit_adjudicado}
            onChange={e => setFiltros({ ...filtros, nit_adjudicado: e.target.value })}
            style={{ maxWidth: 200 }}
            />
            <input
            type="text"
            className="form-control"
            placeholder="Renglón"
            value={filtros.renglon}
            onChange={e => setFiltros({ ...filtros, renglon: e.target.value })}
            style={{ maxWidth: 200 }}
            />
            <select
            className="form-select"
            value={filtros.pagado}
            onChange={e => setFiltros({ ...filtros, pagado: e.target.value })}
            style={{ maxWidth: 200 }}
            >
            <option value="">Todos</option>
            <option value="SI">Pagados</option>
            <option value="NO">Pendiente pago</option>
            </select>
        </div>

        {/* Título de filtros aplicados */}
        <div className="px-4 pb-2">
            {(() => {
                const tituloClass = "fw-bold text-danger text-center";
                // Si no hay modalidad ni pagado
                if (!filtros.modalidad && !filtros.pagado) {
                    return <h5 className={tituloClass}>TODOS LOS EXPEDIENTES</h5>;
                }
                // Si no hay modalidad pero sí pagado
                if (!filtros.modalidad && filtros.pagado === 'SI') {
                    return <h5 className={tituloClass}>TODOS EXPEDIENTES PAGADOS</h5>;
                }
                if (!filtros.modalidad && filtros.pagado === 'NO') {
                    return <h5 className={tituloClass}>TODOS EXPEDIENTES PENDIENTE PAGO</h5>;
                }
                // Si hay modalidad y pagado
                let partes = [];
                if (filtros.modalidad) partes.push(filtros.modalidad);
                if (filtros.pagado === 'SI') partes.push('PAGADOS');
                if (filtros.pagado === 'NO') partes.push('PENDIENTE PAGO');
                if (partes.length > 0) {
                    return <h5 className={tituloClass}>{partes.join(' - ')}</h5>;
                }
                return null;
            })()}
        </div>

        {/* Tabla */}
        <TablaExpedientesAreas
            camposTabla={COLUMNAS_TESORERIA}
            rowsFiltrados={rowsFiltrados}
            hoveredRow={hoveredRow}
            setHoveredRow={setHoveredRow}
            handleModificar={() => {}}
            handleAbrirTraslado={handleAbrirTraslado}
            handleAbrirCurModal={handleAbrirCurModal}
            extraField={EXTRA_FIELD_TESORERIA}
            onRowDoubleClick={async row => {
                if (row.pagado) {
                    const confirmar = window.confirm('El expediente ya está marcado como pagado. ¿Desea revertir el pago?');
                    if (confirmar) {
                        try {
                            const res = await axios.put(
                                apiUrl(`/api/expedientes/${row._id}`),
                                {
                                    pagado: false,
                                    tipo_pago: '',
                                    fecha_pago: null
                                }
                            );
                            setRows(rows => rows.map(r => r._id === res.data._id ? res.data : r));
                        } catch (err) {
                            alert('Error al revertir el pago');
                        }
                    }
                } else {
                    setExpedientePagado(row);
                    setShowPagadoModal(true);
                }
            }}
        />
        <ModalPagado
            show={showPagadoModal}
            onClose={() => setShowPagadoModal(false)}
            expediente={expedientePagado}
            onSave={async (data) => {
                if (!expedientePagado) return;
                try {
                    // Convertir todos los valores a mayúsculas
                    const dataUpper = {};
                    Object.keys(data).forEach(key => {
                        if (typeof data[key] === 'string') {
                            dataUpper[key] = data[key].toUpperCase();
                        } else {
                            dataUpper[key] = data[key];
                        }
                    });
                    const res = await axios.put(
                        apiUrl(`/api/expedientes/${expedientePagado._id}`),
                        dataUpper
                    );
                    setRows(rows => rows.map(r => r._id === res.data._id ? res.data : r));
                    setShowPagadoModal(false);
                    setExpedientePagado(null);
                } catch (err) {
                    alert('Error al guardar el pago');
                }
            }}
        />
        <ModalTraslado
            show={showTraslado}
            onClose={() => setShowTraslado(false)}
            onTrasladar={handleTrasladar}
        />
        <ModalAreas
            show={showCurModal}
            onClose={() => setShowCurModal(false)}
            onSave={async (valor) => {
            if (!expedienteCur) return;
            try {
                // Guardar el valor en mayúsculas
                const res = await axios.put(
                    apiUrl(`/api/expedientes/${expedienteCur._id}`),
                    { cur_devengado: valor.toUpperCase() }
                );
                setRows(rows => rows.map(r => r._id === res.data._id ? res.data : r));
                setShowCurModal(false);
                setExpedienteCur(null);
            } catch (err) {
                alert('Error al guardar CUR Devengado');
            }
            }}
            expediente={expedienteCur}
            fieldName="cur_devengado"
            label="CUR Devengado"
        />
        </div>
    );
    };

    export default Tesoreria;
