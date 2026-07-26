import React from 'react'

const ModalAlert = ({ show, message, type, onClose }) => {
  if (!show) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content alert-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`alert-icon alert-icon-${type}`}>
          {type === 'success' && '✓'}
          {type === 'error' && '✕'}
          {type === 'warning' && '⚠'}
          {type === 'info' && 'ℹ'}
        </div>
        <p className="alert-message">{message}</p>
        <button
          className={`btn-alert-${type}`}
          onClick={onClose}
        >
          Aceptar
        </button>
      </div>
    </div>
  )
}

export default React.memo(ModalAlert)
