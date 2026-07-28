import api from './api'

export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password })
  return response.data
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

export const saveToken = (token) => {
  localStorage.setItem('authToken', token)
}

export const getToken = () => {
  return localStorage.getItem('authToken')
}

export const removeToken = () => {
  localStorage.removeItem('authToken')
}

export const isAuthenticated = () => {
  const token = getToken()
  if (!token) return false
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}
