import React from 'react'

export default function PanelMasivo({
  dias,
  seleccionadosCount,
  bulkDia,
  setBulkDia,
  bulkTurno,
  setBulkTurno,
  bulkEstatus,
  setBulkEstatus,
  bulkIngreso,
  setBulkIngreso,
  bulkSalida,
  setBulkSalida,
  onAplicar,
}) {
  return (
    <div className="mb-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 shadow-md rounded-lg text-xs">
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold animate-pulse">
          HERRAMIENTA RÁPIDA
        </div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-blue-200">
          Asignador por Lotes
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:flex flex-wrap items-end gap-3 text-[11px]">
        <div>
          <label className="block text-gray-300 text-[10px] uppercase font-medium mb-1">
            1. Día
          </label>
          <select
            value={bulkDia}
            onChange={(e) => setBulkDia(e.target.value)}
            className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 focus:outline-none w-full md:w-32"
          >
            {dias.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-300 text-[10px] uppercase font-medium mb-1">
            2. Estatus
          </label>
          <select
            value={bulkEstatus}
            onChange={(e) => setBulkEstatus(e.target.value)}
            className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 focus:outline-none w-full md:w-36 font-semibold"
          >
            <option value="ASISTENCIA">🟢 ASISTENCIA</option>
            <option value="FALTA">🔴 FALTA</option>
            <option value="VACACIONES">🔵 VACACIONES</option>
            <option value="INCAPACIDAD">🟠 INCAPACIDAD</option>
            <option value="N/A">⚪ N/A (Libre)</option>
          </select>
        </div>

        {bulkEstatus === 'ASISTENCIA' && (
          <>
            <div>
              <label className="block text-gray-300 text-[10px] uppercase font-medium mb-1">
                Hora Entrada
              </label>
              <input
                type="time"
                value={bulkIngreso}
                onChange={(e) => setBulkIngreso(e.target.value)}
                className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-0.5 focus:outline-none w-full md:w-24 text-center"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-[10px] uppercase font-medium mb-1">
                Hora Salida
              </label>
              <input
                type="time"
                value={bulkSalida}
                onChange={(e) => setBulkSalida(e.target.value)}
                className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-0.5 focus:outline-none w-full md:w-24 text-center"
              />
            </div>
          </>
        )}

        <div className="col-span-2 sm:col-span-4 md:ml-auto">
          <button
            onClick={onAplicar}
            className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-1.5 rounded shadow transition-all transform active:scale-95 flex items-center justify-center"
          >
            🚀 Aplicar a Seleccionados ({seleccionadosCount})
          </button>
        </div>
      </div>
    </div>
  )
}
