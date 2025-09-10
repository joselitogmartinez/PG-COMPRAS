import React, { useState, useEffect } from 'react';

// Generalizado: permite editar cualquier campo string de expediente
const ModalAreas = ({ show, onClose, onSave, expediente, fieldName = 'cur_aprobado', label = 'CUR Aprobado' }) => {
  const [valor, setValor] = useState('');

  useEffect(() => {
    setValor(expediente?.[fieldName] || '');
  }, [expediente, fieldName]);

  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <form onSubmit={e => { e.preventDefault(); onSave(valor); }}>
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">Registrar {label}</h5>
              <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                className="form-control"
                placeholder={label}
                value={valor}
                onChange={e => setValor(e.target.value)}
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

export default ModalAreas;