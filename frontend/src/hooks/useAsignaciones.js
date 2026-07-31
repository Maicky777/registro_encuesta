import { useState, useEffect, useCallback } from 'react'
import { getBrigadas, getDepartamentos } from '../services/brigadaService'
import { getEncuestadoresByBrigada } from '../services/encuestadorService'

export const useAsignaciones = (departamento, brigadasPermitidas, rol) => {
  const [brigadas, setBrigadas] = useState([])
  const [encuestadores, setEncuestadores] = useState([])
  const [encuestadoresBrigada, setEncuestadoresBrigada] = useState('')
  const [loadingBrigadas, setLoadingBrigadas] = useState(true)
  const [loadingEncuestadores, setLoadingEncuestadores] = useState(false)
  const [brigadaMap, setBrigadaMap] = useState({})
  const [departments, setDepartments] = useState([])
  const [selectedDepartamento, setSelectedDepartamento] = useState('')

  useEffect(() => {
    if (rol !== 'administrador') return
    let cancelled = false
    getDepartamentos()
      .then((data) => {
        if (cancelled) return
        setDepartments(data)
        if (data.length > 0 && !selectedDepartamento) {
          setSelectedDepartamento(data[0])
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [rol])

  const dept = rol === 'administrador' ? selectedDepartamento : departamento

  useEffect(() => {
    if (!dept) {
      if (rol !== 'administrador') setLoadingBrigadas(false)
      return
    }
    let cancelled = false
    setLoadingBrigadas(true)
    setBrigadas([])
    setEncuestadores([])
    getBrigadas(dept)
      .then(async (data) => {
        if (cancelled) return
        const filtradas = brigadasPermitidas && brigadasPermitidas.length > 0
          ? data.filter((b) => brigadasPermitidas.includes(b.nombre))
          : data
        setBrigadas(filtradas)
        const map = {}
        for (const b of filtradas) {
          map[b.nombre] = b.id
        }
        setBrigadaMap(map)

        if (filtradas.length > 0 && !cancelled) {
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
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingBrigadas(false)
      })
    return () => { cancelled = true }
  }, [dept, brigadasPermitidas, rol])

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
    departments,
    selectedDepartamento,
    setSelectedDepartamento,
  }
}
