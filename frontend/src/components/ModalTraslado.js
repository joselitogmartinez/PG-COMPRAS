const ModalTraslado = ({ show, onClose, onTrasladar }) => {
  if (!show) return null;
  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
      <div className="modal-dialog modal-sm">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">¿A dónde trasladar?</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body d-flex flex-column gap-2">
            <button className="btn btn-primary" onClick={() => onTrasladar('compras')}>Compras</button>
            <button className="btn btn-info" onClick={() => onTrasladar('presupuesto')}>Presupuesto</button>
            <button className="btn btn-success" onClick={() => onTrasladar('contabilidad')}>Contabilidad</button>
            <button className="btn btn-warning" onClick={() => onTrasladar('tesoreria')}>Tesorería</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalTraslado;