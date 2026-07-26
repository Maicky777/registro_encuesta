import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/boletas'

function getErrorMessage(err) {
  if (err.response?.data?.error) return err.response.data.error
  if (err.response?.data?.details) return err.response.data.details.join('\n')
  if (err.message) return err.message
  return 'Error desconocido'
}

export const useBoletas = () => {
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const obtenerRegistros = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axios.get(API_URL)
      setRegistros(res.data)
      setError(null)
    } catch (err) {
      console.error('Error al conectar con la API:', err)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    obtenerRegistros()
  }, [obtenerRegistros])

  const crearRegistro = useCallback(async (data) => {
    const fechaActual = new Date().toISOString().split('T')[0]
    const payload = { ...data, fechaFinalConsolidacion: fechaActual }
    await axios.post(API_URL, payload)
    await obtenerRegistros()
  }, [obtenerRegistros])

  const actualizarRegistro = useCallback(async (id, data) => {
    const fechaActual = new Date().toISOString().split('T')[0]
    const payload = { ...data, fechaFinalConsolidacion: fechaActual }
    await axios.put(`${API_URL}/${id}`, payload)
    await obtenerRegistros()
  }, [obtenerRegistros])

  const eliminarRegistro = useCallback(async (id) => {
    await axios.delete(`${API_URL}/${id}`)
    await obtenerRegistros()
  }, [obtenerRegistros])

  const verificarFolio = useCallback(async (folio, excludeId = null) => {
    try {
      const params = excludeId
        ? `?folio=${folio}&excludeId=${excludeId}`
        : `?folio=${folio}`
      const res = await axios.get(`${API_URL}/check-folio${params}`)
      return res.data.exists
    } catch {
      return false
    }
  }, [])

  const cargarBatch = useCallback(async (data) => {
    const res = await axios.post(`${API_URL}/batch`, data)
    await obtenerRegistros()
    return res.data
  }, [obtenerRegistros])

  return {
    registros,
    loading,
    error,
    obtenerRegistros,
    crearRegistro,
    actualizarRegistro,
    eliminarRegistro,
    verificarFolio,
    cargarBatch,
  }
}
