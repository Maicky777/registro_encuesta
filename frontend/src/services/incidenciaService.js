import api from './api'

export const getComportamientoIncidencias = async (params = {}) => {
  const response = await api.get('/incidencias/comportamiento', { params })
  return response.data
}
