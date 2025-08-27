import React from 'react';
  import { MODALIDADES, CAMPOS_MODALIDAD } from '../../utils/constantes';


  const ModalExpediente = ({
    show,
    onClose,
    onSubmit,
    form,
    setForm,
    modalidad,
    editando,
    mensaje,
    showMensaje,
    setShowMensaje,
    handleChange
  }) => {
    if (!show) return null;
    return (
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{
          background: 'rgba(64, 64, 64, 0.75)', // Gris suave y difuminado
          backdropFilter: 'blur(2px)', // Difumina el fondo
          minHeight: '100vh'
        }}
      >
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <form onSubmit={onSubmit}>
              <div
                className="modal-header bg-primary text-white"
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 2,
                  borderTopLeftRadius: '0.5rem',
                  borderTopRightRadius: '0.5rem'
                }}
              >
                <h5 className="modal-title">
                  {editando ? 'Editar Expediente' : 'Registrar Expediente'} ({MODALIDADES.find(m => m.key === modalidad).label})
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
              </div>
              <div
                className="modal-body"
                style={{
                  maxHeight: '60vh',
                  overflowY: 'auto'
                }}
              >
                <div className="container-fluid">
                  <div className="row">
                    {CAMPOS_MODALIDAD[modalidad].map((campo, idx) => {
                      // Campos que deben ser grandes
                      const camposGrandes = [
                        'descripcion_evento',
                        'producto'
                      ];
                      // Campos que deben ser MEDIANOS
                      const camposMedianos = [
                        'observaciones',	
                        'proveedor'	
                      ];
                      const esGrande = camposGrandes.includes(campo.name);
                      const esMediano = camposMedianos.includes(campo.name);
                      const valorCampo = form[campo.name] || '';
                      const claseVacio = editando && campo.type !== 'checkbox' && campo.type !== 'textarea' && valorCampo === '' ? 'input-vacio' : '';
              
                      let colClass = 'col-md-2 mb-3';
                      if (esGrande) colClass = 'col-10 mb-3';
                      else if (esMediano) colClass = 'col-md-6 mb-3';

                      return (
                        <div key={campo.name} className={colClass}>
                          <label className="form-label">{campo.label}</label>
                          {campo.type === 'textarea' ? (
                            <textarea
                              className={`form-control ${claseVacio}`}
                              name={campo.name}
                              value={valorCampo}
                              onChange={handleChange}
                              disabled={campo.disabled}
                              rows={esGrande ? 4 : 2}
                            />
                          ) : campo.type === 'checkbox' ? (
                            <div className="form-check mt-2">
                              <input
                                className={`form-check-input ${campo.name === 'finalizado' ? 'check-finalizado-grande' : ''}`}
                                type="checkbox"
                                name={campo.name}
                                checked={!!form[campo.name]}
                                onChange={handleChange}
                                disabled={campo.disabled}
                                id={campo.name}
                              />
                              <label className="form-check-label" htmlFor={campo.name}></label>
                            </div>
                          ) : campo.name === 'modalidad' ? (
                            <select
                              className="form-select"
                              name="modalidad"
                              value={form.modalidad || ''}
                              onChange={handleChange}
                              required
                              disabled
                            >
                              <option value="">Seleccione modalidad</option>
                              <option value="COMPRA DIRECTA">COMPRA DIRECTA</option>
                              <option value="CONTRATO ABIERTO">CONTRATO ABIERTO</option>
                              <option value="BAJA CUANTÍA">BAJA CUANTÍA</option>
                            </select>
                          ) : (
                            <input
                              className={`form-control ${claseVacio}`}
                              type={campo.type}
                              name={campo.name}
                              value={valorCampo}
                              onChange={handleChange}
                              disabled={campo.disabled}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* {mensaje && <div className="alert alert-info">{mensaje}</div>} */}
                  {mensaje && showMensaje && (
                    <div
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(0,0,0,0.3)',
                        zIndex: 2000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <div
                        style={{
                          background: '#fff',
                          borderRadius: 8,
                          padding: 32,
                          minWidth: 280,
                          boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ marginBottom: 16 }}>{mensaje}</div>
                        <button
                          className="btn btn-primary"
                          onClick={() => setShowMensaje(false)}
                        >
                          Aceptar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div
                className="modal-footer"
                style={{
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 2,
                  background: '#fff',
                  borderBottomLeftRadius: '0.5rem',
                  borderBottomRightRadius: '0.5rem'
                }}
              >
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  export default ModalExpediente;