import React from 'react'

const TYPE_STYLES = {
  success: {
    icon: 'bg-green-600',
    btn: 'bg-green-600 hover:bg-green-700',
    symbol: '✓',
  },
  error: {
    icon: 'bg-red-600',
    btn: 'bg-red-600 hover:bg-red-700',
    symbol: '✕',
  },
  warning: {
    icon: 'bg-amber-500 text-slate-800',
    btn: 'bg-amber-500 text-slate-800 hover:bg-amber-600',
    symbol: '⚠',
  },
  info: {
    icon: 'bg-blue-600',
    btn: 'bg-blue-600 hover:bg-blue-700',
    symbol: 'ℹ',
  },
}

const ModalAlert = ({ show, message, type, onClose }) => {
  if (!show) return null

  const styles = TYPE_STYLES[type] || TYPE_STYLES.info

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-[360px] w-[90%] shadow-xl text-center p-6" onClick={(e) => e.stopPropagation()}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold text-white ${styles.icon}`}>
          {styles.symbol}
        </div>
        <p className="text-[0.95rem] text-slate-600 leading-relaxed mb-5 text-center">{message}</p>
        <button
          className={`block w-full py-2.5 border-none rounded-md text-[0.9rem] font-semibold cursor-pointer text-white transition-opacity ${styles.btn}`}
          onClick={onClose}
        >
          Aceptar
        </button>
      </div>
    </div>
  )
}

export default React.memo(ModalAlert)
