import React from 'react'
import { getEstadoClass } from '../../utils/helpers'

const TablaRegistros = ({
  registrosFiltrados,
  filtroGeneral,
  onFiltroChange,
  onEditar,
  onEliminar,
  onDoubleClickCorregir,
  onReporte,
  rol,
}) => {
  return (
    <div className="card-container">
      <div className="card-title">
        <span>Registro de Datos de Boletas (Maick)</span>
        <span className="badge-count">
          {registrosFiltrados.length} Registros
        </span>
      </div>

      <div className="search-box">
        <input
          id="cod-busqueda"
          type="text"
          className="form-control search-input"
          placeholder="🔍 Buscar por cualquier campo (Folio, UPM, Estado, Encuestador...)"
          value={filtroGeneral}
          onChange={(e) => onFiltroChange(e.target.value)}
        />
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Acciones</th>
              <th>N°</th>
              <th>UPM</th>
              <th>Folio</th>
              <th>VOE</th>
              <th>Semana</th>
              <th>Visita</th>
              <th>Panel</th>
              <th>Encuestador</th>
              <th>Estado</th>
              <th>Obs. Total</th>
              <th>Estado Boleta</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {registrosFiltrados.length > 0 ? (
              registrosFiltrados.map((reg) => (
                <tr
                  key={reg.id}
                  onDoubleClick={() => onDoubleClickCorregir(reg)}
                  title={
                    reg.estadoBoleta === 'OBSERVADO'
                      ? 'Doble click para marcar como CORREGIDO'
                      : ''
                  }
                  style={
                    reg.estadoBoleta === 'OBSERVADO'
                      ? { cursor: 'pointer' }
                      : {}
                  }
                >
                  <td>
                    <button
                      className="btn-action edit"
                      onClick={() => onEditar(reg)}
                    >
                      ✏️
                    </button>
                    {rol === 'administrador' && (
                      <button
                        className="btn-action delete"
                        onClick={() => onEliminar(reg.id)}
                      >
                        🗑️
                      </button>
                    )}
                    {reg.estadoBoleta === 'OBSERVADO' && (
                      <button
                        className="btn-action report"
                        onClick={() => onReporte(reg)}
                      >
                        📋
                      </button>
                    )}
                  </td>
                  <td>{reg.numeroCorrelativo}</td>
                  <td>{reg.upm}</td>
                  <td>
                    <strong>{reg.folio}</strong>
                  </td>
                  <td>{reg.voe}</td>
                  <td>{parseInt(reg.semana, 10)}</td>
                  <td>{reg.visita}</td>
                  <td>{reg.panel}</td>
                  <td>{reg.nombreEncuestador}</td>
                  <td>
                    <span
                      className={`form-control ${getEstadoClass(reg.estadoBoleta)}`}
                      style={{ padding: '2px 6px' }}
                    >
                      {reg.estadoBoleta}
                    </span>
                  </td>
                  <td>{reg.totalObservaciones}</td>
                  <td>{reg.observacionBoleta}</td>
                  <td>{reg.fechaFinalConsolidacion}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="14"
                  style={{
                    textAlign: 'center',
                    padding: '1rem',
                    color: '#64748b',
                  }}
                >
                  No hay registros en la base de datos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default React.memo(TablaRegistros)
