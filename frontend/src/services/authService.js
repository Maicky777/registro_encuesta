import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const AUTH_URL = API_URL.replace('/boletas', '/auth')

export const login = async (username, password) => {
  const response = await axios.post(`${AUTH_URL}/login`, { username, password })
  return response.data
}

export const getMe = async (token) => {
  const response = await axios.get(`${AUTH_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export const register = async (userData, token) => {
  const response = await axios.post(`${AUTH_URL}/register`, userData, {
    headers: { Authorization: `Bearer ${token}` }
  })
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
