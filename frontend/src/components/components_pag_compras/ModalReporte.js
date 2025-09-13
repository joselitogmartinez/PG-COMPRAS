import React from 'react';

const ModalReporte = ({
  show,
  onClose,
  camposTabla,
  camposReporte,
  handleCampoReporteChange,
  handleToggleSeleccionTodos,
  allSelected,
  modalidad,
  onModalidadFiltroChange,
  extraCampos = [],
  handleExportExcel,
  handleExportPDF
}) => {
  if (!show) return null;
  const camposFull = [...camposTabla, ...extraCampos];
  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="modal-dialog modal-xl">
  <div className="modal-content report-modal" style={{ borderRadius: 14, overflow: 'hidden' }}>
          <form onSubmit={e => e.preventDefault()}>
            <div className="modal-header text-white" style={{ background: 'linear-gradient(135deg, #1a73e8, #1557b0)' }}>
              <h5 className="modal-title">Selecciona los campos para el reporte</h5>
              <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              {/* Barra de acciones */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="seleccionar-todos" checked={allSelected} onChange={handleToggleSeleccionTodos} />
                  <label className="form-check-label" htmlFor="seleccionar-todos">Seleccionar/Deseleccionar todos</label>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <label className="form-label mb-0 me-2">Modalidad:</label>
                  <select className="form-select" style={{ minWidth: 240 }} value={modalidad} onChange={e => onModalidadFiltroChange(e.target.value)}>
        <option value="directa">Compra Directa</option>
        <option value="baja">Baja Cuantía</option>
        <option value="abierto">Contrato Abierto</option>
                  </select>
                </div>
              </div>

      <div className="row g-2">
                {[0, 1, 2].map(colIdx => (
      <div className="col-12 col-md-4" key={colIdx}>
        {camposFull
                      .filter((_, idx) => idx % 3 === colIdx)
                      .map(campo => (
                        <div className="form-check mb-1" key={campo.name}>
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
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalReporte;