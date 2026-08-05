import React from 'react'
import { SEMANA_MIN, SEMANA_MAX } from '../../utils/constants'

const ModalSemanaExcel = ({ show, semanaExcel, onChange, onConfirm, onCancel }) => {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={onCancel}>
      <div
        className="bg-white rounded-lg max-w-[380px] w-[90%] shadow-xl text-center p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold text-white bg-blue-600">📊</div>
        <p className="text-[0.95rem] text-slate-600 leading-relaxed mb-5 text-center">
          Ingrese el número de <strong>semana</strong> para generar el
          reporte Excel:
        </p>
        <input
          type="number"
          min={SEMANA_MIN}
          max={SEMANA_MAX}
          step="1"
          className="w-full px-2.5 py-1.5 text-[0.82rem] border border-slate-300 rounded bg-white text-slate-900 transition-colors outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/15 my-3 text-center"
          placeholder="Ej: 3"
          value={semanaExcel}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirm()
            if (e.key === 'Escape') onCancel()
          }}
          autoFocus
        />
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
            Generar Reporte
          </button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(ModalSemanaExcel)
