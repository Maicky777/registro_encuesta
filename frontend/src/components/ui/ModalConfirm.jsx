import React from 'react'

const ModalConfirm = ({ show, message, onConfirm, onCancel }) => {
  if (!show) return null

  return (
    <div className="modal-overlay">
      <div
        className="modal-content confirm-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="alert-icon alert-icon-warning">?</div>
        <p className="alert-message">{message}</p>
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
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(ModalConfirm)
