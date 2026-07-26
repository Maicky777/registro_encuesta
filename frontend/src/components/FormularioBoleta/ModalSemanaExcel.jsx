import React from 'react'

const ModalSemanaExcel = ({ show, semanaExcel, onChange, onConfirm, onCancel }) => {
  if (!show) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-content confirm-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="alert-icon alert-icon-info">📊</div>
        <p className="alert-message">
          Ingrese el número de <strong>semana</strong> para generar el
          reporte Excel:
        </p>
        <input
          type="number"
          min="1"
          step="1"
          className="form-control"
          placeholder="Ej: 3"
          value={semanaExcel}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirm()
            if (e.key === 'Escape') onCancel()
          }}
          autoFocus
          style={{ margin: '0.75rem 0', textAlign: 'center' }}
        />
        <div className="confirm-buttons">
          <button
            className="btn-confirm-cancel"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className="btn-confirm-ok"
            onClick={onConfirm}
          >
            Generar Reporte
          </button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(ModalSemanaExcel)
