import PropTypes from 'prop-types'

export default function DayTabs({ dias, selectedDay, onSelect }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {dias.map((d) => {
        const isActive = selectedDay === d.id
        const esFinSemana = d.id === 'sab' || d.id === 'dom'
        return (
          <button
            key={d.id}
            onClick={() => onSelect(d.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isActive
                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300 scale-105'
                : esFinSemana
                  ? 'bg-amber-50 text-slate-600 hover:bg-amber-100 border border-amber-200'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-gray-200'
            }`}
          >
            <span>{d.nombre}</span>
            <span className="ml-1.5 text-[10px] opacity-75">{d.fecha}</span>
          </button>
        )
      })}
    </div>
  )
}

DayTabs.propTypes = {
  dias: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      nombre: PropTypes.string,
      fecha: PropTypes.string,
    }),
  ).isRequired,
  selectedDay: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
}
