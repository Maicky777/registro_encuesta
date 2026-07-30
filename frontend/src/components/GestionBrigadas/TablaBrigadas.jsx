import { useState, useMemo } from 'react'

const inputClass =
  'w-full px-2.5 py-1.5 text-[0.82rem] border border-slate-300 rounded bg-white text-slate-900 transition-colors outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/15'

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
        (b.nombres_encuestadores &&
          b.nombres_encuestadores.toLowerCase().includes(term)),
    )
  }, [brigadas, filtro])

  const totalPaginas = Math.ceil(brigadasFiltradas.length / porPagina)
  const paginados = brigadasFiltradas.slice(
    pagina * porPagina,
    (pagina + 1) * porPagina,
  )

  const handleFiltroChange = (val) => {
    setFiltro(val)
    setPagina(0)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8 text-slate-400">
        Cargando brigadas...
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto my-5 bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b-2 border-slate-800">
        Brigadas Registradas
      </h2>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-50">
          <input
            className={inputClass}
            type="text"
            placeholder="Buscar por nombre, departamento o encuestador..."
            value={filtro}
            onChange={(e) => handleFiltroChange(e.target.value)}
          />
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
        <span className="text-[0.75rem] text-slate-400">
          {brigadasFiltradas.length} brigada(s)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[0.82rem] border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              <th className="px-3 py-2 text-left font-semibold text-slate-600 uppercase tracking-wider text-[0.7rem]">
                ID
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-600 uppercase tracking-wider text-[0.7rem]">
                Nombre
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-600 uppercase tracking-wider text-[0.7rem]">
                Departamento
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-600 uppercase tracking-wider text-[0.7rem]">
                Encuestadores
              </th>
              {showActions && (
                <th className="px-3 py-2 text-center font-semibold text-slate-600 uppercase tracking-wider text-[0.7rem]">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginados.length === 0 ? (
              <tr>
                <td
                  colSpan={showActions ? 5 : 4}
                  className="px-3 py-6 text-center text-slate-400"
                >
                  No se encontraron brigadas
                </td>
              </tr>
            ) : (
              paginados.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-3 py-2 text-slate-500">{b.id}</td>
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {b.nombre}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{b.departamento}</td>
                  <td className="px-3 py-2">
                    {b.nombres_encuestadores ? (
                      <div className="flex flex-wrap gap-1">
                        {b.nombres_encuestadores
                          .split(', ')
                          .map((nombre, idx) => (
                            <span
                              key={idx}
                              className="bg-slate-100 text-slate-600 text-[0.7rem] px-1.5 py-0.5 rounded font-medium"
                            >
                              {nombre}
                            </span>
                          ))}
                      </div>
                    ) : (
                      <span className="bg-slate-100 text-slate-400 text-[0.7rem] px-2 py-0.5 rounded font-medium">
                        Sin asignar
                      </span>
                    )}
                  </td>
                  {showActions && (
                    <td className="px-3 py-2 text-center">
                      <div className="flex gap-1 justify-center">
                        {onEditar && (
                          <button
                            className="bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded text-[0.7rem] font-semibold cursor-pointer hover:bg-amber-100 transition-colors"
                            onClick={() => onEditar(b)}
                          >
                            Editar
                          </button>
                        )}
                        {onEliminar && (
                          <button
                            className="bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded text-[0.7rem] font-semibold cursor-pointer hover:bg-red-100 transition-colors"
                            onClick={() => onEliminar(b)}
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          <span className="text-[0.75rem] text-slate-400">
            Página {pagina + 1} de {totalPaginas}
          </span>
          <div className="flex gap-2">
            <button
              className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded text-[0.75rem] font-medium cursor-pointer hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => setPagina((p) => Math.max(0, p - 1))}
              disabled={pagina === 0}
            >
              Anterior
            </button>
            <button
              className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded text-[0.75rem] font-medium cursor-pointer hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
  )
}
