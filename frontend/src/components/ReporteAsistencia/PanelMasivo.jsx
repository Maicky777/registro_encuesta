import PropTypes from 'prop-types'

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
  bulk,
  onBulkChange,
  onAplicar,
}) {
  return (
    <div className="mb-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 shadow-md rounded-lg text-xs">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-blue-200">
          Asignador de Asistencia Por Lotes
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:flex flex-wrap items-end gap-3 text-xs">
        <div>
          <label htmlFor="bulk-dia" className={LABEL_CLS}>
            1. Día
          </label>
          <select
            id="bulk-dia"
            value={bulk.dia}
            onChange={(e) => onBulkChange('dia', e.target.value)}
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
            value={bulk.estatus}
            onChange={(e) => onBulkChange('estatus', e.target.value)}
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
            value={bulk.turno}
            onChange={(e) => onBulkChange('turno', e.target.value)}
            className={`${SELECT_CLS} md:w-24`}
          >
            <option value="t1">TURNO 1</option>
            <option value="t2">TURNO 2</option>
          </select>
        </div>

        {bulk.estatus === 'ASISTENCIA' && (
          <>
            <div>
              <label htmlFor="bulk-ingreso" className={LABEL_CLS}>
                4. Hora Entrada
              </label>
              <input
                id="bulk-ingreso"
                type="time"
                value={bulk.ingreso}
                onChange={(e) => onBulkChange('ingreso', e.target.value)}
                className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-0.5 focus:outline-none w-full md:w-24 text-center"
              />
            </div>

            <div>
              <label htmlFor="bulk-fingreso" className={LABEL_CLS}>
                6. Foto Ingreso
              </label>
              <select
                id="bulk-fingreso"
                value={bulk.fIngreso}
                onChange={(e) => onBulkChange('fIngreso', e.target.value)}
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
              <label htmlFor="bulk-salida" className={LABEL_CLS}>
                5. Hora Salida
              </label>
              <input
                id="bulk-salida"
                type="time"
                value={bulk.salida}
                onChange={(e) => onBulkChange('salida', e.target.value)}
                className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-0.5 focus:outline-none w-full md:w-24 text-center"
              />
            </div>
            <div>
              <label htmlFor="bulk-fsalida" className={LABEL_CLS}>
                7. Foto Salida
              </label>
              <select
                id="bulk-fsalida"
                value={bulk.fSalida}
                onChange={(e) => onBulkChange('fSalida', e.target.value)}
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

        <div>
          <label htmlFor="bulk-observacion" className={LABEL_CLS}>
            {bulk.estatus === 'ASISTENCIA' ? '8. ' : '4. '}Observación
          </label>
          <input
            id="bulk-observacion"
            type="text"
            value={bulk.observacion || ''}
            onChange={(e) => onBulkChange('observacion', e.target.value)}
            maxLength={200}
            placeholder="Observación..."
            className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-0.5 focus:outline-none w-full md:w-40 text-[11px]"
          />
        </div>

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

PanelMasivo.propTypes = {
  dias: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      nombre: PropTypes.string,
    }),
  ),
  seleccionadosCount: PropTypes.number,
  bulk: PropTypes.shape({
    dia: PropTypes.string,
    turno: PropTypes.string,
    estatus: PropTypes.string,
    ingreso: PropTypes.string,
    salida: PropTypes.string,
    fIngreso: PropTypes.string,
    fSalida: PropTypes.string,
    observacion: PropTypes.string,
  }),
  onBulkChange: PropTypes.func,
  onAplicar: PropTypes.func,
}
