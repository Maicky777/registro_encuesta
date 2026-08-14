import api from './api'

export const getPersonalAsistencia = async (params) => {
  const response = await api.get('/asistencia/personal', { params })
  return response.data
}

export const getAsistencia = async (params) => {
  const response = await api.get('/asistencia', { params })
  return response.data
}

export const saveAsistencia = async (data) => {
  const response = await api.post('/asistencia/batch', data)
  return response.data
}

export const deleteAsistencia = async (params) => {
  const response = await api.delete('/asistencia', { params })
  return response.data
}
