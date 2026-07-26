import { useState, useEffect } from 'react'
import axios from 'axios'
import Login from './Login'
import FormularioBoleta from './components/FormularioBoleta'
import { getToken, removeToken, isAuthenticated, getMe } from './services/authService'
import './App.css'

// Configurar interceptor de Axios para incluir JWT
axios.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken()
      window.location.reload()
    }
    return Promise.reject(error)
  }
)

export default function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken()
      if (!token || !isAuthenticated()) {
        removeToken()
        setLoading(false)
        return
      }
      
      try {
        const user = await getMe(token)
        setCurrentUser({
          user: user.username,
          departamento: user.departamento,
          brigadas: user.brigadas,
          rol: user.rol,
        })
      } catch {
        removeToken()
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  const handleLogout = () => {
    removeToken()
    setCurrentUser(null)
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#0f172a',
        color: '#ffffff'
      }}>
        Cargando...
      </div>
    )
  }

  return (
    <div>
      {!currentUser ? (
        <Login onLogin={(user) => setCurrentUser(user)} />
      ) : (
        <div>
          <header className="app-header">
            <span className="user-badge">
              Usuario: <strong>{currentUser.user}</strong> | Rol:{' '}
              <strong>{currentUser.rol === 'administrador' ? 'Administrador' : 'Usuario'}</strong> | Asignación:{' '}
              <strong>{currentUser.departamento}</strong>
            </span>
            <button className="btn-logout" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </header>
          <FormularioBoleta sessionUser={currentUser} />
        </div>
      )}
    </div>
  )
}
