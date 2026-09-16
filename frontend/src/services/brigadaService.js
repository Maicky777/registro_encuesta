import api from './api'

export const getDepartamentos = async () => {
  const response = await api.get('/brigadas/departamentos')
  return response.data
}

export const getBrigadas = async (departamento) => {
  const params = departamento ? { departamento } : {}
  const response = await api.get('/brigadas', { params })
  return response.data
}

export const createBrigada = async (data) => {
  const response = await api.post('/brigadas', data)
  return response.data
}

export const updateBrigada = async (id, data) => {
  const response = await api.put(`/brigadas/${id}`, data)
  return response.data
}

export const deleteBrigada = async (id) => {
  const response = await api.delete(`/brigadas/${id}`)
  return response.data
}

export const getRankingObservaciones = async ({ departamento, semanaDesde, semanaHasta, brigada } = {}) => {
  const params = {}
  if (departamento) params.departamento = departamento
  if (semanaDesde) params.semanaDesde = semanaDesde
  if (semanaHasta) params.semanaHasta = semanaHasta
  if (brigada) params.brigada = brigada
  const response = await api.get('/brigadas/ranking-observaciones', { params })
  return response.data
}

export const getRankingSemanas = async () => {
  const response = await api.get('/brigadas/ranking-semanas')
  return response.data
}
