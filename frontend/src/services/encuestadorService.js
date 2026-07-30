import api from './api'

export const getEncuestadores = async (departamento) => {
  const params = departamento ? { departamento } : {}
  const response = await api.get('/encuestadores', { params })
  return response.data
}

export const createEncuestador = async (data) => {
  const response = await api.post('/encuestadores', data)
  return response.data
}

export const updateEncuestador = async (id, data) => {
  const response = await api.put(`/encuestadores/${id}`, data)
  return response.data
}

export const deleteEncuestador = async (id) => {
  const response = await api.delete(`/encuestadores/${id}`)
  return response.data
}

export const getEncuestadoresByBrigada = async (brigadaId) => {
  const response = await api.get('/asignaciones', { params: { brigada_id: brigadaId } })
  return response.data
}

export const asignarEncuestador = async (brigadaId, encuestadorId) => {
  const response = await api.post('/asignaciones', { brigada_id: brigadaId, encuestador_id: encuestadorId })
  return response.data
}

export const desasignarEncuestador = async (brigadaId, encuestadorId) => {
  const response = await api.delete('/asignaciones', { data: { brigada_id: brigadaId, encuestador_id: encuestadorId } })
  return response.data
}
