import PropTypes from 'prop-types'

const INPUT_CLS =
  'w-full text-center bg-transparent py-1 focus:bg-amber-50 focus:outline-none disabled:text-gray-400 disabled:cursor-not-allowed text-[11px]'

const CELDA_CLS = 'border-r border-gray-100 p-0 text-center'

const STATUS_DOT = {
  'ASISTENCIA': 'bg-green-500',
  'FALTA': 'bg-red-500',
  'VACACIONES': 'bg-blue-500',
  'INCAPACIDAD': 'bg-orange-500',
}

const STATUS_CYCLE = ['ASISTENCIA', 'FALTA', 'VACACIONES', 'INCAPACIDAD', 'N/A']

const OPCIONES_FOTO = [
  { value: 'GRUPAL', label: 'FOTOGRAFIA GRUPAL Y PUNTO' },
  { value: 'PERSONAL', label: 'FOTOGRAFIA PERSONAL Y PUNTO' },
  { value: 'SOLOFOTOGRAFIA', label: 'SOLO FOTOGRAFÍA' },
  { value: 'SPUNTO', label: 'SOLO PUNTO' },
  { value: 'SSENAL', label: 'SIN SEÑAL' },
  { value: 'SR', label: 'S/R' },
]

export default function CeldasTurno({ datosTurno = {}, onChangeCampo, turno, oculto, primero, paso = 1 }) {
  const isDisabled =
    datosTurno.estatus === 'FALTA' || datosTurno.estatus === 'N/A'

  const campoPermitido = (campo) => {
    if (turno === 't1') {
      if (paso === 1) return ['estatus', 'ingreso', 'fIngreso'].includes(campo)
      return true
    }
    if (turno === 't2') {
      if (paso <= 2) return false
      if (paso === 3) return ['estatus', 'ingreso', 'fIngreso'].includes(campo)
      return true
    }
    return true
  }

  const bgClass =
    datosTurno.estatus === 'ASISTENCIA'
      ? 'bg-green-50'
      : datosTurno.estatus === 'FALTA'
        ? 'bg-red-50'
        : ''

  const handleStatusClick = () => {
    if (!campoPermitido('estatus')) return
    const currentIdx = STATUS_CYCLE.indexOf(datosTurno.estatus || 'N/A')
    const nextIdx = (currentIdx + 1) % STATUS_CYCLE.length
    onChangeCampo?.('estatus', STATUS_CYCLE[nextIdx])
  }

  return (
    <>
      <td className={`${CELDA_CLS} w-6 ${oculto ? 'hidden' : ''} ${primero ? 'border-l-2 border-l-indigo-300' : ''}`}>
        <div
          className={`w-2.5 h-2.5 rounded-full mx-auto ${STATUS_DOT[datosTurno.estatus] || 'bg-gray-300'} cursor-pointer transition-transform hover:scale-125`}
          title={datosTurno.estatus}
          onClick={handleStatusClick}
        />
      </td>

      <td className={`${CELDA_CLS} ${bgClass} ${oculto ? 'hidden' : ''} relative`}>
        <div className="flex flex-col items-stretch">
          <span className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold leading-tight px-1">Ingreso</span>
          <div className="flex items-center gap-0.5">
            <input
              type="time"
              value={datosTurno.ingreso || ''}
              onChange={(e) => onChangeCampo?.('ingreso', e.target.value)}
              disabled={isDisabled || !campoPermitido('ingreso')}
              aria-label={`Ingreso turno ${turno}`}
              className={INPUT_CLS}
            />
          </div>
        </div>
      </td>
      <td className={`${CELDA_CLS} min-w-[130px] ${bgClass} ${oculto ? 'hidden' : ''}`}>
        <select
          value={datosTurno.fIngreso || ''}
          onChange={(e) => onChangeCampo?.('fIngreso', e.target.value)}
          disabled={isDisabled || !campoPermitido('fIngreso')}
          aria-label={`Foto ingreso turno ${turno}`}
          className="w-full bg-transparent focus:outline-none text-[11px] cursor-pointer font-bold text-center"
        >
          <option value="">--</option>
          {OPCIONES_FOTO.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </td>

      <td className={`w-6 p-0 text-center border-r border-gray-100 ${bgClass} ${oculto ? 'hidden' : ''} align-middle`}>
        <svg className="w-4 h-4 mx-auto text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </td>

      <td className={`${CELDA_CLS} ${bgClass} ${oculto ? 'hidden' : ''} relative`}>
        <div className="flex flex-col items-stretch">
          <span className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold leading-tight px-1">Salida</span>
          <div className="flex items-center gap-0.5">
            <input
              type="time"
              value={datosTurno.salida || ''}
              onChange={(e) => onChangeCampo?.('salida', e.target.value)}
              disabled={isDisabled || !campoPermitido('salida')}
              aria-label={`Salida turno ${turno}`}
              className={INPUT_CLS}
            />
          </div>
        </div>
      </td>
      <td className={`${CELDA_CLS} min-w-[130px] ${bgClass} ${oculto ? 'hidden' : ''}`}>
        <select
          value={datosTurno.fSalida || ''}
          onChange={(e) => onChangeCampo?.('fSalida', e.target.value)}
          disabled={isDisabled || !campoPermitido('fSalida')}
          aria-label={`Foto salida turno ${turno}`}
          className="w-full bg-transparent focus:outline-none text-[11px] cursor-pointer font-bold text-center"
        >
          <option value="">--</option>
          {OPCIONES_FOTO.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </td>
      <td className={`border-r border-gray-300 p-0 text-center min-w-[160px] ${bgClass} ${oculto ? 'hidden' : ''}`}>
        <input
          type="text"
          value={datosTurno.observacion || ''}
          onChange={(e) => onChangeCampo?.('observacion', e.target.value)}
          maxLength={200}
          disabled={isDisabled || !campoPermitido('observacion')}
          aria-label={`Observación turno ${turno}`}
          className={INPUT_CLS}
          placeholder="Observación..."
        />
      </td>
    </>
  )
}

CeldasTurno.propTypes = {
  datosTurno: PropTypes.shape({
    estatus: PropTypes.string,
    ingreso: PropTypes.string,
    salida: PropTypes.string,
    fIngreso: PropTypes.string,
    fSalida: PropTypes.string,
    observacion: PropTypes.string,
  }),
  onChangeCampo: PropTypes.func,
  turno: PropTypes.string,
  paso: PropTypes.number,
  oculto: PropTypes.bool,
  primero: PropTypes.bool,
}
