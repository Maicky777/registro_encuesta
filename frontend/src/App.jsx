import { useState, useEffect } from 'react'
import Login from './Login'
import FormularioBoleta from './components/FormularioBoleta'
import { getToken, removeToken, isAuthenticated, getMe } from './services/authService'

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
        const user = await getMe()
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
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
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
          <header className="bg-slate-900 text-white py-3 px-6 flex justify-between items-center shadow-md">
            <span className="text-sm text-slate-200">
              Usuario: <strong className="text-sky-400">{currentUser.user}</strong> | Rol:{' '}
              <strong className="text-sky-400">{currentUser.rol === 'administrador' ? 'Administrador' : 'Usuario'}</strong> | Asignación:{' '}
              <strong className="text-sky-400">{currentUser.departamento}</strong>
            </span>
            <button
              className="bg-slate-800 text-white border border-slate-700 px-3 py-1 rounded text-xs font-semibold cursor-pointer hover:bg-slate-700 transition-colors"
              onClick={handleLogout}
            >
              Cerrar Sesión
            </button>
          </header>
          <FormularioBoleta sessionUser={currentUser} />
        </div>
      )}
    </div>
  )
}
