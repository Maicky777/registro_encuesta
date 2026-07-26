import { useState, useMemo } from 'react'

export const useFiltros = (registros) => {
  const [filtroGeneral, setFiltroGeneral] = useState('')

  const registrosFiltrados = useMemo(() => {
    const busqueda = filtroGeneral.toLowerCase().trim()
    if (!busqueda) return registros
    return registros.filter((reg) =>
      Object.values(reg).some((val) =>
        String(val).toLowerCase().includes(busqueda)
      )
    )
  }, [registros, filtroGeneral])

  return {
    filtroGeneral,
    setFiltroGeneral,
    registrosFiltrados,
  }
}
