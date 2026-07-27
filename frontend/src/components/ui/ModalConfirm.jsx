import React from 'react'

const ModalConfirm = ({ show, message, onConfirm, onCancel }) => {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
      <div
        className="bg-white rounded-lg max-w-[380px] w-[90%] shadow-xl text-center p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold text-white bg-amber-500 text-slate-800">?</div>
        <p className="text-[0.95rem] text-slate-600 leading-relaxed mb-5 text-center">{message}</p>
        <div className="flex gap-3">
          <button
            className="flex-1 py-2.5 border border-slate-300 rounded-md bg-white text-slate-600 text-[0.9rem] font-semibold cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className="flex-1 py-2.5 border-none rounded-md bg-red-600 text-white text-[0.9rem] font-semibold cursor-pointer hover:bg-red-700 transition-colors"
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
