import React, { useState, useRef } from 'react';
import { Modal, Button, Form, Alert, ProgressBar, Table, Badge } from 'react-bootstrap';
import { FaUpload, FaFileExcel, FaCheck, FaTimes, FaInfoCircle } from 'react-icons/fa';
import { procesarArchivoExcel, validarArchivoExcel, obtenerVistaPrevia } from '../../utils/excelImporter';
import { MODALIDADES } from '../../utils/constantes';

const ModalImportarExcel = ({ 
  show, 
  onHide, 
  modalidad, 
  camposModalidad, 
  onImportar 
}) => {
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [datosImportados, setDatosImportados] = useState(null);
  const [errores, setErrores] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('info');
  const [paso, setPaso] = useState(1); // 1: Seleccionar archivo, 2: Vista previa, 3: Confirmación
  const fileInputRef = useRef(null);

  const resetearEstado = () => {
    setArchivo(null);
    setCargando(false);
    setProgreso(0);
    setVistaPrevia(null);
    setDatosImportados(null);
    setErrores([]);
    setMensaje('');
    setPaso(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetearEstado();
    onHide();
  };

  const handleArchivoChange = async (e) => {
    const archivoSeleccionado = e.target.files[0];
    if (!archivoSeleccionado) return;

    // Validar archivo
    const validacion = validarArchivoExcel(archivoSeleccionado);
    if (!validacion.valido) {
      setMensaje(validacion.error);
      setTipoMensaje('danger');
      return;
    }

    setArchivo(archivoSeleccionado);
    setMensaje('');
    setCargando(true);

    try {
      // Obtener vista previa
      const preview = await obtenerVistaPrevia(archivoSeleccionado);
      setVistaPrevia(preview);
      setPaso(2);
      setTipoMensaje('success');
      setMensaje(`Archivo cargado correctamente. Se detectaron ${preview.encabezados.length} columnas.`);
    } catch (error) {
      setMensaje(`Error al cargar el archivo: ${error.message}`);
      setTipoMensaje('danger');
    } finally {
      setCargando(false);
    }
  };

  const handleProcesarArchivo = async () => {
    if (!archivo) return;

    setCargando(true);
    setProgreso(0);

    try {
      // Simular progreso
      const intervalo = setInterval(() => {
        setProgreso(prev => Math.min(prev + 20, 90));
      }, 200);

      const resultado = await procesarArchivoExcel(archivo, modalidad, camposModalidad);
      
      clearInterval(intervalo);
      setProgreso(100);

      setDatosImportados(resultado.datos);
      setErrores(resultado.errores);
      setPaso(3);

      if (resultado.errores.length > 0) {
        setTipoMensaje('warning');
        setMensaje(`Datos procesados con ${resultado.errores.length} advertencias. Revise los errores antes de confirmar.`);
      } else {
        setTipoMensaje('success');
        setMensaje(`${resultado.totalFilas} registros procesados correctamente.`);
      }

    } catch (error) {
      setProgreso(0);
      setMensaje(`Error al procesar el archivo: ${error.message}`);
      setTipoMensaje('danger');
    } finally {
      setCargando(false);
    }
  };

  const handleConfirmarImportacion = () => {
    if (datosImportados && datosImportados.length > 0) {
      onImportar(datosImportados);
      handleClose();
    }
  };

  const modalidadLabel = MODALIDADES.find(m => m.key === modalidad)?.label || modalidad;

  return (
    <Modal show={show} onHide={handleClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaFileExcel className="me-2 text-success" />
          Importar desde Excel - {modalidadLabel}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {mensaje && (
          <Alert variant={tipoMensaje} className="mb-3">
            <FaInfoCircle className="me-2" />
            {mensaje}
          </Alert>
        )}

        {cargando && (
          <div className="mb-3">
            <div className="d-flex justify-content-between mb-1">
              <small>Procesando archivo...</small>
              <small>{progreso}%</small>
            </div>
            <ProgressBar now={progreso} animated />
          </div>
        )}

        {/* Paso 1: Selección de archivo */}
        {paso === 1 && (
          <div className="text-center py-4">
            <div className="mb-4">
              <FaUpload size={48} className="text-muted mb-3" />
              <h5>Seleccionar Archivo Excel</h5>
              <p className="text-muted">
                Seleccione un archivo Excel (.xlsx o .xls) con los datos de {modalidadLabel.toLowerCase()}
              </p>
            </div>
            
            <Form.Group>
              <Form.Control
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleArchivoChange}
                disabled={cargando}
              />
              <Form.Text className="text-muted">
                Tamaño máximo: 10MB. Formatos permitidos: .xlsx, .xls
              </Form.Text>
            </Form.Group>

            <div className="mt-4">
              <h6>Formato esperado para {modalidadLabel}:</h6>
              <div className="text-start">
                <small className="text-muted">
                  El archivo debe contener las siguientes columnas principales:
                  <ul className="mt-2">
                    {modalidad === 'directa' && (
                      <>
                        <li>No. de Identificacion</li>
                        <li>No. NOG</li>
                        <li>Fecha de publicción</li>
                        <li>Descripcion del evento</li>
                        <li>NIT Adjudicado</li>
                        <li>Proveedor Adjudicado</li>
                        <li>Producto y Caracteristicas</li>
                      </>
                    )}
                    {modalidad === 'abierto' && (
                      <>
                        <li>No.</li>
                        <li>No. NOG</li>
                        <li>Rubro</li>
                        <li>Descripcion del Evento</li>
                        <li>NIT Adjudicado</li>
                        <li>Proveedor Adjudicado</li>
                        <li>Producto</li>
                      </>
                    )}
                    {modalidad === 'baja' && (
                      <>
                        <li>No.</li>
                        <li>NPG</li>
                        <li>FECHA DE PUBLICACION</li>
                        <li>Descripcion del evento</li>
                        <li>NIT Adjudicado</li>
                        <li>Proveedor Adjudicado</li>
                        <li>Producto y Caracteristicas</li>
                      </>
                    )}
                  </ul>
                </small>
              </div>
            </div>
          </div>
        )}

        {/* Paso 2: Vista previa del archivo */}
        {paso === 2 && vistaPrevia && (
          <div>
            <h6>Vista Previa del Archivo</h6>
            <p className="text-muted">
              <strong>Archivo:</strong> {archivo?.name} | 
              <strong> Hoja:</strong> {vistaPrevia.nombreHoja} | 
              <strong> Columnas:</strong> {vistaPrevia.encabezados.length}
            </p>

            <div className="table-responsive" style={{ maxHeight: '300px' }}>
              <Table striped bordered hover size="sm">
                <thead className="bg-light">
                  <tr>
                    {vistaPrevia.encabezados.map((encabezado, index) => (
                      <th key={index} style={{ minWidth: '120px' }}>
                        {encabezado}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vistaPrevia.filasEjemplo.map((fila, rowIndex) => (
                    <tr key={rowIndex}>
                      {vistaPrevia.encabezados.map((_, colIndex) => (
                        <td key={colIndex}>
                          {fila[colIndex] || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <Alert variant="info" className="mt-3">
              <FaInfoCircle className="me-2" />
              Esta es una vista previa de las primeras filas. Al procesar, se importarán todos los datos del archivo.
            </Alert>
          </div>
        )}

        {/* Paso 3: Confirmación y errores */}
        {paso === 3 && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6>Resumen de Importación</h6>
              <Badge bg="primary">
                {datosImportados?.length || 0} registros
              </Badge>
            </div>

            {errores.length > 0 && (
              <Alert variant="warning">
                <strong>Advertencias encontradas:</strong>
                <ul className="mb-0 mt-2">
                  {errores.slice(0, 10).map((error, index) => (
                    <li key={index} className="small">{error}</li>
                  ))}
                  {errores.length > 10 && (
                    <li className="small text-muted">
                      ... y {errores.length - 10} advertencias más
                    </li>
                  )}
                </ul>
              </Alert>
            )}

            <div className="row">
              <div className="col-md-6">
                <div className="bg-light p-3 rounded">
                  <h6 className="text-success">
                    <FaCheck className="me-1" />
                    Registros a importar
                  </h6>
                  <h4 className="mb-0">{datosImportados?.length || 0}</h4>
                </div>
              </div>
              <div className="col-md-6">
                <div className="bg-light p-3 rounded">
                  <h6 className="text-warning">
                    <FaTimes className="me-1" />
                    Advertencias
                  </h6>
                  <h4 className="mb-0">{errores.length}</h4>
                </div>
              </div>
            </div>

            {datosImportados && datosImportados.length > 0 && (
              <Alert variant="success" className="mt-3">
                Los datos están listos para importar. Al confirmar, se agregarán {datosImportados.length} nuevos registros a la modalidad {modalidadLabel}.
              </Alert>
            )}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancelar
        </Button>
        
        {paso === 2 && (
          <Button 
            variant="primary" 
            onClick={handleProcesarArchivo}
            disabled={cargando}
          >
            {cargando ? 'Procesando...' : 'Procesar Datos'}
          </Button>
        )}

        {paso === 3 && (
          <Button 
            variant="success" 
            onClick={handleConfirmarImportacion}
            disabled={!datosImportados || datosImportados.length === 0}
          >
            Confirmar Importación
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ModalImportarExcel;
