import React from 'react'

const ModalReporte = ({ modalData, onClose }) => {
  if (!modalData) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Reporte por Brigada y Semana</h3>
        <p>
          📲 <strong>BOLETA CON VARIACIONES</strong>
        </p>
        <p>
          <strong>BRIGADA:</strong> {modalData.brigada} -{' '}
          <strong>SEMANA:</strong> {parseInt(modalData.semana, 10)}
        </p>

        <p>
          <strong>TOTAL BOLETAS OBSERVADAS:</strong>{' '}
          {modalData.registros.length}
        </p>

        <div className="modal-table-wrapper">
          <table className="modal-table">
            <thead>
              <tr>
                <th>USUARIO</th>
                <th>FOLIO</th>
                <th>TOTAL OBS.</th>
              </tr>
            </thead>
            <tbody>
              {modalData.registros.map((r) => (
                <tr key={r.id}>
                  <td>{r.usuarioEncuestador}</td>
                  <td>{r.folio}</td>
                  <td>{r.totalObservaciones}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#f1f5f9',
            borderRadius: '6px',
            fontSize: '0.85rem',
            textAlign: 'left',
          }}
        >
          <p>
            <span>
              📲 *_Buenas tardes equipo, se adiciona una voe para su
              verificacion y/o correccion_*
            </span>{' '}
            <br />
            <br />
            <strong>*Usuario:*</strong>{' '}
            {modalData.registroSeleccionado.usuarioEncuestador} <br />
            <strong>*Folio:*</strong> {modalData.registroSeleccionado.folio}{' '}
            <br />
            <strong>*Total de Observaciones:*</strong>{' '}
            {modalData.registroSeleccionado.totalObservaciones}
          </p>
        </div>

        <button
          className="btn-submit-corregido"
          onClick={onClose}
          style={{ marginTop: '1rem' }}
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}

export default React.memo(ModalReporte)
