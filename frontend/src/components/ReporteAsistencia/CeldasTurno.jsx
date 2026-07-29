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

export default function CeldasTurno({ datosTurno = {}, onChangeCampo, turno, oculto }) {
  const isDisabled =
    datosTurno.estatus === 'FALTA' || datosTurno.estatus === 'N/A'

  const bgClass =
    datosTurno.estatus === 'ASISTENCIA'
      ? 'bg-green-50'
      : datosTurno.estatus === 'FALTA'
        ? 'bg-red-50'
        : ''

  const ingresoMayorSalida =
    datosTurno.ingreso &&
    datosTurno.salida &&
    datosTurno.ingreso > datosTurno.salida

  const handleStatusClick = () => {
    const currentIdx = STATUS_CYCLE.indexOf(datosTurno.estatus || 'N/A')
    const nextIdx = (currentIdx + 1) % STATUS_CYCLE.length
    onChangeCampo?.('estatus', STATUS_CYCLE[nextIdx])
  }

  return (
    <>
      <td className={`${CELDA_CLS} w-6 ${oculto ? 'hidden' : ''}`}>
        <div
          className={`w-2.5 h-2.5 rounded-full mx-auto ${STATUS_DOT[datosTurno.estatus] || 'bg-gray-300'} cursor-pointer transition-transform hover:scale-125`}
          title={datosTurno.estatus}
          onClick={handleStatusClick}
        />
      </td>
      <td className={`${CELDA_CLS} ${bgClass} ${oculto ? 'hidden' : ''}`}>
        <div className="flex items-center gap-0.5">
          <input
            type="time"
            value={datosTurno.ingreso || ''}
            onChange={(e) => onChangeCampo?.('ingreso', e.target.value)}
            disabled={isDisabled}
            aria-label={`Ingreso turno ${turno}`}
            className={INPUT_CLS}
          />
          {ingresoMayorSalida && (
            <span className="text-red-400 text-[9px]" title="Ingreso mayor a salida">⚠</span>
          )}
        </div>
      </td>
      <td className={`${CELDA_CLS} min-w-[140px] ${bgClass} ${oculto ? 'hidden' : ''}`}>
        <select
          value={datosTurno.fIngreso || ''}
          onChange={(e) => onChangeCampo?.('fIngreso', e.target.value)}
          disabled={isDisabled}
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
      <td className={`${CELDA_CLS} ${bgClass} ${oculto ? 'hidden' : ''}`}>
        <div className="flex items-center gap-0.5">
          <input
            type="time"
            value={datosTurno.salida || ''}
            onChange={(e) => onChangeCampo?.('salida', e.target.value)}
            disabled={isDisabled}
            aria-label={`Salida turno ${turno}`}
            className={INPUT_CLS}
          />
          {ingresoMayorSalida && (
            <span className="text-red-400 text-[9px]" title="Salida menor a ingreso">⚠</span>
          )}
        </div>
      </td>
      <td className={`${CELDA_CLS} min-w-[140px] ${bgClass} ${oculto ? 'hidden' : ''}`}>
        <select
          value={datosTurno.fSalida || ''}
          onChange={(e) => onChangeCampo?.('fSalida', e.target.value)}
          disabled={isDisabled}
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
          aria-label={`Observación turno ${turno}`}
          className={INPUT_CLS}
          placeholder="Observación..."
        />
      </td>
    </>
  )
}
