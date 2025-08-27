import React from 'react';

const ModalReporte = ({
  show,
  onClose,
  camposTabla,
  camposReporte,
  handleCampoReporteChange,
  handleExportExcel,
  handleExportPDF
}) => {
  if (!show) return null;
  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <form onSubmit={e => e.preventDefault()}>
            <div className="modal-header bg-secondary text-white">
              <h5 className="modal-title">Selecciona los campos para el reporte</h5>
              <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
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