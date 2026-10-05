import React from 'react'
import { SEMANA_MIN, SEMANA_MAX, TRIMESTRES } from '../../utils/constants'
import { getTrimestreActual, getSemanaActual } from '../../utils/helpers'

const TRIMESTRE_OPTIONS = [...TRIMESTRES].sort((a, b) => a - b)

const ModalSemanaExcel = ({
  show,
  trimestreExcel = getTrimestreActual(),
  semanaExcel = getSemanaActual(),
  onChangeTrimestre,
  onChangeSemana,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={onCancel}>
      <div
        className="bg-white rounded-lg max-w-[380px] w-[90%] shadow-xl text-center p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold text-white bg-blue-600">📊</div>
        <p className="text-[0.95rem] text-slate-600 leading-relaxed mb-4 text-center">
          Seleccione <strong>trimestre</strong> y <strong>semana</strong> para generar el reporte Excel:
        </p>
        <div className="mb-3">
          <label className="block text-[0.75rem] font-bold text-slate-500 mb-1 uppercase tracking-[0.15em] text-left">
            Trimestre
          </label>
          <select
            className="w-full px-2.5 py-1.5 text-[0.82rem] border border-slate-300 rounded bg-white text-slate-900 transition-colors outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/15 text-left"
            value={trimestreExcel}
            onChange={(e) => onChangeTrimestre(e.target.value)}
          >
            {TRIMESTRE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                TRIM-{t}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-[0.75rem] font-bold text-slate-500 mb-1 uppercase tracking-[0.15em] text-left">
            Semana
          </label>
          <input
            type="number"
            min={SEMANA_MIN}
            max={SEMANA_MAX}
            step="1"
            className="w-full px-2.5 py-1.5 text-[0.82rem] border border-slate-300 rounded bg-white text-slate-900 transition-colors outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/15 text-left"
            placeholder="Ej: 3"
            value={semanaExcel}
            onChange={(e) => onChangeSemana(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') !loading && onConfirm()
              if (e.key === 'Escape') onCancel()
            }}
          />
        </div>
        <div className="flex gap-3">
          <button
            className="flex-1 py-2.5 border border-slate-300 rounded-md bg-white text-slate-600 text-[0.9rem] font-semibold cursor-pointer hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className="flex-1 py-2.5 border-none rounded-md bg-red-600 text-white text-[0.9rem] font-semibold cursor-pointer hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Generando...' : 'Generar Reporte'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(ModalSemanaExcel)
