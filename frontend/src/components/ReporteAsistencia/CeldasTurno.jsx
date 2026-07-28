import React from 'react'

const opcionesFoto = [
  { value: 'GRUPAL', label: 'FOTOGRAFÍA GRUPAL Y PUNTO' },
  { value: 'PERSONAL', label: 'FOTOGRAFÍA PERSONAL Y PUNTO' },
  { value: 'SOLOFOTOGRAFIA', label: 'SOLO FOTOGRAFÍA' },
  { value: 'SPUNTO', label: 'SOLO PUNTO' },
  { value: 'SSENAL', label: 'SIN SEÑAL' },
  { value: 'SR', label: 'S/R' },
]

export default function CeldasTurno({
  datosTurno = {},
  onChangeCampo,
  colorEstatusClass,
}) {
  const isDisabled =
    datosTurno.estatus === 'FALTA' || datosTurno.estatus === 'N/A'

  return (
    <>
      <td className="border-r border-gray-100 p-0 text-center">
        <input
          type="time"
          value={datosTurno.ingreso || ''}
          onChange={(e) => onChangeCampo?.('ingreso', e.target.value)}
          disabled={isDisabled}
          className="w-full text-center bg-transparent py-1 focus:bg-amber-50 focus:outline-none disabled:text-gray-300 disabled:cursor-not-allowed"
        />
      </td>
      <td className="border-r border-gray-100 p-0 text-center">
        <select
          value={datosTurno.fIngreso || ''}
          onChange={(e) => onChangeCampo?.('fIngreso', e.target.value)}
          className="w-full bg-transparent focus:outline-none text-[9px] cursor-pointer font-bold"
        >
          <option value="">--</option>
          {opcionesFoto.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </td>
      <td className="border-r border-gray-100 p-0 text-center">
        <input
          type="time"
          value={datosTurno.salida || ''}
          onChange={(e) => onChangeCampo?.('salida', e.target.value)}
          disabled={isDisabled}
          className="w-full text-center bg-transparent py-1 focus:bg-amber-50 focus:outline-none disabled:text-gray-300 disabled:cursor-not-allowed"
        />
      </td>
      <td className="border-r border-gray-100 p-0 text-center">
        <select
          value={datosTurno.fSalida || ''}
          onChange={(e) => onChangeCampo?.('fSalida', e.target.value)}
          className="w-full bg-transparent focus:outline-none text-[9px] cursor-pointer font-bold"
        >
          <option value="">--</option>
          {opcionesFoto.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </td>
      <td
        className={`border-r border-gray-300 p-0.5 text-center font-bold transition-all ${colorEstatusClass}`}
      >
        <input
          type="text"
          value={datosTurno.observacion || ''}
          onChange={(e) => onChangeCampo?.('observacion', e.target.value)}
          placeholder="--"
          className="w-full text-center bg-transparent py-1 text-[9px] text-gray-500 focus:bg-amber-50 focus:outline-none"
        />
      </td>
    </>
  )
}
