import React from 'react';
import { OPCIONES_ESTATUS_EVENTO } from '../../utils/constantes';

const Filtros = ({ modalidad, filtros, setFiltros }) => (
  <div className="px-4 py-3 bg-light border-bottom">
    {modalidad === 'directa' && (
      <div className="row g-2">
        <div className="col">
          <select 
            className="form-select" 
            value={filtros.estado_evento || ''} 
            onChange={e => setFiltros(f => ({ ...f, estado_evento: e.target.value }))}
          >
            <option value="">Estado del Evento</option>
            {OPCIONES_ESTATUS_EVENTO.map((opcion, index) => (
              <option key={index} value={opcion}>{opcion}</option>
            ))}
          </select>
        </div>
        <div className="col">
          <input className="form-control" placeholder="NIT Proveedor" value={filtros.nit_adjudicado || ''} onChange={e => setFiltros(f => ({ ...f, nit_adjudicado: e.target.value }))} />
        </div>
        <div className="col">
          <input className="form-control" placeholder="No. NOG" value={filtros.no_nog || ''} onChange={e => setFiltros(f => ({ ...f, no_nog: e.target.value }))} />
        </div>
        <div className="col">
          <input className="form-control" placeholder="No. Identificación" value={filtros.no_identificacion || ''} onChange={e => setFiltros(f => ({ ...f, no_identificacion: e.target.value }))} />
        </div>
        <div className="col">
          <input className="form-control" placeholder="Renglón" value={filtros.renglon || ''} onChange={e => setFiltros(f => ({ ...f, renglon: e.target.value }))} />
        </div>
        <div className="col">
          <input className="form-control" placeholder="Solicitud" value={filtros.solicitud || ''} onChange={e => setFiltros(f => ({ ...f, solicitud: e.target.value }))} />
        </div>
        <div className="col">
          <input className="form-control" placeholder="No. OC" value={filtros.no_oc || ''} onChange={e => setFiltros(f => ({ ...f, no_oc: e.target.value }))} />
        </div>
        <div className="col">
          <select className="form-select" value={filtros.finalizado || ''} onChange={e => setFiltros(f => ({ ...f, finalizado: e.target.value }))}>
            <option value="">Finalizado?</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </div>
        <div className="col">
          <select
            className="form-select"
            value={filtros.areaActual || ''}
            onChange={e => setFiltros(f => ({ ...f, areaActual: e.target.value }))}
          >
            <option value="">Área Actual</option>
            <option value="COMPRAS">Compras</option>
            <option value="PRESUPUESTO">Presupuesto</option>
            <option value="CONTABILIDAD">Contabilidad</option>
            <option value="TESORERIA">Tesorería</option>
          </select>
        </div>
      </div>
    )}
    {modalidad === 'abierto' && (
      <div className="row g-2">
        <div className="col">
          <input className="form-control" placeholder="NIT Proveedor" value={filtros.nit_adjudicado || ''} onChange={e => setFiltros(f => ({ ...f, nit_adjudicado: e.target.value }))} />
        </div>
        <div className="col">
          <input className="form-control" placeholder="No. NOG" value={filtros.no_nog || ''} onChange={e => setFiltros(f => ({ ...f, no_nog: e.target.value }))} />
        </div>
        <div className="col">
          <input className="form-control" placeholder="Renglón" value={filtros.renglon || ''} onChange={e => setFiltros(f => ({ ...f, renglon: e.target.value }))} />
        </div>
        <div className="col">
          <input className="form-control" placeholder="Solicitud" value={filtros.solicitud || ''} onChange={e => setFiltros(f => ({ ...f, solicitud: e.target.value }))} />
        </div>
        <div className="col">
          <input className="form-control" placeholder="No. OC" value={filtros.no_oc || ''} onChange={e => setFiltros(f => ({ ...f, no_oc: e.target.value }))} />
        </div>
        <div className="col">
          <select className="form-select" value={filtros.finalizado || ''} onChange={e => setFiltros(f => ({ ...f, finalizado: e.target.value }))}>
            <option value="">Finalizado</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </div>
        <div className="col">
          <select
            className="form-select"
            value={filtros.areaActual || ''}
            onChange={e => setFiltros(f => ({ ...f, areaActual: e.target.value }))}
          >
            <option value="">Área Actual</option>
            <option value="COMPRAS">Compras</option>
            <option value="PRESUPUESTO">Presupuesto</option>
            <option value="CONTABILIDAD">Contabilidad</option>
            <option value="TESORERIA">Tesorería</option>
          </select>
        </div>
      </div>
    )}
    {modalidad === 'baja' && (
      <div className="row g-2">
        <div className="col">
          <input className="form-control" placeholder="NIT Proveedor" value={filtros.nit_adjudicado || ''} onChange={e => setFiltros(f => ({ ...f, nit_adjudicado: e.target.value }))} />
        </div>
        <div className="col">
          <input className="form-control" placeholder="No. NPG" value={filtros.npg || ''} onChange={e => setFiltros(f => ({ ...f, npg: e.target.value }))} />
        </div>
        <div className="col">
          <input className="form-control" placeholder="Renglón" value={filtros.renglon || ''} onChange={e => setFiltros(f => ({ ...f, renglon: e.target.value }))} />
        </div>
        <div className="col">
          <input className="form-control" placeholder="Solicitud" value={filtros.solicitud || ''} onChange={e => setFiltros(f => ({ ...f, solicitud: e.target.value }))} />
        </div>
        <div className="col">
          <input className="form-control" placeholder="No. OC" value={filtros.no_oc || ''} onChange={e => setFiltros(f => ({ ...f, no_oc: e.target.value }))} />
        </div>
        <div className="col">
          <select className="form-select" value={filtros.finalizado || ''} onChange={e => setFiltros(f => ({ ...f, finalizado: e.target.value }))}>
            <option value="">Finalizado</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </div>
        <div className="col">
          <select
            className="form-select"
            value={filtros.areaActual || ''}
            onChange={e => setFiltros(f => ({ ...f, areaActual: e.target.value }))}
          >
            <option value="">Área Actual</option>
            <option value="COMPRAS">Compras</option>
            <option value="PRESUPUESTO">Presupuesto</option>
            <option value="CONTABILIDAD">Contabilidad</option>
            <option value="TESORERIA">Tesorería</option>
          </select>
        </div>
      </div>
    )}
  </div>
);

export default Filtros;