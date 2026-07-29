import PropTypes from 'prop-types'

export default function SemanaNavigator({ semana, cycle, onChange, dateRange }) {
  return (
    <div className="flex items-center gap-2 bg-slate-50 border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
      <button
        onClick={() => {
          if (semana === 1) onChange(13, cycle - 1)
          else onChange(semana - 1, cycle)
        }}
        className="p-1 hover:bg-slate-100 rounded transition-colors"
        aria-label="Semana anterior"
      >
        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div className="text-center min-w-[160px]">
        <div className="text-xs font-bold text-slate-800">
          <span className="bg-blue-600 text-white rounded px-1.5 py-0.5 text-[11px] mr-1">SEMANA</span>
          {semana}/13
        </div>
        <div className="text-[10px] text-slate-500 font-medium">{dateRange}</div>
      </div>
      <button
        onClick={() => {
          if (semana === 13) onChange(1, cycle + 1)
          else onChange(semana + 1, cycle)
        }}
        className="p-1 hover:bg-slate-100 rounded transition-colors"
        aria-label="Semana siguiente"
      >
        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}

SemanaNavigator.propTypes = {
  semana: PropTypes.number.isRequired,
  cycle: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  dateRange: PropTypes.string,
}
