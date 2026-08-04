import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../services/api'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function getErrorMessage(err) {
  if (err.response?.data?.error) return err.response.data.error
  if (err.response?.data?.details) return err.response.data.details.join('\n')
  if (err.message) return err.message
  return 'Error desconocido'
}

export const useBoletas = () => {
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 500, total: 0, totalPages: 1 })

  const fetchRegistros = useCallback(async (page = 1, limit = 500) => {
    try {
      const res = await api.get(`/boletas?page=${page}&limit=${limit}`)
      setRegistros(res.data.data)
      setPagination(res.data.pagination)
      setError(null)
    } catch (err) {
      console.error('Error al conectar con la API:', err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRegistros()
  }, [fetchRegistros])

  const debounceRef = useRef(null)
  useEffect(() => {
    const scheduleRefetch = () => {
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        fetchRegistros()
      }, 300)
    }

    const source = new EventSource(`${API_BASE_URL}/events`, {
      withCredentials: true,
    })
    source.addEventListener('boletas:changed', scheduleRefetch)

    return () => {
      clearTimeout(debounceRef.current)
      source.close()
    }
  }, [fetchRegistros])

  const crearRegistro = useCallback(async (data) => {
    setSubmitting(true)
    try {
      const fechaActual = new Date().toISOString().split('T')[0]
      const payload = { ...data, fechaFinalConsolidacion: fechaActual }
      await api.post('/boletas', payload)
      await fetchRegistros()
    } catch (err) {
      throw new Error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }, [fetchRegistros])

  const actualizarRegistro = useCallback(async (id, data) => {
    setSubmitting(true)
    try {
      const fechaActual = new Date().toISOString().split('T')[0]
      const payload = { ...data, fechaFinalConsolidacion: fechaActual }
      await api.put(`/boletas/${id}`, payload)
      await fetchRegistros()
    } catch (err) {
      throw new Error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }, [fetchRegistros])

  const eliminarRegistro = useCallback(async (id) => {
    setSubmitting(true)
    try {
      await api.delete(`/boletas/${id}`)
      await fetchRegistros()
    } catch (err) {
      throw new Error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }, [fetchRegistros])

  const verificarFolio = useCallback(async (folio, excludeId = null) => {
    try {
      const params = excludeId
        ? `?folio=${folio}&excludeId=${excludeId}`
        : `?folio=${folio}`
      const res = await api.get(`/boletas/check-folio${params}`)
      return res.data.exists
    } catch {
      return false
    }
  }, [])

  const actualizarUpmReemplazo = useCallback(async (upm, upmReemplazo, excludeId = null) => {
    const res = await api.put('/boletas/upm-reemplazo', { upm, upmReemplazo, excludeId })
    await fetchRegistros()
    return res.data
  }, [fetchRegistros])

  const cargarBatch = useCallback(async (data) => {
    setSubmitting(true)
    try {
      const res = await api.post('/boletas/batch', data)
      await fetchRegistros()
      return res.data
    } finally {
      setSubmitting(false)
    }
  }, [fetchRegistros])

  return {
    registros,
    loading,
    submitting,
    error,
    pagination,
    obtenerRegistros: fetchRegistros,
    crearRegistro,
    actualizarRegistro,
    eliminarRegistro,
    verificarFolio,
    actualizarUpmReemplazo,
    cargarBatch,
  }
}
