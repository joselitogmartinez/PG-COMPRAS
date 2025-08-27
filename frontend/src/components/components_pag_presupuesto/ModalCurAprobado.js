import React, { useState, useEffect } from 'react';

const ModalCurAprobado = ({ show, onClose, onSave, expediente }) => {
  const [curAprobado, setCurAprobado] = useState('');

  useEffect(() => {
    setCurAprobado(expediente?.cur_aprobado || '');
  }, [expediente]);

  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <form onSubmit={e => { e.preventDefault(); onSave(curAprobado); }}>
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">Registrar CUR Aprobado</h5>
              <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                className="form-control"
                placeholder="CUR Aprobado"
                value={curAprobado}
                onChange={e => setCurAprobado(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalCurAprobado;