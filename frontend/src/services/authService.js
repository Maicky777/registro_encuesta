import api from './api'

export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password })
  return response.data
}

export const logout = async () => {
  await api.post('/auth/logout')
}

export const getMe = async () => {
  const response = await api.get('/auth/me')
  return response.data
}

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData)
  return response.data
}

export const getUsers = async () => {
  const response = await api.get('/auth/users')
  return response.data
}

export const deleteUser = async (id) => {
  const response = await api.delete(`/auth/users/${id}`)
  return response.data
}

export const updateUser = async (id, userData) => {
  const response = await api.put(`/auth/users/${id}`, userData)
  return response.data
}
