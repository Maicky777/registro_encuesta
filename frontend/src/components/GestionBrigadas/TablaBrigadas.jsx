import { useState, useMemo } from 'react'

const inputClass =
  'w-full px-2.5 py-1.5 text-[0.82rem] border border-slate-300 rounded bg-white text-slate-900 transition-colors outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/15'

const thClass =
  'px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider text-[0.68rem] whitespace-nowrap'

const avatarColores = [
  'bg-indigo-100 text-indigo-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
]

const iniciales = (nombre) =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')

const obtenerEncuestadores = (b) => {
  const nombres = (b.nombres_encuestadores || '')
    .split(', ')
    .filter(Boolean)
  const telefonos = (b.telefonos_encuestadores || '').split('|')
  return nombres.map((nombre, i) => ({
    nombre,
    telefono: (telefonos[i] || '').trim(),
  }))
}

const obtenerTelefonos = (b) =>
  obtenerEncuestadores(b).map((e) => e.telefono).filter(Boolean)

const iconoPhone = (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

export default function TablaBrigadas({
  brigadas,
  loading,
  onEliminar,
  onEditar,
}) {
  const [filtro, setFiltro] = useState('')
  const [pagina, setPagina] = useState(0)
  const [porPagina, setPorPagina] = useState(25)

  const showActions = onEliminar || onEditar

  const brigadasFiltradas = useMemo(() => {
    if (!filtro.trim()) return brigadas
    const term = filtro.toLowerCase()
    return brigadas.filter(
      (b) =>
        b.nombre.toLowerCase().includes(term) ||
        b.departamento.toLowerCase().includes(term) ||
        (b.telefono || '').toLowerCase().includes(term) ||
        (b.telefonos_encuestadores || '').toLowerCase().includes(term) ||
        (b.nombres_encuestadores &&
          b.nombres_encuestadores.toLowerCase().includes(term)),
    )
  }, [brigadas, filtro])

  const totalPaginas = Math.ceil(brigadasFiltradas.length / porPagina)
  const paginados = brigadasFiltradas.slice(
    pagina * porPagina,
    (pagina + 1) * porPagina,
  )

  const totalEncuestadores = brigadasFiltradas.reduce(
    (acc, b) => acc + (b.total_encuestadores || 0),
    0,
  )
  const totalConTelefono = brigadasFiltradas.filter(
    (b) => obtenerTelefonos(b).length > 0,
  ).length
  const totalDepartamentos = new Set(
    brigadasFiltradas.map((b) => b.departamento),
  ).size

  const handleFiltroChange = (val) => {
    setFiltro(val)
    setPagina(0)
  }

  const exportarCSV = () => {
    const encabezados = ['ID', 'Nombre', 'Departamento', 'Teléfono(s)', 'Encuestadores']
    const filas = brigadasFiltradas.map((b) => [
      b.id,
      b.nombre,
      b.departamento,
      obtenerTelefonos(b).join(', '),
      b.nombres_encuestadores || '',
    ])
    const csv = [encabezados, ...filas]
      .map((fila) =>
        fila.map((celda) => `"${String(celda ?? '').replace(/"/g, '""')}"`).join(','),
      )
      .join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'brigadas.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16 text-slate-400">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin mr-2" />
        Cargando brigadas...
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto my-5 px-4">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <span className="w-2 h-6 bg-slate-900 rounded-full" />
            Brigadas Registradas
          </h2>
          <p className="text-[0.78rem] text-slate-400 mt-1">
            Vista detallada de las brigadas, su departamento y el equipo de encuestadores asignado
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-3.5 py-1.5 rounded-md text-[0.75rem] font-semibold cursor-pointer hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={exportarCSV}
          disabled={brigadasFiltradas.length === 0}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
          </svg>
          Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex items-center gap-3">
          <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </span>
          <div>
            <p className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-semibold">
              Brigadas
            </p>
            <p className="text-lg font-bold text-slate-900 leading-tight">
              {brigadasFiltradas.length}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex items-center gap-3">
          <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <div>
            <p className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-semibold">
              Encuestadores
            </p>
            <p className="text-lg font-bold text-slate-900 leading-tight">
              {totalEncuestadores}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex items-center gap-3">
          <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </span>
          <div>
            <p className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-semibold">
              Con teléfono
            </p>
            <p className="text-lg font-bold text-slate-900 leading-tight">
              {totalConTelefono}
              <span className="text-xs font-medium text-slate-400">
                {' '}/ {brigadasFiltradas.length}
              </span>
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex items-center gap-3">
          <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </span>
          <div>
            <p className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-semibold">
              Departamentos
            </p>
            <p className="text-lg font-bold text-slate-900 leading-tight">
              {totalDepartamentos}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/60">
          <div className="flex-1 min-w-56 relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[0.8rem]">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              className={`${inputClass} pl-8 pr-8`}
              type="text"
              placeholder="Buscar por nombre, departamento, teléfono o encuestador..."
              value={filtro}
              onChange={(e) => handleFiltroChange(e.target.value)}
            />
            {filtro && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                onClick={() => handleFiltroChange('')}
                aria-label="Limpiar búsqueda"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" x2="6" y1="6" y2="18" />
                  <line x1="6" x2="18" y1="6" y2="18" />
                </svg>
              </button>
            )}
          </div>
          <select
            className="w-auto px-2.5 py-1.5 text-[0.82rem] border border-slate-300 rounded bg-white text-slate-900 outline-none"
            value={porPagina}
            onChange={(e) => {
              setPorPagina(Number(e.target.value))
              setPagina(0)
            }}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[0.7rem] px-2 py-0.5 rounded-full font-semibold">
            {brigadasFiltradas.length} brigada(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[0.82rem] border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className={thClass}>ID</th>
                <th className={thClass}>Brigada</th>
                <th className={thClass}>Departamento</th>
                <th className={thClass}>Equipo de Encuestadores</th>
                <th className={thClass}>Teléfono(s)</th>
                {showActions && (
                  <th className="px-4 py-3 text-center font-semibold text-slate-500 uppercase tracking-wider text-[0.68rem] whitespace-nowrap">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginados.length === 0 ? (
                <tr>
                  <td
                    colSpan={showActions ? 6 : 5}
                    className="px-4 py-12 text-center"
                  >
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 2 7 12 12 22 7 12 2" />
                        <polyline points="2 17 12 22 22 17" />
                        <polyline points="2 12 12 17 22 12" />
                      </svg>
                      <p className="font-medium">No se encontraron brigadas</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginados.map((b, filaIdx) => {
                  const encuestadores = obtenerEncuestadores(b)
                  return (
                    <tr
                      key={b.id}
                      className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors align-top"
                    >
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center min-w-7 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[0.7rem] font-semibold">
                          {b.id}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex-shrink-0 w-9 h-9 rounded-lg ${avatarColores[filaIdx % avatarColores.length]} flex items-center justify-center text-[0.75rem] font-bold uppercase`}
                          >
                            {iniciales(b.nombre)}
                          </span>
                          <span className="font-semibold text-slate-900 whitespace-nowrap">
                            {b.nombre}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[0.7rem] px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {b.departamento}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {encuestadores.length > 0 ? (
                          <div className="flex flex-col divide-y divide-slate-100">
                            {encuestadores.map((e, idx) => (
                              <div key={idx} className="flex items-center gap-2.5 py-1.5">
                                <span
                                  className={`flex-shrink-0 w-7 h-7 rounded-full ${avatarColores[(filaIdx + idx) % avatarColores.length]} flex items-center justify-center text-[0.6rem] font-bold`}
                                >
                                  {iniciales(e.nombre)}
                                </span>
                                <p className="text-[0.78rem] font-semibold text-slate-800 leading-tight truncate whitespace-nowrap">
                                  {e.nombre}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="bg-amber-50 text-amber-600 text-[0.7rem] px-2 py-0.5 rounded-md font-medium">
                            Sin asignar
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {encuestadores.length > 0 ? (
                          <div className="flex flex-col divide-y divide-slate-100">
                            {encuestadores.map((e, idx) => (
                              <div
                                key={idx}
                                className="flex items-center py-1.5 min-h-10"
                              >
                                {e.telefono ? (
                                  <a
                                    href={`tel:${e.telefono}`}
                                    className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[0.7rem] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap hover:bg-emerald-100 transition-colors"
                                  >
                                    {iconoPhone}
                                    {e.telefono}
                                  </a>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      {showActions && (
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-1 justify-center">
                            {onEditar && (
                              <button
                                className="bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-md text-[0.7rem] font-semibold cursor-pointer hover:bg-amber-100 transition-colors"
                                onClick={() => onEditar(b)}
                              >
                                Editar
                              </button>
                            )}
                            {onEliminar && (
                              <button
                                className="bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-md text-[0.7rem] font-semibold cursor-pointer hover:bg-red-100 transition-colors"
                                onClick={() => onEliminar(b)}
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-[0.75rem] text-slate-400">
              Página {pagina + 1} de {totalPaginas}
            </span>
            <div className="flex gap-2">
              <button
                className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-md text-[0.75rem] font-medium cursor-pointer hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setPagina((p) => Math.max(0, p - 1))}
                disabled={pagina === 0}
              >
                Anterior
              </button>
              <button
                className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-md text-[0.75rem] font-medium cursor-pointer hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() =>
                  setPagina((p) => Math.min(totalPaginas - 1, p + 1))
                }
                disabled={pagina >= totalPaginas - 1}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
