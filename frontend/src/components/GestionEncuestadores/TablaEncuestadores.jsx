import { useState, useMemo } from 'react'

const inputClass = 'w-full px-2.5 py-1.5 text-[0.82rem] border border-slate-300 rounded bg-white text-slate-900 transition-colors outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/15'

export default function TablaEncuestadores({ encuestadores, loading, onEliminar, onEditar }) {
  const [filtro, setFiltro] = useState('')
  const [pagina, setPagina] = useState(0)
  const [porPagina, setPorPagina] = useState(25)

  const filtrados = useMemo(() => {
    if (!filtro.trim()) return encuestadores
    const term = filtro.toLowerCase()
    return encuestadores.filter(
      (e) =>
        e.nombre.toLowerCase().includes(term) ||
        e.codigo.toLowerCase().includes(term) ||
        e.rol.toLowerCase().includes(term) ||
        (e.brigadas_asignadas && e.brigadas_asignadas.toLowerCase().includes(term)),
    )
  }, [encuestadores, filtro])

  const totalPaginas = Math.ceil(filtrados.length / porPagina)
  const paginados = filtrados.slice(pagina * porPagina, (pagina + 1) * porPagina)

  const handleFiltroChange = (val) => {
    setFiltro(val)
    setPagina(0)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8 text-slate-400">
        Cargando encuestadores...
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto my-5 bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b-2 border-slate-800">
        Encuestadores Registrados
      </h2>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-[200px]">
          <input
            className={inputClass}
            type="text"
            placeholder="Buscar por nombre, código, rol o brigada..."
            value={filtro}
            onChange={(e) => handleFiltroChange(e.target.value)}
          />
        </div>
        <select
          className="w-auto px-2.5 py-1.5 text-[0.82rem] border border-slate-300 rounded bg-white text-slate-900 outline-none"
          value={porPagina}
          onChange={(e) => { setPorPagina(Number(e.target.value)); setPagina(0) }}
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span className="text-[0.75rem] text-slate-400">
          {filtrados.length} encuestador(es)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[0.82rem] border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              <th className="px-3 py-2 text-left font-semibold text-slate-600 uppercase tracking-wider text-[0.7rem]">ID</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-600 uppercase tracking-wider text-[0.7rem]">Nombre</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-600 uppercase tracking-wider text-[0.7rem]">Código</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-600 uppercase tracking-wider text-[0.7rem]">Rol</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-600 uppercase tracking-wider text-[0.7rem]">Teléfono</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-600 uppercase tracking-wider text-[0.7rem]">Brigadas</th>
              <th className="px-3 py-2 text-center font-semibold text-slate-600 uppercase tracking-wider text-[0.7rem]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginados.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-slate-400">
                  No se encontraron encuestadores
                </td>
              </tr>
            ) : (
              paginados.map((e) => (
                <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2 text-slate-500">{e.id}</td>
                  <td className="px-3 py-2 font-medium text-slate-900">{e.nombre}</td>
                  <td className="px-3 py-2 text-slate-700 font-mono text-[0.75rem]">{e.codigo}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[0.7rem] font-bold px-2 py-0.5 rounded ${
                      e.rol === 'supervisor'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {e.rol === 'supervisor' ? 'Supervisor' : 'Encuestador'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600 text-[0.75rem]">{e.telefono || '-'}</td>
                  <td className="px-3 py-2 text-[0.7rem] text-slate-500 max-w-[200px] truncate" title={e.brigadas_asignadas || ''}>
                    {e.brigadas_asignadas || 'Sin asignar'}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex gap-1 justify-center">
                      <button
                        className="bg-sky-50 text-sky-600 border border-sky-200 px-2.5 py-1 rounded text-[0.7rem] font-semibold cursor-pointer hover:bg-sky-100 transition-colors"
                        onClick={() => onEditar(e)}
                      >
                        Editar
                      </button>
                      <button
                        className="bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded text-[0.7rem] font-semibold cursor-pointer hover:bg-red-100 transition-colors"
                        onClick={() => onEliminar(e)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
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
              onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
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
