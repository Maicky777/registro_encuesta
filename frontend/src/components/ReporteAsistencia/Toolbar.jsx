import PropTypes from 'prop-types'

export default function Toolbar({
  userBrigadas,
  brigadaSel,
  onBrigadaChange,
  personalProp,
  searchTerm,
  onSearchChange,
  isDirty,
  saving,
  onGuardar,
  saveMessage,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {userBrigadas.length > 0 && !personalProp && (
        <div className="flex items-center gap-2">
          <label
            htmlFor="brigada-sel"
            className="text-[11px] font-semibold uppercase text-gray-500"
          >
            Brigada:
          </label>
          <select
            id="brigada-sel"
            value={brigadaSel}
            onChange={(e) => onBrigadaChange(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none"
          >
            <option value="">Todas</option>
            {userBrigadas.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nombre o usuario..."
          className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-400 pl-6 w-48"
        />
        <svg
          className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <div className="flex-1" />

      {isDirty && (
        <span className="text-amber-600 text-[11px] font-semibold flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Cambios sin guardar
        </span>
      )}

      {!personalProp && (
        <button
          onClick={onGuardar}
          disabled={saving}
          aria-busy={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold px-4 py-1.5 rounded shadow transition-all text-xs flex items-center gap-1"
        >
          {saving ? 'Guardando...' : 'Guardar Asistencia'}
          <span className="text-[9px] opacity-60 ml-0.5">Ctrl+S</span>
        </button>
      )}
      {saveMessage.text && (
        <span
          role="status"
          aria-live="polite"
          className={`text-xs font-semibold ${
            saveMessage.type === 'error'
              ? 'text-red-500'
              : saveMessage.type === 'warning'
                ? 'text-amber-500'
                : 'text-green-600'
          }`}
        >
          {saveMessage.text}
        </span>
      )}
    </div>
  )
}

Toolbar.propTypes = {
  userBrigadas: PropTypes.arrayOf(PropTypes.string),
  brigadaSel: PropTypes.string,
  onBrigadaChange: PropTypes.func,
  personalProp: PropTypes.array,
  searchTerm: PropTypes.string,
  onSearchChange: PropTypes.func,
  isDirty: PropTypes.bool,
  saving: PropTypes.bool,
  onGuardar: PropTypes.func,
  saveMessage: PropTypes.shape({
    text: PropTypes.string,
    type: PropTypes.string,
  }),
}
