import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const tiposPago = [
  { value: 'ACREDITAMIENTO A CUENTA', label: 'Acreditamiento a cuenta' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CAJA CHICA', label: 'Caja chica' },
];

const ModalPagado = ({ show, onClose, onSave, expediente }) => {
  const [fechaPago, setFechaPago] = useState('');
  const [tipoPago, setTipoPago] = useState('');
  const [chequeNumero, setChequeNumero] = useState('');

  const handleSave = () => {
    let tipoPagoFinal = tipoPago.toUpperCase();
    if (tipoPagoFinal === 'CHEQUE' && chequeNumero.trim()) {
      let chequeNum = chequeNumero.trim();
      const year = new Date().getFullYear();
      if (/^\d{3,}-\d{4}$/.test(chequeNum)) {
        tipoPagoFinal = `CHEQUE ${chequeNum}`;
      } else if (/^\d{3,}$/.test(chequeNum)) {
        tipoPagoFinal = `CHEQUE ${chequeNum}-${year}`;
      } else if (!chequeNum.toUpperCase().startsWith('CHEQUE ')) {
        tipoPagoFinal = `CHEQUE ${chequeNum}`;
      } else {
        tipoPagoFinal = chequeNum.toUpperCase();
      }
      tipoPagoFinal = tipoPagoFinal.toUpperCase();
    }
    const data = {
      fecha_pago: fechaPago,
      tipo_pago: tipoPagoFinal,
      pagado: true
    };
    onSave(data);
  };

  React.useEffect(() => {
    if (show) {
      setFechaPago(expediente?.fecha_pago ? expediente.fecha_pago.substring(0, 10) : '');
      setTipoPago(expediente?.tipo_pago || '');
      setChequeNumero(expediente?.cheque_numero || '');
    }
  }, [show, expediente]);

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Procesar Pago</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <label className="form-label">Fecha de Pago</label>
          <input
            type="date"
            className="form-control"
            value={fechaPago}
            onChange={e => setFechaPago(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Tipo de Pago</label>
          {tiposPago.map(tp => (
            <div className="form-check" key={tp.value}>
              <input
                className="form-check-input"
                type="radio"
                name="tipoPago"
                id={tp.value}
                value={tp.value}
                checked={tipoPago === tp.value}
                onChange={e => setTipoPago(e.target.value)}
              />
              <label className="form-check-label" htmlFor={tp.value}>
                {tp.label}
              </label>
            </div>
          ))}
        </div>
        {tipoPago === 'CHEQUE' && (
          <div className="mb-3">
            <label className="form-label">Número de Cheque</label>
            <input
              type="text"
              className="form-control"
              value={chequeNumero}
              onChange={e => setChequeNumero(e.target.value)}
            />
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={!fechaPago || !tipoPago || (tipoPago === 'CHEQUE' && !chequeNumero)}>
          Guardar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalPagado;
