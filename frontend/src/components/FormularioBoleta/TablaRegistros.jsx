import React, { useState, useMemo } from 'react'
import { getEstadoClass } from '../../utils/helpers'

const ROWS_PER_PAGE_OPTIONS = [25, 50, 100]

const SearchIcon = () => (
  <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
)

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
      <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    </div>
    <p className="text-[0.85rem] font-medium text-slate-400">No hay registros en la base de datos.</p>
    <p className="text-[0.72rem] text-slate-300 mt-1">Comienza agregando un nuevo registro</p>
  </div>
)

const ChevronLeft = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
)

const ChevronRight = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
)

const TablaRegistros = ({
  registrosFiltrados,
  filtroGeneral,
  onFiltroChange,
  onEditar,
  onEliminar,
  onDoubleClickCorregir,
  onReporte,
  rol,
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  const totalRows = registrosFiltrados.length
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage))

  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedData = useMemo(() => {
    const start = (safeCurrentPage - 1) * rowsPerPage
    return registrosFiltrados.slice(start, start + rowsPerPage)
  }, [registrosFiltrados, safeCurrentPage, rowsPerPage])

  const startRow = totalRows === 0 ? 0 : (safeCurrentPage - 1) * rowsPerPage + 1
  const endRow = Math.min(safeCurrentPage * rowsPerPage, totalRows)

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page)
  }

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value))
    setCurrentPage(1)
  }

  const pageNumbers = useMemo(() => {
    const pages = []
    const maxVisible = 5
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      let start = Math.max(1, safeCurrentPage - 2)
      let end = Math.min(totalPages, start + maxVisible - 1)
      if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1)
      for (let i = start; i <= end; i++) pages.push(i)
    }
    return pages
  }, [totalPages, safeCurrentPage])

  return (
    <div>
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon />
        </div>
        <input
          id="cod-busqueda"
          type="text"
          className="w-full max-w-md pl-10 pr-4 py-2 text-[0.82rem] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all placeholder:text-slate-400"
          placeholder="Buscar por folio, UPM, encuestador..."
          value={filtroGeneral}
          onChange={(e) => {
            onFiltroChange(e.target.value)
            setCurrentPage(1)
          }}
        />
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-[0.78rem] text-left whitespace-nowrap">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-3 py-2.5 text-[0.7rem] font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              <th className="px-3 py-2.5 text-[0.7rem] font-semibold text-slate-500 uppercase tracking-wider">N°</th>
              <th className="px-3 py-2.5 text-[0.7rem] font-semibold text-slate-500 uppercase tracking-wider">UPM</th>
              <th className="px-3 py-2.5 text-[0.7rem] font-semibold text-slate-500 uppercase tracking-wider">Folio</th>
              <th className="px-3 py-2.5 text-[0.7rem] font-semibold text-slate-500 uppercase tracking-wider">VOE</th>
              <th className="px-3 py-2.5 text-[0.7rem] font-semibold text-slate-500 uppercase tracking-wider">Semana</th>
              <th className="px-3 py-2.5 text-[0.7rem] font-semibold text-slate-500 uppercase tracking-wider">Visita</th>
              <th className="px-3 py-2.5 text-[0.7rem] font-semibold text-slate-500 uppercase tracking-wider">Panel</th>
              <th className="px-3 py-2.5 text-[0.7rem] font-semibold text-slate-500 uppercase tracking-wider">Encuestador</th>
              <th className="px-3 py-2.5 text-[0.7rem] font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
              <th className="px-3 py-2.5 text-[0.7rem] font-semibold text-slate-500 uppercase tracking-wider">Obs. Total</th>
              <th className="px-3 py-2.5 text-[0.7rem] font-semibold text-slate-500 uppercase tracking-wider">Estado Boleta</th>
              <th className="px-3 py-2.5 text-[0.7rem] font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length > 0 ? (
              paginatedData.map((reg) => (
                <tr
                  key={reg.id}
                  onDoubleClick={() => onDoubleClickCorregir(reg)}
                  title={
                    reg.estadoBoleta === 'OBSERVADO'
                      ? 'Doble click para marcar como CORREGIDO'
                      : ''
                  }
                  className={`transition-colors ${
                    reg.estadoBoleta === 'OBSERVADO'
                      ? 'bg-red-50/40 hover:bg-red-50/80 cursor-pointer'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-0.5">
                      <button
                        className="p-1 rounded hover:bg-blue-100 transition-colors text-sm"
                        onClick={() => onEditar(reg)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      {rol === 'administrador' && (
                        <button
                          className="p-1 rounded hover:bg-red-100 transition-colors text-sm"
                          onClick={() => onEliminar(reg.id)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      )}
                      {reg.estadoBoleta === 'OBSERVADO' && (
                        <button
                          className="p-1 rounded hover:bg-amber-100 transition-colors text-sm"
                          onClick={() => onReporte(reg)}
                          title="Reportar"
                        >
                          📋
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-slate-400 font-medium">{reg.numeroCorrelativo}</td>
                  <td className="px-3 py-2 text-slate-600">{reg.upm}</td>
                  <td className="px-3 py-2">
                    <span className="font-semibold text-slate-900">{reg.folio}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-500">{reg.voe}</td>
                  <td className="px-3 py-2 text-slate-600 text-center">{parseInt(reg.semana, 10)}</td>
                  <td className="px-3 py-2 text-slate-600 text-center">{reg.visita}</td>
                  <td className="px-3 py-2 text-slate-500">{reg.panel}</td>
                  <td className="px-3 py-2 text-slate-600">{reg.nombreEncuestador}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 inline-block rounded-full text-[0.72rem] ${getEstadoClass(reg.estadoBoleta)}`}>
                      {reg.estadoBoleta}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {reg.totalObservaciones > 0 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-[0.72rem] font-bold">
                        {reg.totalObservaciones}
                      </span>
                    ) : (
                      <span className="text-slate-300">0</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-500">{reg.observacionBoleta}</td>
                  <td className="px-3 py-2 text-slate-400 text-[0.72rem]">{reg.fechaFinalConsolidacion}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="13">
                  <EmptyState />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalRows > 0 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <div className="flex items-center gap-2 text-[0.75rem] text-slate-500">
            <span>Mostrar</span>
            <select
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
              className="border border-slate-200 rounded-md px-2 py-1 text-[0.75rem] text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              {ROWS_PER_PAGE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <span>por página</span>
            <span className="mx-2 text-slate-300">|</span>
            <span>Mostrando <span className="font-semibold text-slate-700">{startRow}</span> a <span className="font-semibold text-slate-700">{endRow}</span> de <span className="font-semibold text-slate-700">{totalRows}</span> registros</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(safeCurrentPage - 1)}
              disabled={safeCurrentPage === 1}
              className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft />
            </button>

            {pageNumbers[0] > 1 && (
              <>
                <button
                  onClick={() => handlePageChange(1)}
                  className="w-8 h-8 rounded-md text-[0.75rem] font-medium text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  1
                </button>
                {pageNumbers[0] > 2 && (
                  <span className="w-8 h-8 flex items-center justify-center text-slate-300 text-[0.75rem]">...</span>
                )}
              </>
            )}

            {pageNumbers.map((num) => (
              <button
                key={num}
                onClick={() => handlePageChange(num)}
                className={`w-8 h-8 rounded-md text-[0.75rem] font-medium transition-colors ${
                  num === safeCurrentPage
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {num}
              </button>
            ))}

            {pageNumbers[pageNumbers.length - 1] < totalPages && (
              <>
                {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                  <span className="w-8 h-8 flex items-center justify-center text-slate-300 text-[0.75rem]">...</span>
                )}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  className="w-8 h-8 rounded-md text-[0.75rem] font-medium text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => handlePageChange(safeCurrentPage + 1)}
              disabled={safeCurrentPage === totalPages}
              className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(TablaRegistros)
