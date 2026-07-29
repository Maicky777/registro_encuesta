const SELECT_CLS =
  'bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 focus:outline-none w-full text-[11px]'

const LABEL_CLS = 'block text-gray-300 text-[11px] uppercase font-medium mb-1'

const ESTATUS_OPTS = [
  { value: 'ASISTENCIA', label: 'ASISTENCIA' },
  { value: 'FALTA', label: 'FALTA' },
  { value: 'VACACIONES', label: 'VACACIONES' },
  { value: 'INCAPACIDAD', label: 'INCAPACIDAD' },
  { value: 'N/A', label: 'N/A (Libre)' },
]

const FOTO_OPTS = [
  { value: '', label: '(Sin cambios)' },
  { value: 'GRUPAL', label: 'FOTOGRAFIA GRUPAL Y PUNTO' },
  { value: 'PERSONAL', label: 'FOTOGRAFIA PERSONAL Y PUNTO' },
  { value: 'SOLOFOTOGRAFIA', label: 'SOLO FOTOGRAFÍA' },
  { value: 'SPUNTO', label: 'SOLO PUNTO' },
  { value: 'SSENAL', label: 'SIN SEÑAL' },
  { value: 'SR', label: 'S/R' },
]

/** Panel de asignación masiva por lotes */
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
  bulkFIngreso,
  setBulkFIngreso,
  bulkFSalida,
  setBulkFSalida,
  onAplicar,
}) {
  return (
    <div className="mb-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 shadow-md rounded-lg text-xs">
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-[11px] font-bold">
          HERRAMIENTA RÁPIDA
        </div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-blue-200">
          Asignador por Lotes
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:flex flex-wrap items-end gap-3 text-xs">
        <div>
          <label htmlFor="bulk-dia" className={LABEL_CLS}>
            1. Día
          </label>
          <select
            id="bulk-dia"
            value={bulkDia}
            onChange={(e) => setBulkDia(e.target.value)}
            className={`${SELECT_CLS} md:w-32`}
          >
            {dias.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="bulk-estatus" className={LABEL_CLS}>
            2. Estatus
          </label>
          <select
            id="bulk-estatus"
            value={bulkEstatus}
            onChange={(e) => setBulkEstatus(e.target.value)}
            className={`${SELECT_CLS} md:w-36 font-semibold`}
          >
            {ESTATUS_OPTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="bulk-turno" className={LABEL_CLS}>
            3. Turno
          </label>
          <select
            id="bulk-turno"
            value={bulkTurno}
            onChange={(e) => setBulkTurno(e.target.value)}
            className={`${SELECT_CLS} md:w-24`}
          >
            <option value="t1">TURNO 1</option>
            <option value="t2">TURNO 2</option>
          </select>
        </div>

        {bulkEstatus === 'ASISTENCIA' && (
          <>
            <div>
              <label htmlFor="bulk-ingreso" className={LABEL_CLS}>
                4. Hora Entrada
              </label>
              <input
                id="bulk-ingreso"
                type="time"
                value={bulkIngreso}
                onChange={(e) => setBulkIngreso(e.target.value)}
                className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-0.5 focus:outline-none w-full md:w-24 text-center"
              />
            </div>
            <div>
              <label htmlFor="bulk-salida" className={LABEL_CLS}>
                5. Hora Salida
              </label>
              <input
                id="bulk-salida"
                type="time"
                value={bulkSalida}
                onChange={(e) => setBulkSalida(e.target.value)}
                className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-0.5 focus:outline-none w-full md:w-24 text-center"
              />
            </div>
            <div>
              <label htmlFor="bulk-fingreso" className={LABEL_CLS}>
                6. Foto Ingreso
              </label>
              <select
                id="bulk-fingreso"
                value={bulkFIngreso}
                onChange={(e) => setBulkFIngreso(e.target.value)}
                className={`${SELECT_CLS} md:w-36`}
              >
                {FOTO_OPTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="bulk-fsalida" className={LABEL_CLS}>
                7. Foto Salida
              </label>
              <select
                id="bulk-fsalida"
                value={bulkFSalida}
                onChange={(e) => setBulkFSalida(e.target.value)}
                className={`${SELECT_CLS} md:w-36`}
              >
                {FOTO_OPTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="col-span-2 sm:col-span-4 md:ml-auto">
          <button
            onClick={onAplicar}
            aria-label={`Aplicar a ${seleccionadosCount} seleccionados`}
            className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-1.5 rounded shadow transition-all transform active:scale-95 flex items-center justify-center gap-1 text-[11px]"
          >
            Aplicar a Seleccionados ({seleccionadosCount})
          </button>
        </div>
      </div>
    </div>
  )
}
