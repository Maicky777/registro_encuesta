import { useState, useEffect, useCallback, useMemo } from 'react'
import { getBrigadas, getDepartamentos } from '../services/brigadaService'
import { getEncuestadoresByBrigada } from '../services/encuestadorService'

export const useAsignaciones = (departamento, brigadasPorDepto, rol) => {
  const [brigadas, setBrigadas] = useState([])
  const [encuestadores, setEncuestadores] = useState([])
  const [encuestadoresBrigada, setEncuestadoresBrigada] = useState('')
  const [loadingBrigadas, setLoadingBrigadas] = useState(true)
  const [loadingEncuestadores, setLoadingEncuestadores] = useState(false)
  const [brigadaMap, setBrigadaMap] = useState({})
  const [departments, setDepartments] = useState([])
  const [selectedRaw, setSelectedDepartamento] = useState('')

  const userDepartamentos = useMemo(
    () => (Array.isArray(departamento) ? departamento : departamento ? [departamento] : []),
    [departamento],
  )

  const getBrigadasPermitidas = useCallback((dept) => {
    if (!brigadasPorDepto || typeof brigadasPorDepto !== 'object' || Array.isArray(brigadasPorDepto)) return []
    return brigadasPorDepto[dept] || []
  }, [brigadasPorDepto])

  useEffect(() => {
    if (rol !== 'administrador') return
    let cancelled = false
    getDepartamentos()
      .then((data) => {
        if (!cancelled) setDepartments(data)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [rol])

  const departmentsFallback = rol === 'administrador' ? departments : userDepartamentos

  const selectedDepartamento = selectedRaw || departmentsFallback[0] || ''

  const dept = selectedDepartamento

  useEffect(() => {
    let cancelled = false
    const cargar = async () => {
      if (!dept) {
        setLoadingBrigadas(false)
        return
      }
      setLoadingBrigadas(true)
      setBrigadas([])
      setEncuestadores([])
      try {
        const data = await getBrigadas(dept)
        if (cancelled) return
        const permitidas = getBrigadasPermitidas(dept)
        const filtradas = permitidas.length > 0
          ? data.filter((b) => permitidas.includes(b.nombre))
          : data
        setBrigadas(filtradas)
        const map = {}
        for (const b of filtradas) {
          map[b.nombre] = b.id
        }
        setBrigadaMap(map)

        if (filtradas.length > 0) {
          const primeraBrigada = filtradas[0]
          setEncuestadoresBrigada(primeraBrigada.nombre)
          setLoadingEncuestadores(true)
          try {
            const encData = await getEncuestadoresByBrigada(primeraBrigada.id)
            if (!cancelled) setEncuestadores(encData)
          } catch {
            if (!cancelled) setEncuestadores([])
          } finally {
            if (!cancelled) setLoadingEncuestadores(false)
          }
        }
      } catch {
        if (!cancelled) setBrigadas([])
      } finally {
        if (!cancelled) setLoadingBrigadas(false)
      }
    }
    cargar()
    return () => { cancelled = true }
  }, [dept, getBrigadasPermitidas])

  const fetchEncuestadores = useCallback(async (brigadaNombre) => {
    const brigadaId = brigadaMap[brigadaNombre]
    if (!brigadaId) {
      setEncuestadores([])
      setEncuestadoresBrigada(brigadaNombre)
      return
    }
    setEncuestadoresBrigada(brigadaNombre)
    setLoadingEncuestadores(true)
    try {
      const data = await getEncuestadoresByBrigada(brigadaId)
      setEncuestadores(data)
    } catch {
      setEncuestadores([])
    } finally {
      setLoadingEncuestadores(false)
    }
  }, [brigadaMap])

  return {
    brigadas,
    encuestadores,
    encuestadoresBrigada,
    loadingBrigadas,
    loadingEncuestadores,
    fetchEncuestadores,
    departments: departmentsFallback,
    selectedDepartamento,
    setSelectedDepartamento,
  }
}
